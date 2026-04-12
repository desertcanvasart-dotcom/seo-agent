import OpenAI from "openai";
import { supabase } from "../../db/client.js";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ─── Types ───────────────────────────────────────────────────────

export interface RobotsFix {
  site_id: string;
  domain: string;
  current_robots_txt: string | null;
  fixed_robots_txt: string;         // complete corrected file
  lines_to_add: string;             // just the new/changed lines, for minimal-change approach
  blocked_bots: string[];           // which bots were blocked
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

/**
 * Generates a corrected robots.txt that unblocks AI crawlers.
 * Returns null if no fix is needed (all bots are already allowed).
 */
export async function generateRobotsFix(siteId: string): Promise<RobotsFix | null> {
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

  // No fix needed — all bots already allowed. Return null instead of throwing.
  if (blockedBots.length === 0) {
    console.log(`   ✓ No robots.txt fix needed for ${site.domain} — all AI bots already allowed`);
    return null;
  }

  // Fetch the actual robots.txt
  let currentRobotsTxt: string | null = null;
  try {
    const res = await fetch(`https://${site.domain}/robots.txt`, {
      signal: AbortSignal.timeout(8000),
    });
    if (res.ok) currentRobotsTxt = await res.text();
  } catch {}

  // Dedup: if a non-dismissed robots fix exists and the current robots.txt
  // hasn't changed, return the cached result.
  const { data: existing } = await supabase
    .from("generated_fixes")
    .select("generated_content, status")
    .eq("site_id", siteId)
    .eq("fix_type", "robots_txt")
    .is("page_id", null)
    .neq("status", "dismissed")
    .maybeSingle();

  if (existing) {
    const prev = existing.generated_content as RobotsFix;
    if (prev.current_robots_txt === currentRobotsTxt) {
      console.log(`   ⏭️  robots.txt unchanged — returning cached fix`);
      return prev;
    }
  }

  console.log(`\n🤖 Generating robots.txt fix for ${site.domain}`);
  console.log(`   Blocked bots: ${blockedBots.join(", ")}`);

  const userPrompt = `Fix the robots.txt for ${site.domain}.

CURRENTLY BLOCKED AI CRAWLERS:
${blockedBots.map((b) => `- ${b}`).join("\n")}

CURRENT ROBOTS.TXT CONTENT:
${currentRobotsTxt ? `\`\`\`\n${currentRobotsTxt}\n\`\`\`` : "(robots.txt not found or not accessible — generate a complete new one that allows all AI crawlers and has standard Googlebot/sitemap directives)"}

All AI crawlers listed above must be explicitly allowed. Preserve all other existing rules.`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    max_tokens: 2048,
    messages: [
      { role: "system", content: buildRobotsSystemPrompt() },
      { role: "user", content: userPrompt },
    ],
  });

  const raw = (response.choices[0].message.content || "")
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  let parsed: { fixed_robots_txt: string; lines_to_add: string; explanation: string };

  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    console.error(`   ❌ Robots.txt fix parse failed:`, (err as Error).message);
    throw new Error("Failed to parse robots.txt fix response");
  }

  // Validate the output contains at least one User-agent directive
  if (!parsed.fixed_robots_txt || !/User-agent:/i.test(parsed.fixed_robots_txt)) {
    throw new Error("Generated robots.txt is invalid — missing User-agent directive");
  }

  const result: RobotsFix = {
    site_id: siteId,
    domain: site.domain,
    current_robots_txt: currentRobotsTxt,
    fixed_robots_txt: parsed.fixed_robots_txt,
    lines_to_add: parsed.lines_to_add,
    blocked_bots: blockedBots,
    explanation: parsed.explanation,
    generated_at: new Date().toISOString(),
  };

  const { error: upsertErr } = await supabase.from("generated_fixes").upsert({
    site_id: siteId,
    page_id: null,
    fix_type: "robots_txt",
    status: "pending",
    generated_content: result as any,
  }, { onConflict: "site_id,fix_type" });
  if (upsertErr) {
    console.error(`   ❌ generated_fixes upsert (robots_txt) failed: ${upsertErr.message}`);
  }

  console.log(`   ✅ robots.txt fix generated — unblocks: ${blockedBots.join(", ")}`);
  return result;
}

// ─────────────────────────────────────────────────────────────────
// META TITLE & DESCRIPTION GENERATOR
// ─────────────────────────────────────────────────────────────────

const TITLE_MAX = 60;
const META_MAX = 155;

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
    "suggested_title": "string (always provide a new title)",
    "title_issue": "string or null",
    "current_meta": "string or null",
    "suggested_meta": "string (always provide a new meta)",
    "meta_issue": "string or null"
  }
]`;
}

