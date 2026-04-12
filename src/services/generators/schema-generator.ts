import OpenAI from "openai";
import { supabase } from "../../db/client.js";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ─── Types ───────────────────────────────────────────────────────

export interface GeneratedSchema {
  schema_type: string;         // e.g. "Organization", "TourPackage", "FAQPage"
  placement: "head" | "body"; // where to insert it in the HTML
  priority: "critical" | "high" | "medium";
  json_ld: string;             // the complete <script type="application/ld+json"> block
  rationale: string;           // one sentence: why this schema helps
}

export interface SchemaGenerationResult {
  page_id: string;
  url: string;
  content_type: string;
  schemas: GeneratedSchema[];
  existing_schemas: string[];   // what was already there
  generated_at: string;
}

interface PageInput {
  id: string;
  url: string;
  path: string;
  title: string | null;
  h1: string | null;
  meta_description: string | null;
  headings: { level: number; text: string }[];
  body_text: string;
  word_count: number;
  content_type: string;
  schema_types: string[];
  has_json_ld: boolean;
  outbound_links: { url: string; anchorText: string; isInternal: boolean }[];
}

interface SiteInput {
  domain: string;
  name?: string;
}

// ─── Schema type map per content type ───────────────────────────
// Defines what schemas are expected and their priority
const SCHEMA_MAP: Record<string, { type: string; priority: "critical" | "high" | "medium" }[]> = {
  homepage: [
    { type: "Organization", priority: "critical" },
    { type: "WebSite", priority: "critical" },
    { type: "SearchAction", priority: "high" },
    { type: "LocalBusiness", priority: "medium" },
  ],
  tour: [
    { type: "TouristTrip", priority: "critical" },
    { type: "Product", priority: "high" },
    { type: "FAQPage", priority: "high" },
    { type: "BreadcrumbList", priority: "medium" },
    { type: "Offer", priority: "medium" },
  ],
  destination: [
    { type: "TouristDestination", priority: "critical" },
    { type: "FAQPage", priority: "high" },
    { type: "BreadcrumbList", priority: "medium" },
  ],
  blog: [
    { type: "Article", priority: "critical" },
    { type: "BreadcrumbList", priority: "high" },
    { type: "FAQPage", priority: "medium" },
  ],
  page: [
    { type: "WebPage", priority: "high" },
    { type: "BreadcrumbList", priority: "medium" },
  ],
  category: [
    { type: "CollectionPage", priority: "high" },
    { type: "BreadcrumbList", priority: "medium" },
  ],
  info: [
    { type: "WebPage", priority: "high" },
    { type: "FAQPage", priority: "medium" },
  ],
  product: [
    { type: "Product", priority: "critical" },
    { type: "Offer", priority: "critical" },
    { type: "FAQPage", priority: "high" },
    { type: "BreadcrumbList", priority: "medium" },
  ],
};

// ─── Determine which schemas are genuinely missing ───────────────
function getMissingSchemas(
  contentType: string,
  existingTypes: string[]
): { type: string; priority: "critical" | "high" | "medium" }[] {
  const expected = SCHEMA_MAP[contentType] || SCHEMA_MAP.page;
  const existing = existingTypes.map((t) => t.toLowerCase());

  return expected.filter(
    ({ type }) => !existing.some((e) => e.includes(type.toLowerCase()))
  );
}

// ─── Build the system prompt ─────────────────────────────────────
function buildSystemPrompt(): string {
  return `You are a structured data specialist generating production-ready JSON-LD schema markup.

RULES — follow all of these exactly:
1. Output ONLY a valid JSON array. No prose, no markdown fences, no explanation outside the JSON.
2. Every JSON-LD block must be complete and valid — parseable by JSON.parse().
3. Use real data from the page. Never use placeholder text like "Your Company" or "Description here".
4. If real data for a required field is unavailable, omit that field rather than using a placeholder.
5. All URLs must be absolute (https://...), never relative.
6. Use ISO 8601 for all dates.
7. Place multiple schemas in a single @graph block when they reference each other.
8. The "json_ld" field must contain the complete <script type="application/ld+json">...</script> tag.
9. The "rationale" field must be one specific sentence explaining how this schema improves AI citation or search visibility for this exact page.
10. sameAs arrays: only include platforms where the entity genuinely appears — do not fabricate URLs.

SCHEMA QUALITY STANDARDS:
- Organization: must include name, url, logo, description, and sameAs with at least the domain's social profiles if discoverable from the page
- Article/BlogPosting: must include headline, datePublished (today if not found), author with name, publisher with logo
- FAQPage: extract actual questions from the headings and content — generate real Q&A pairs, minimum 3
- TouristTrip / TouristDestination: use the actual destination name, description from body text, and known geo data
- Product / Offer: price should only be included if found in the content — omit if not present
- BreadcrumbList: derive from the URL path structure

Return a JSON array of objects with this exact shape:
[
  {
    "schema_type": "string — the @type value(s) in this block, comma-separated if @graph",
    "placement": "head",
    "priority": "critical | high | medium",
    "json_ld": "<script type=\\"application/ld+json\\">{ complete valid JSON-LD }</script>",
    "rationale": "One specific sentence."
  }
]`;
}

