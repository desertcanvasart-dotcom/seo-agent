import OpenAI from "openai";
import { supabase } from "../../db/client.js";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ─── Types ───────────────────────────────────────────────────────

export interface RewrittenPassage {
  original_text: string;
  rewritten_text: string;
  original_word_count: number;
  rewritten_word_count: number;
  original_score: number;       // estimated citability 0-100
  rewritten_score: number;      // estimated citability 0-100
  improvement_reason: string;   // what specifically was changed and why
  heading_context: string;      // which H2/H3 section this passage belongs to
}

export interface ContentRewriteResult {
  page_id: string;
  url: string;
  overall_citability_score: number;
  rewrites: RewrittenPassage[];
  faq_additions: FaqPair[];       // Q&A pairs to add at the end of the page
  generated_at: string;
}

interface FaqPair {
  question: string;
  answer: string;   // 80-120 words, self-contained, answer-first
}

interface CitableBlock {
  text: string;
  word_count: number;
  score: number;
}

interface PageInput {
  id: string;
  url: string;
  path: string;
  title: string | null;
  meta_description: string | null;
  h1: string | null;
  headings: { level: number; text: string }[];
  body_text: string;
  word_count: number;
  content_type: string;
}

interface AuditInput {
  citability_score: number;
  citable_blocks: CitableBlock[];
  eeat_score: number;
  content_structure_issues: string[];
}

// ─── Build the system prompt (cacheable) ─────────────────────────
function buildSystemPrompt(): string {
  return `You are a GEO (Generative Engine Optimization) content specialist. Your job is to rewrite web page passages so they are more likely to be cited by AI assistants (ChatGPT, Perplexity, Claude, Google AI Overviews).

## WHAT MAKES CONTENT CITABLE BY AI

Research from Princeton, Georgia Tech, and IIT Delhi (2024) found that AI systems preferentially cite passages that are:
1. **134-167 words** — long enough to be complete, short enough to extract cleanly
2. **Self-contained** — understandable without surrounding context; the subject is named explicitly
3. **Answer-first** — the main point appears in the first 1-2 sentences, not buried at the end
4. **Fact-rich** — contains specific numbers, dates, distances, prices, or named entities
5. **Definition pattern** — uses "X is...", "X refers to...", "X works by..."

## REWRITING RULES
- Preserve ALL factual claims. Only restructure, do not invent facts.
- Never add statistics or data that is not in the original. If a claim needs data, restructure around what exists.
- Start with the direct answer or definition, then add supporting detail.
- Name the subject explicitly in the first sentence (no "it", "this", "they" as openers).
- Target 134-167 words per rewritten block.
- Use active voice.
- Remove filler phrases: "In order to...", "It is important to note that...", "Many people think...", "There are many..."
- Each rewritten passage must stand alone — if you removed everything before and after it, it must still make sense.

## FAQ GENERATION RULES
- Write questions that real users would type into ChatGPT or Google.
- Each answer must be 80-120 words, answer-first, self-contained.
- Use specific facts from the page content.
- Minimum 3, maximum 7 FAQ pairs.
- Questions should cover the most important aspects: What is X? How does X work? How much does X cost? When is the best time? What should I know before?

## OUTPUT FORMAT
Return ONLY a valid JSON object. No prose, no markdown fences, no explanation outside the JSON.

{
  "rewrites": [
    {
      "original_text": "exact original passage",
      "rewritten_text": "improved passage (134-167 words)",
      "original_word_count": 0,
      "rewritten_word_count": 0,
      "original_score": 0,
      "rewritten_score": 0,
      "improvement_reason": "One sentence: what structural change was made and why it improves citability.",
      "heading_context": "The H2 or H3 this passage falls under"
    }
  ],
  "faq_additions": [
    {
      "question": "Question text ending with ?",
      "answer": "80-120 word answer, answer-first, self-contained."
    }
  ]
}`;
}

// ─── Build the user prompt ────────────────────────────────────────
function buildUserPrompt(page: PageInput, audit: AuditInput): string {
  // Select the worst-performing passages to rewrite
  const lowScoringBlocks = audit.citable_blocks
    .filter((b) => b.score < 50 && b.word_count > 20)
    .sort((a, b) => a.score - b.score)
    .slice(0, 5); // Max 5 rewrites to keep response focused

  // Map headings for context
  const headingMap = page.headings
    .filter((h) => h.level <= 3)
    .map((h) => `${"#".repeat(h.level)} ${h.text}`)
    .join("\n");

  return `Rewrite the low-citability passages from this page to improve AI citation likelihood.

## PAGE CONTEXT
URL: ${page.url}
Content type: ${page.content_type}
H1: ${page.h1 || "Missing"}
Overall citability score: ${audit.citability_score}/100
Word count: ${page.word_count}

## PAGE HEADINGS (for context mapping)
${headingMap || "No headings"}

## CONTENT ISSUES IDENTIFIED
${audit.content_structure_issues.join("\n") || "None"}

## LOW-SCORING PASSAGES TO REWRITE
${
  lowScoringBlocks.length > 0
    ? lowScoringBlocks
        .map(
          (b, i) => `
PASSAGE ${i + 1} (score: ${b.score}/100, words: ${b.word_count}):
---
${b.text}
---`
        )
        .join("\n")
    : "No specific blocks scored — rewrite the weakest passages from the content sample below"
}

## FULL CONTENT SAMPLE (for FAQ generation and context)
${page.body_text.split(/\s+/).slice(0, 2000).join(" ")}

## TASKS
1. Rewrite each low-scoring passage above. If fewer than 3 passages were provided, identify additional weak passages from the content sample.
2. Generate ${audit.citability_score < 40 ? "7" : "5"} FAQ pairs based on the content.`;
}

