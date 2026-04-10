import Anthropic from "@anthropic-ai/sdk";
import { supabase } from "../../db/client.js";

const anthropic = new Anthropic();

// ─── Types ───────────────────────────────────────────────────────

export interface LlmsTxtResult {
  site_id: string;
  domain: string;
  content: string;         // the complete llms.txt file, ready to deploy
  deployment_path: string; // always "/llms.txt"
  word_count: number;
  section_count: number;
  generated_at: string;
}

interface PageSummary {
  url: string;
  path: string;
  title: string | null;
  content_type: string;
  word_count: number;
  meta_description: string | null;
  h1: string | null;
}

// ─── System prompt ───────────────────────────────────────────────
function buildSystemPrompt(): string {
  return `You are generating an llms.txt file — a plain text document at the root of a website that helps AI language models understand the site's content and purpose, similar to how robots.txt helps web crawlers.

## LLMS.TXT STANDARD FORMAT (as of 2026)
The file must follow this exact structure:

\`\`\`
# [Site Name]

> [1-2 sentence summary of what the site is and who it serves]

[Optional: 1-2 sentences of additional context]

## [Section Title]

- [Page Title]: [URL]
- [Page Title]: [URL]

## [Section Title]

- [Page Title]: [URL]
\`\`\`

## RULES
1. Output ONLY the raw llms.txt content. No JSON. No markdown explanation. No code fences.
2. The file starts with # [Site Name] on line 1.
3. The > blockquote summary is mandatory — it tells AI models the site's core purpose in plain language.
4. Sections group related pages. Use clear, descriptive section names.
5. Each page entry is a markdown list item: "- Title: URL"
6. Include only pages with substantial content (skip legal/privacy/login pages unless they are important).
7. Order sections from most important to least important.
8. Section names should be meaningful to AI models: "Travel Tours", "Destination Guides", "Travel Resources" — not "Category 1", "Type A", "Misc".
9. The file should be scannable in under 30 seconds — do not include every page if there are hundreds. Include the most important 30-50 pages maximum.
10. If the site has a clear primary purpose (travel tours, software, recipes), reflect that in both the summary and section naming.`;
}

// ─── User prompt ─────────────────────────────────────────────────
function buildUserPrompt(
  domain: string,
  siteName: string,
  siteDescription: string,
  pages: PageSummary[]
): string {
  // Group pages by content_type
  const grouped: Record<string, PageSummary[]> = {};
  for (const page of pages) {
    const type = page.content_type || "page";
    if (!grouped[type]) grouped[type] = [];
    grouped[type].push(page);
  }

  // Build a readable page inventory
  const pageInventory = Object.entries(grouped)
    .map(([type, pgs]) => {
      const list = pgs
        .slice(0, 20)
        .map((p) => `  - ${p.title || p.h1 || p.path} (${p.word_count} words): ${p.url}`)
        .join("\n");
      return `${type.toUpperCase()} (${pgs.length} pages):\n${list}`;
    })
    .join("\n\n");

  return `Generate an llms.txt file for the following website.

## SITE INFORMATION
Domain: ${domain}
Site name: ${siteName}
Description: ${siteDescription}
Total pages crawled: ${pages.length}

## PAGE INVENTORY BY TYPE
${pageInventory}

Generate the complete llms.txt file content. Group pages into meaningful sections that reflect the site's content structure. Write the summary line (> ...) to clearly explain what the site offers and who it is for, so an AI assistant reading this file immediately understands the site's purpose and authority.`;
}

// ─── Main generator ───────────────────────────────────────────────
export async function generateLlmsTxt(siteId: string): Promise<LlmsTxtResult> {
  const { data: site } = await supabase
    .from("sites")
    .select("domain, name, description")
    .eq("id", siteId)
    .single();

  if (!site) throw new Error("Site not found");

  // Get all crawled pages with content
  const { data: pages } = await supabase
    .from("pages")
    .select("url, path, title, content_type, word_count, meta_description, h1")
    .eq("site_id", siteId)
    .eq("status_code", 200)
    .gt("word_count", 50)
    .not("content_type", "in", '("legal","info")')
    .order("word_count", { ascending: false })
    .limit(100);

  if (!pages || pages.length === 0) {
    throw new Error("No crawled pages found — run a site crawl first");
  }

  console.log(`\n📄 Generating llms.txt for ${site.domain} (${pages.length} pages)`);

  // Build a site description from the crawled data if not stored
  const siteDescription =
    site.description ||
    pages.find((p) => p.path === "/" || p.content_type === "homepage")?.meta_description ||
    `Website at ${site.domain}`;

  const siteName = site.name || site.domain;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2048,
    system: buildSystemPrompt(),
    messages: [
      {
        role: "user",
        content: buildUserPrompt(site.domain, siteName, siteDescription, pages as PageSummary[]),
      },
    ],
  });

  const content = response.content
    .filter((c) => c.type === "text")
    .map((c) => (c as any).text)
    .join("")
    .trim();

  // Validate it starts correctly
  if (!content.startsWith("#")) {
    throw new Error("Generated llms.txt does not start with a # heading — generation failed");
  }

  const result: LlmsTxtResult = {
    site_id: siteId,
    domain: site.domain,
    content,
    deployment_path: "/llms.txt",
    word_count: content.split(/\s+/).length,
    section_count: (content.match(/^##\s/gm) || []).length,
    generated_at: new Date().toISOString(),
  };

  // Store in generated_fixes table
  await supabase.from("generated_fixes").upsert({
    site_id: siteId,
    page_id: null,
    fix_type: "llms_txt",
    status: "pending",
    generated_content: result as any,
  }, { onConflict: "site_id,fix_type" });

  console.log(`   ✅ llms.txt generated: ${result.section_count} sections, ${result.word_count} words`);

  return result;
}
