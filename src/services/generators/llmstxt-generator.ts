import OpenAI from "openai";
import { supabase } from "../../db/client.js";

import { env } from "../../config/env.js";

const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

// ─── Types ───────────────────────────────────────────────────────

export interface LlmsTxtResult {
  site_id: string;
  domain: string;
  content: string;         // the complete llms.txt file, ready to deploy
  deployment_path: string; // always "/llms.txt"
  word_count: number;
  section_count: number;
  page_count: number;      // how many pages were used to generate this
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
  inbound_link_count: number;
}

// ─── System prompt (cacheable) ───────────────────────────────────
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
8. Section names should be meaningful to AI models: use the site's actual subject area — not "Category 1", "Type A", "Misc".
9. The file should be scannable in under 30 seconds — do not include every page if there are hundreds. Include the most important 30-50 pages maximum.
10. If the site has a clear primary purpose, reflect that in both the summary and section naming.`;
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

// ─── Validate llms.txt output ────────────────────────────────────
function validateLlmsTxt(content: string): { valid: boolean; reason?: string } {
  if (!content.startsWith("#")) return { valid: false, reason: "Missing # heading on line 1" };
  if (!/^>\s/m.test(content)) return { valid: false, reason: "Missing > blockquote summary" };
  if (!/^##+\s/m.test(content)) return { valid: false, reason: "No ## section headings found" };
  return { valid: true };
}

// ─── Count actual prose words (strips URLs and markdown) ─────────
function countWords(content: string): number {
  const stripped = content
    .replace(/https?:\/\/\S+/g, "")   // URLs
    .replace(/^#+\s+/gm, "")            // heading markers
    .replace(/^>\s+/gm, "")             // blockquote markers
    .replace(/^-\s+/gm, "")             // list markers
    .replace(/[*_`~]/g, "")             // inline markdown
    .trim();
  return stripped.split(/\s+/).filter(Boolean).length;
}

// ─── Select the most important pages for llms.txt ───────────────
function selectImportantPages(pages: PageSummary[], limit: number = 100): PageSummary[] {
  const selected = new Map<string, PageSummary>();

  // Always include the homepage
  const homepage = pages.find((p) => p.path === "/" || p.content_type === "homepage");
  if (homepage) selected.set(homepage.url, homepage);

  // Always include hub pages (inbound_link_count > 10)
  for (const page of pages) {
    if (page.inbound_link_count > 10 && selected.size < limit) {
      selected.set(page.url, page);
    }
  }

  // Fill remaining slots with content-rich pages (highest word count first)
  const sortedByWords = [...pages].sort((a, b) => b.word_count - a.word_count);
  for (const page of sortedByWords) {
    if (selected.size >= limit) break;
    if (!selected.has(page.url)) selected.set(page.url, page);
  }

  return Array.from(selected.values());
}

// ─── Main generator ───────────────────────────────────────────────
export async function generateLlmsTxt(siteId: string): Promise<LlmsTxtResult> {
  const { data: site } = await supabase
    .from("sites")
    .select("domain, name")
    .eq("id", siteId)
    .single();

  if (!site) throw new Error("Site not found");

  // Get all crawled pages (filter in JS, not SQL)
  const { data: allPages } = await supabase
    .from("pages")
    .select("url, path, title, content_type, word_count, meta_description, h1, inbound_link_count")
    .eq("site_id", siteId)
    .eq("status_code", 200)
    .gt("word_count", 50);

  if (!allPages || allPages.length === 0) {
    throw new Error("No crawled pages found — run a site crawl first");
  }

  // Filter out noise page types in JS (safer than Postgres string syntax)
  const EXCLUDED_TYPES = new Set(["legal", "info"]);
  const contentPages = allPages.filter((p) => !EXCLUDED_TYPES.has(p.content_type));

  if (contentPages.length === 0) {
    throw new Error("No substantive content pages found");
  }

  // Dedup check: skip if a non-dismissed llms.txt already exists
  // and page count hasn't changed significantly (within 10%)
  const { data: existing } = await supabase
    .from("generated_fixes")
    .select("generated_content, status")
    .eq("site_id", siteId)
    .eq("fix_type", "llms_txt")
    .is("page_id", null)
    .neq("status", "dismissed")
    .maybeSingle();

  if (existing) {
    const prevContent = existing.generated_content as any;
    const prevPageCount = prevContent?.page_count ?? 0;
    const currentCount = contentPages.length;
    const diff = Math.abs(currentCount - prevPageCount) / Math.max(prevPageCount, 1);

    if (prevPageCount > 0 && diff < 0.1) {
      console.log(`   ⏭️  llms.txt unchanged (${currentCount} pages vs ${prevPageCount} previous, within 10%) — skipping`);
      return prevContent as LlmsTxtResult;
    }
  }

  // Select the most important pages
  const pages = selectImportantPages(contentPages as PageSummary[], 100);

  console.log(`\n📄 Generating llms.txt for ${site.domain} (${pages.length} pages selected from ${contentPages.length})`);

  // Build site description from homepage meta or H1
  const homepageData = allPages.find((p) => p.path === "/" || p.content_type === "homepage");
  const siteDescription =
    homepageData?.meta_description ||
    homepageData?.h1 ||
    `Website at ${site.domain}`;

  const siteName = site.name || site.domain;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    max_tokens: 2048,
    messages: [
      { role: "system", content: buildSystemPrompt() },
      {
        role: "user",
        content: buildUserPrompt(site.domain, siteName, siteDescription, pages),
      },
    ],
  });

  const content = (response.choices[0].message.content || "").trim();

  // Validate structural requirements
  const validation = validateLlmsTxt(content);
  if (!validation.valid) {
    throw new Error(`Generated llms.txt is invalid: ${validation.reason}`);
  }

  const result: LlmsTxtResult = {
    site_id: siteId,
    domain: site.domain,
    content,
    deployment_path: "/llms.txt",
    word_count: countWords(content),
    section_count: (content.match(/^##+\s/gm) || []).length,
    page_count: contentPages.length,
    generated_at: new Date().toISOString(),
  };

  // Store in generated_fixes table
  const { error: upsertErr } = await supabase.from("generated_fixes").upsert({
    site_id: siteId,
    page_id: null,
    fix_type: "llms_txt",
    status: "pending",
    generated_content: result as any,
  }, { onConflict: "site_id,fix_type" });
  if (upsertErr) {
    console.error(`   ❌ generated_fixes upsert (llms_txt) failed: ${upsertErr.message}`);
  }

  console.log(`   ✅ llms.txt generated: ${result.section_count} sections, ${result.word_count} words`);

  return result;
}
