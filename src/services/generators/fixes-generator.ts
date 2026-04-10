import Anthropic from "@anthropic-ai/sdk";
import { supabase } from "../../db/client.js";

const anthropic = new Anthropic();

// ─── Types ───────────────────────────────────────────────────────

export interface RobotsFix {
  site_id: string;
  domain: string;
  current_robots_txt: string | null;
  fixed_robots_txt: string;         // complete corrected file
  lines_to_add: string;             // just the new/changed lines, for minimal-change approach
  blocked_bots: string[];           // which bots were blocked
  now_allowed: string[];            // which bots the fix unblocks
  explanation: string;              // plain-English summary of what changed and why
  generated_at: string;
}

export interface MetaTitleFix {
  page_id: string;
  url: string;
  path: string;
  content_type: string;
  current_title: string | null;
  suggested_title: string | null;
  title_issue: string | null;
  current_meta: string | null;
  suggested_meta: string | null;
  meta_issue: string | null;
  generated_at: string;
}

// ─────────────────────────────────────────────────────────────────
// ROBOTS.TXT FIXER
// ─────────────────────────────────────────────────────────────────

const AI_BOTS = [
  "GPTBot",           // ChatGPT / OpenAI
  "Google-Extended",  // Gemini / Google AI training
  "Googlebot",        // Google Search + AI Overviews
  "bingbot",          // Bing Copilot + ChatGPT (via Bing)
  "PerplexityBot",    // Perplexity AI
  "ClaudeBot",        // Anthropic Claude
  "Amazonbot",        // Alexa / Amazon AI
  "CCBot",            // Common Crawl
  "FacebookExternalHit", // Meta AI
  "Bytespider",       // TikTok / ByteDance AI
  "Applebot-Extended", // Apple Intelligence
];

function buildRobotsSystemPrompt(): string {
  return `You are a robots.txt specialist fixing AI crawler access issues.

TASK: Given a current robots.txt and a list of blocked AI crawlers, produce a corrected robots.txt that allows all AI crawlers while preserving all other existing directives.

RULES:
1. Preserve ALL existing directives for Googlebot, human browsers, and non-AI crawlers exactly.
2. Remove or replace any Disallow: / rules that block AI crawlers.
3. For each blocked AI crawler, add an explicit Allow: / rule in their User-agent block, or remove their Disallow: / if it exists.
4. If a wildcard User-agent: * with Disallow: / is the root cause, do NOT remove it blindly — instead add explicit User-agent blocks for each AI crawler with Allow: / ABOVE the wildcard block (robots.txt is processed top-to-bottom, first match wins).
5. Keep the file clean and well-commented.
6. Output format: a JSON object with EXACTLY these fields:
   {
     "fixed_robots_txt": "complete corrected file as a string with \\n line breaks",
     "lines_to_add": "only the new/changed directives as a string — what to add if the user wants minimal changes",
     "explanation": "2-3 sentences in plain English: what was blocking the bots, what the fix does, why it matters for AI search visibility"
   }
7. Output ONLY valid JSON. No prose, no markdown fences.`;
}