/**
 * Generates improved titles and meta descriptions for pages with failing
 * title or meta audit checks.
 *
 * @param siteId  Site UUID
 * @param options.maxPages  Cap on how many pages to process (default 50)
 * @param options.force     If true, regenerate even if a prior fix exists
 */
export async function generateMetaTitleFixes(
  siteId: string,
  options: { maxPages?: number; force?: boolean } = {}
): Promise<MetaTitleFix[]> {
  const { maxPages = 50, force = false } = options;

  // Get pages with failing title or meta checks
  const { data: audits } = await supabase
    .from("audits")
    .select(`
      page_id,
      seo_checks,
      seo_score,
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

  if (failing.length === 0) {
    console.log(`   ✓ No meta/title fixes needed`);
    return [];
  }

  // Sort worst SEO score first so the cap catches the worst pages
  failing.sort((a, b) => (a.seo_score ?? 0) - (b.seo_score ?? 0));

  // Dedup: skip pages with existing non-dismissed fix AND unchanged title/meta
  let candidates = failing;
  if (!force) {
    const pageIds = failing.map((a) => (a as any).pages?.id).filter(Boolean);
    const { data: existing } = await supabase
      .from("generated_fixes")
      .select("page_id, generated_content")
      .eq("site_id", siteId)
      .eq("fix_type", "meta_title")
      .neq("status", "dismissed")
      .in("page_id", pageIds);

    const existingMap = new Map<string, any>(
      (existing || []).map((e) => [e.page_id, e.generated_content])
    );

    candidates = failing.filter((a) => {
      const page = (a as any).pages;
      if (!page) return false;
      const prev = existingMap.get(page.id);
      if (!prev) return true;
      // Regenerate if current title/meta have changed since last fix
      return prev.current_title !== page.title || prev.current_meta !== page.meta_description;
    });

    if (candidates.length < failing.length) {
      console.log(`   ⏭️  Skipping ${failing.length - candidates.length} already-fixed pages`);
    }
  }

  // Apply cap
  candidates = candidates.slice(0, maxPages);

  if (candidates.length === 0) {
    return [];
  }

  console.log(`\n🏷️  Generating title/meta fixes for ${candidates.length} pages (cap: ${maxPages})`);

  // Build a compact page list for the prompt
  const pageList = candidates.map((a) => {
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

  // Batch size of 5 — better JSON reliability. A malformed batch loses 5 pages, not 10.
  const batchSize = 5;
  const results: MetaTitleFix[] = [];

  for (let i = 0; i < pageList.length; i += batchSize) {
    const batch = pageList.slice(i, i + batchSize);

    const userPrompt = `Generate improved titles and meta descriptions for these ${batch.length} pages.

These pages have already been flagged as failing title or meta audit checks — generate new values for every page. Use the H1, headings, and content sample to understand what each page is about.

PAGES:
${JSON.stringify(batch, null, 2)}

Return a JSON array with one object per page. Always provide both suggested_title (30-60 chars) and suggested_meta (120-155 chars).`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 3000,
      messages: [
        { role: "system", content: buildMetaSystemPrompt() },
        { role: "user", content: userPrompt },
      ],
    });

    const raw = (response.choices[0].message.content || "")
      .trim()
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    try {
      const parsed: MetaTitleFix[] = JSON.parse(raw);

      // Validate and trim overlong outputs
      const validated = parsed.map((p) => {
        let title = p.suggested_title;
        let meta = p.suggested_meta;

        if (title && title.length > TITLE_MAX) {
          console.warn(`   ⚠️  Title too long (${title.length} chars) for ${p.path} — trimming`);
          title = title.slice(0, TITLE_MAX).trim();
        }
        if (meta && meta.length > META_MAX) {
          console.warn(`   ⚠️  Meta too long (${meta.length} chars) for ${p.path} — trimming`);
          meta = meta.slice(0, META_MAX).trim();
        }

        return {
          ...p,
          suggested_title: title,
          suggested_meta: meta,
          generated_at: new Date().toISOString(),
        };
      });

      results.push(...validated);

      // Store each fix
      for (const fix of validated) {
        if (fix.suggested_title || fix.suggested_meta) {
          const { error: upsertErr } = await supabase.from("generated_fixes").upsert({
            site_id: siteId,
            page_id: fix.page_id,
            fix_type: "meta_title",
            status: "pending",
            generated_content: fix as any,
          }, { onConflict: "page_id,fix_type" });
          if (upsertErr) {
            console.error(`   ❌ generated_fixes upsert (meta_title) for ${fix.path} failed: ${upsertErr.message}`);
          }
        }
      }

      console.log(`   ✅ Batch ${Math.floor(i / batchSize) + 1}: ${validated.length} pages processed`);
    } catch (err) {
      console.error(`   ❌ Meta/title parse failed for batch ${i / batchSize + 1}:`, (err as Error).message);
    }

    await new Promise((r) => setTimeout(r, 500));
  }

  return results;
}