// ─── Main rewriter function ───────────────────────────────────────
export async function rewritePageContent(
  page: PageInput,
  audit: AuditInput
): Promise<ContentRewriteResult> {
  // Only rewrite pages with low citability
  if (audit.citability_score >= 65) {
    return {
      page_id: page.id,
      url: page.url,
      overall_citability_score: audit.citability_score,
      rewrites: [],
      faq_additions: [],
      generated_at: new Date().toISOString(),
    };
  }

  console.log(`   ✍️  Rewriting content for ${page.path} (citability: ${audit.citability_score}/100)`);

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    max_tokens: 4096,
    messages: [
      { role: "system", content: buildSystemPrompt() },
      { role: "user", content: buildUserPrompt(page, audit) },
    ],
  });

  const raw = (response.choices[0].message.content || "")
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  let parsed: { rewrites: RewrittenPassage[]; faq_additions: FaqPair[] } = {
    rewrites: [],
    faq_additions: [],
  };

  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    console.error(`   ❌ Content rewrite parse failed for ${page.path}:`, (err as Error).message);
  }

  return {
    page_id: page.id,
    url: page.url,
    overall_citability_score: audit.citability_score,
    rewrites: parsed.rewrites || [],
    faq_additions: parsed.faq_additions || [],
    generated_at: new Date().toISOString(),
  };
}

// ─── Run rewrites for all low-scoring pages in a site ─────────────
export async function rewriteSiteContent(
  siteId: string,
  options: { maxPages?: number; force?: boolean } = {},
  onProgress?: (done: number, total: number) => void
): Promise<ContentRewriteResult[]> {
  const { maxPages = 10, force = false } = options;

  // Get audits with low citability scores
  const { data: audits } = await supabase
    .from("audits")
    .select(`
      page_id,
      geo_checks,
      pages (
        id, url, path, title, meta_description, h1,
        headings, body_text, word_count, content_type
      )
    `)
    .eq("site_id", siteId)
    .order("geo_score", { ascending: true });

  if (!audits || audits.length === 0) return [];

  // Filter to pages worth rewriting (citability < 65 only)
  // Title/meta fixes are handled by fixes-generator.ts, not here
  const candidates = audits.filter((a) => {
    const geo = a.geo_checks as any;
    const citability = geo?.citability?.score ?? 100;
    return citability < 65;
  });

  // Sort worst-first
  candidates.sort((a, b) => {
    const ga = (a.geo_checks as any)?.citability?.score ?? 100;
    const gb = (b.geo_checks as any)?.citability?.score ?? 100;
    return ga - gb;
  });

  // Dedup: skip pages already rewritten (unless force=true)
  let toProcess = candidates;
  if (!force) {
    const pageIds = candidates.map((a) => (a as any).pages?.id).filter(Boolean);
    const { data: existing } = await supabase
      .from("generated_fixes")
      .select("page_id")
      .eq("site_id", siteId)
      .eq("fix_type", "content_rewrite")
      .neq("status", "dismissed")
      .in("page_id", pageIds);

    const existingIds = new Set((existing || []).map((e) => e.page_id));
    toProcess = candidates.filter((a) => !existingIds.has((a as any).pages?.id));

    if (toProcess.length < candidates.length) {
      console.log(`   ⏭️  Skipping ${candidates.length - toProcess.length} already-rewritten pages`);
    }
  }

  // Cap to maxPages
  toProcess = toProcess.slice(0, maxPages);

  if (toProcess.length === 0) {
    console.log(`   ✓ No pages need rewriting`);
    return [];
  }

  console.log(`\n✍️  Rewriting content for ${toProcess.length} pages (cap: ${maxPages})`);

  const results: ContentRewriteResult[] = [];
  let processed = 0;

  for (const a of toProcess) {
    const page = (a as any).pages;
    if (!page || page.word_count < 100) {
      processed++;
      if (onProgress) onProgress(processed, toProcess.length);
      continue;
    }

    const geo = a.geo_checks as any;

    const audit: AuditInput = {
      citability_score: geo?.citability?.score ?? 0,
      citable_blocks: geo?.citability?.citable_blocks ?? [],
      eeat_score: geo?.eeat_signals?.score ?? 0,
      content_structure_issues: [
        ...(geo?.content_structure?.issues ?? []),
        ...(geo?.eeat_signals?.issues ?? []),
      ],
    };

    try {
      const result = await rewritePageContent(page, audit);

      if (result.rewrites.length > 0 || result.faq_additions.length > 0) {
        await supabase.from("generated_fixes").upsert({
          site_id: siteId,
          page_id: page.id,
          fix_type: "content_rewrite",
          status: "pending",
          generated_content: result as any,
        }, { onConflict: "page_id,fix_type" });

        results.push(result);
        console.log(`   ✅ ${page.path}: ${result.rewrites.length} rewrites, ${result.faq_additions.length} FAQ pairs`);
      }
    } catch (err) {
      console.error(`   ❌ Rewrite failed for ${page.path}:`, (err as Error).message);
    }

    processed++;
    if (onProgress) onProgress(processed, toProcess.length);

    await new Promise((r) => setTimeout(r, 800));
  }

  return results;
}