export async function generateRobotsFix(siteId: string): Promise<RobotsFix> {
  const { data: site } = await supabase
    .from("sites")
    .select("domain")
    .eq("id", siteId)
    .single();

  if (!site) throw new Error("Site not found");

  // Get the most recent audit to find which bots are blocked
  const { data: audit } = await supabase
    .from("audits")
    .select("geo_checks")
    .eq("site_id", siteId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  const geoChecks = audit?.geo_checks as any;
  const botStatus: Record<string, boolean> = geoChecks?.ai_crawler_access?.bots ?? {};
  const blockedBots = Object.entries(botStatus)
    .filter(([, allowed]) => !allowed)
    .map(([bot]) => bot);

  if (blockedBots.length === 0) {
    throw new Error("No AI crawlers are blocked — no robots.txt fix needed");
  }

  // Fetch the actual robots.txt
  let currentRobotsTxt: string | null = null;
  try {
    const res = await fetch(`https://${site.domain}/robots.txt`, {
      signal: AbortSignal.timeout(8000),
    });
    if (res.ok) currentRobotsTxt = await res.text();
  } catch {}

  console.log(`\n🤖 Generating robots.txt fix for ${site.domain}`);
  console.log(`   Blocked bots: ${blockedBots.join(", ")}`);

  const userPrompt = `Fix the robots.txt for ${site.domain}.

CURRENTLY BLOCKED AI CRAWLERS:
${blockedBots.map((b) => `- ${b}`).join("\n")}

CURRENT ROBOTS.TXT CONTENT:
${currentRobotsTxt ? `\`\`\`\n${currentRobotsTxt}\n\`\`\`` : "(robots.txt not found or not accessible — generate a complete new one that allows all AI crawlers and has standard Googlebot/sitemap directives)"}

All AI crawlers listed above must be explicitly allowed. Preserve all other existing rules.`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2048,
    system: buildRobotsSystemPrompt(),
    messages: [{ role: "user", content: userPrompt }],
  });

  const raw = response.content
    .filter((c) => c.type === "text")
    .map((c) => (c as any).text)
    .join("")
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  let parsed: { fixed_robots_txt: string; lines_to_add: string; explanation: string } = {
    fixed_robots_txt: "",
    lines_to_add: "",
    explanation: "",
  };

  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    console.error(`   ❌ Robots.txt fix parse failed:`, (err as Error).message);
    throw new Error("Failed to parse robots.txt fix response");
  }

  const result: RobotsFix = {
    site_id: siteId,
    domain: site.domain,
    current_robots_txt: currentRobotsTxt,
    fixed_robots_txt: parsed.fixed_robots_txt,
    lines_to_add: parsed.lines_to_add,
    blocked_bots: blockedBots,
    now_allowed: blockedBots,
    explanation: parsed.explanation,
    generated_at: new Date().toISOString(),
  };

  await supabase.from("generated_fixes").upsert({
    site_id: siteId,
    page_id: null,
    fix_type: "robots_txt",
    status: "pending",
    generated_content: result as any,
  }, { onConflict: "site_id,fix_type" });

  console.log(`   ✅ robots.txt fix generated — unblocks: ${blockedBots.join(", ")}`);
  return result;
}

// ─────────────────────────────────────────────────────────────────
// META TITLE & DESCRIPTION GENERATOR
// ─────────────────────────────────────────────────────────────────

function buildMetaSystemPrompt(): string {
  return `You are an SEO copywriter specialising in page titles and meta descriptions.

TITLE RULES:
- 30-60 characters (never exceed 60 — Google truncates at ~60)
- Include the primary keyword near the front
- Be specific: describe what the page actually offers
- For pages that are part of a site, include the site name only if it fits: "Keyword — Brand Name"
- Never use generic words like "Home", "Page", "Welcome", "Untitled"
- Use power words where natural: "Complete", "Guide", "Best", "How to", specific numbers

META DESCRIPTION RULES:
- 120-155 characters (never exceed 155)
- Include the primary keyword naturally
- Lead with value — what will the user get or learn?
- Include a soft call to action where appropriate: "Discover...", "Learn how...", "Find out..."
- Be specific — mention a key fact, number, or differentiator from the page
- Do NOT use ALL CAPS or excessive punctuation

OUTPUT FORMAT — return ONLY a valid JSON array, no prose, no markdown:
[
  {
    "page_id": "string",
    "url": "string",
    "path": "string",
    "content_type": "string",
    "current_title": "string or null",
    "suggested_title": "string or null (null if current is fine)",
    "title_issue": "string or null",
    "current_meta": "string or null",
    "suggested_meta": "string or null (null if current is fine)",
    "meta_issue": "string or null"
  }
]`;
}

export async function generateMetaTitleFixes(siteId: string): Promise<MetaTitleFix[]> {
  // Get pages with failing title or meta checks
  const { data: audits } = await supabase
    .from("audits")
    .select(`
      page_id,
      seo_checks,
      pages (
        id, url, path, title, meta_description, h1,
        headings, body_text, word_count, content_type
      )
    `)
    .eq("site_id", siteId);

  if (!audits || audits.length === 0) return [];

  // Filter to pages with title or meta issues
  const failing = audits.filter((a) => {
    const seo = a.seo_checks as any;
    return !seo?.title?.pass || !seo?.meta_description?.pass;
  });

  if (failing.length === 0) return [];

  console.log(`\n🏷️  Generating title/meta fixes for ${failing.length} pages`);

  // Build a compact page list for the prompt
  const pageList = failing.map((a) => {
    const page = (a as any).pages;
    const seo = a.seo_checks as any;
    return {
      page_id: page.id,
      url: page.url,
      path: page.path,
      content_type: page.content_type,
      current_title: page.title,
      title_issue: seo?.title?.issue || null,
      current_meta: page.meta_description,
      meta_issue: seo?.meta_description?.issue || null,
      h1: page.h1,
      headings: (page.headings || [])
        .filter((h: any) => h.level <= 3)
        .map((h: any) => h.text)
        .slice(0, 5),
      body_sample: (page.body_text || "").split(/\s+/).slice(0, 80).join(" "),
    };
  });

  // Process in batches of 10 to keep prompts manageable
  const batchSize = 10;
  const results: MetaTitleFix[] = [];

  for (let i = 0; i < pageList.length; i += batchSize) {
    const batch = pageList.slice(i, i + batchSize);

    const userPrompt = `Generate improved titles and meta descriptions for these ${batch.length} pages.

For each page, use the H1, headings, and content sample to understand what the page is about, then write a specific title and meta description.

PAGES:
${JSON.stringify(batch, null, 2)}

Return a JSON array with one object per page using the schema from your instructions. Set suggested_title to null if the current title is fine (30-60 chars, specific, keyword-first). Set suggested_meta to null if the current meta is fine (120-155 chars, specific, includes keyword).`;

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 3000,
      system: buildMetaSystemPrompt(),
      messages: [{ role: "user", content: userPrompt }],
    });

    const raw = response.content
      .filter((c) => c.type === "text")
      .map((c) => (c as any).text)
      .join("")
      .trim()
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    try {
      const parsed: MetaTitleFix[] = JSON.parse(raw);
      const withTimestamp = parsed.map((p) => ({
        ...p,
        generated_at: new Date().toISOString(),
      }));
      results.push(...withTimestamp);

      // Store each fix
      for (const fix of withTimestamp) {
        if (fix.suggested_title || fix.suggested_meta) {
          await supabase.from("generated_fixes").upsert({
            site_id: siteId,
            page_id: fix.page_id,
            fix_type: "meta_title",
            status: "pending",
            generated_content: fix as any,
          }, { onConflict: "page_id,fix_type" });
        }
      }

      console.log(`   ✅ Batch ${Math.floor(i / batchSize) + 1}: ${parsed.length} pages processed`);
    } catch (err) {
      console.error(`   ❌ Meta/title parse failed for batch ${i}:`, (err as Error).message);
    }

    await new Promise((r) => setTimeout(r, 500));
  }

  return results;
}