// ─── Build the user prompt ────────────────────────────────────────
function buildUserPrompt(page: PageInput, site: SiteInput, missing: { type: string; priority: "critical" | "high" | "medium" }[]): string {
  const baseUrl = `https://${site.domain}`;

  // Extract FAQ pairs from headings + content for FAQPage schema
  const questionHeadings = page.headings
    .filter((h) => /\?/.test(h.text) || /^(what|how|why|when|where|who|which|can|does|is|are)/i.test(h.text))
    .map((h) => h.text)
    .slice(0, 10);

  // Breadcrumb segments from path
  const pathSegments = page.path
    .replace(/^\//, "")
    .split("/")
    .filter(Boolean)
    .map((seg) => seg.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()));

  return `Generate JSON-LD schema markup for the following page.

## PAGE DATA
URL: ${page.url}
Domain: ${site.domain}
Content type: ${page.content_type}
Title: ${page.title || "Not found"}
H1: ${page.h1 || "Not found"}
Meta description: ${page.meta_description || "Not found"}
Word count: ${page.word_count}

## PATH STRUCTURE (for BreadcrumbList)
Segments: ${pathSegments.length > 0 ? pathSegments.join(" → ") : "homepage"}

## HEADINGS (H1–H3 only)
${page.headings
  .filter((h) => h.level <= 3)
  .map((h) => `${"#".repeat(h.level)} ${h.text}`)
  .join("\n") || "No headings found"}

## CONTENT SAMPLE (first 1500 words)
${page.body_text.split(/\s+/).slice(0, 1500).join(" ")}

## EXISTING SCHEMAS (already present — do NOT regenerate these)
${page.schema_types.length > 0 ? page.schema_types.join(", ") : "None"}

## QUESTION-STYLE HEADINGS (for FAQPage extraction)
${questionHeadings.length > 0 ? questionHeadings.join("\n") : "None found"}

## SCHEMAS TO GENERATE (only these, in priority order)
${missing.map((m) => `- ${m.type} [${m.priority}]`).join("\n")}

## SITE CONTEXT
Base URL: ${baseUrl}
Site name: ${site.name || site.domain}

For each schema in the list above, generate a complete JSON-LD block using real data from the page content above. If a FAQ schema is requested, write 3–7 actual Q&A pairs based on the headings and content — do not use generic questions.`;
}

// ─── Main generator function ─────────────────────────────────────
export async function generatePageSchemas(
  page: PageInput,
  site: SiteInput
): Promise<SchemaGenerationResult> {

  const missing = getMissingSchemas(page.content_type, page.schema_types);

  // Nothing to generate — page already has all recommended schemas
  if (missing.length === 0) {
    return {
      page_id: page.id,
      url: page.url,
      content_type: page.content_type,
      schemas: [],
      existing_schemas: page.schema_types,
      generated_at: new Date().toISOString(),
    };
  }

  console.log(`   🔧 Generating schemas for ${page.path}: ${missing.map((m) => m.type).join(", ")}`);

  const systemPrompt = buildSystemPrompt();
  const userPrompt = buildUserPrompt(page, site, missing);

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    max_tokens: 4096,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  });

  const raw = (response.choices[0].message.content || "").trim();

  // Strip markdown fences if Claude added them despite instructions
  const cleaned = raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  let schemas: GeneratedSchema[] = [];
  try {
    schemas = JSON.parse(cleaned);
    if (!Array.isArray(schemas)) schemas = [schemas];
  } catch (err) {
    console.error(`   ❌ Schema JSON parse failed for ${page.path}:`, (err as Error).message);
    console.error("   Raw output:", raw.slice(0, 500));
    schemas = [];
  }

  return {
    page_id: page.id,
    url: page.url,
    content_type: page.content_type,
    schemas,
    existing_schemas: page.schema_types,
    generated_at: new Date().toISOString(),
  };
}

// ─── Generate schemas for all pages in a site ────────────────────
export async function generateSiteSchemas(
  siteId: string,
  onProgress?: (done: number, total: number) => void
): Promise<SchemaGenerationResult[]> {
  const { data: site } = await supabase
    .from("sites")
    .select("domain, name")
    .eq("id", siteId)
    .single();

  if (!site) throw new Error("Site not found");

  // Get pages that are missing schema or have incomplete schema
  const { data: pages } = await supabase
    .from("pages")
    .select("id, url, path, title, h1, meta_description, headings, body_text, word_count, content_type, schema_types, has_json_ld, outbound_links")
    .eq("site_id", siteId)
    .eq("status_code", 200)
    .gt("word_count", 50)
    .order("word_count", { ascending: false }); // Process content-rich pages first

  if (!pages || pages.length === 0) return [];

  console.log(`\n📐 Generating schemas for ${pages.length} pages on ${site.domain}`);

  const results: SchemaGenerationResult[] = [];
  let processed = 0;

  for (const page of pages) {
    const missing = getMissingSchemas(page.content_type, page.schema_types || []);

    if (missing.length === 0) {
      processed++;
      if (onProgress) onProgress(processed, pages.length);
      continue;
    }

    try {
      const result = await generatePageSchemas(page as PageInput, site);

      if (result.schemas.length > 0) {
        // Store in generated_fixes table
        await supabase.from("generated_fixes").upsert({
          site_id: siteId,
          page_id: page.id,
          fix_type: "schema",
          status: "pending",
          generated_content: result as any,
        }, { onConflict: "page_id,fix_type" });

        results.push(result);
        console.log(`   ✅ ${page.path}: ${result.schemas.length} schema(s) generated`);
      }
    } catch (err) {
      console.error(`   ❌ Schema generation failed for ${page.path}:`, (err as Error).message);
    }

    processed++;
    if (onProgress) onProgress(processed, pages.length);

    // Rate limiting between Claude calls
    await new Promise((r) => setTimeout(r, 600));
  }

  console.log(`\n✅ Schema generation complete: ${results.length} pages with new schemas`);
  return results;
}
