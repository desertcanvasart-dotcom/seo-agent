import { supabase } from "../db/client.js";
import { findSimilarPages } from "./embedder.js";

// ─── Types ───────────────────────────────────────────────────────
interface BriefInput {
  siteId: string;
  targetKeyword: string;
  researchJobId?: string;
  competitorData?: {
    topics: string[];
    avgWordCount: number;
    hasFaq: boolean;
    schemaTypes: string[];
  };
}

interface OutlineSection {
  heading: string;
  talking_points: string[];
  target_word_count: number;
}

interface InternalLinkSuggestion {
  target_url: string;
  target_path: string;
  target_title: string;
  anchor_text: string;
  relevance_score: number;
}

// ─── Generate a content brief ────────────────────────────────────
export async function generateBrief(input: BriefInput): Promise<string> {
  const { siteId, targetKeyword, researchJobId, competitorData } = input;

  console.log(`\n📝 Generating brief for: "${targetKeyword}"`);

  // Step 1: Determine content type and schema from keyword
  const contentMeta = analyzeKeyword(targetKeyword);

  // Step 2: Build outline based on keyword + competitor data
  const outline = buildOutline(targetKeyword, contentMeta, competitorData);

  // Step 3: Generate questions to answer
  const questions = generateQuestions(targetKeyword, contentMeta);

  // Step 4: Calculate recommended word count
  const recommendedWordCount = calculateWordCount(outline, competitorData);

  // Step 5: Find internal link opportunities from existing pages
  const internalLinks = await findInternalLinkOpportunities(siteId, targetKeyword);

  // Step 6: Determine recommended schema
  const recommendedSchema = contentMeta.schemaType;

  // Step 7: GEO optimization hints
  const geoHints = {
    citable_block_targets: Math.max(3, Math.floor(recommendedWordCount / 300)),
    recommended_structure: "Use self-contained paragraphs of 134-167 words that directly answer one question each. Start paragraphs with clear topic sentences.",
    llms_txt_include: true,
    faq_section: true,
    fact_density: "Include specific numbers, dates, prices, and distances. AI assistants prefer fact-rich content they can confidently cite.",
  };

  // Step 8: Generate title suggestion
  const titleSuggestion = generateTitle(targetKeyword, contentMeta);

  // Store the brief
  const { data: brief, error } = await supabase
    .from("content_briefs")
    .insert({
      site_id: siteId,
      research_job_id: researchJobId || null,
      target_keyword: targetKeyword,
      title_suggestion: titleSuggestion,
      outline,
      questions_to_answer: questions,
      recommended_word_count: recommendedWordCount,
      internal_links: internalLinks,
      recommended_schema: recommendedSchema,
      geo_hints: geoHints,
      status: "draft",
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to save brief: ${error.message}`);

  console.log(`   ✅ Brief created: ${brief.id}`);
  return brief.id;
}

// ─── Generate briefs from research gaps ──────────────────────────
export async function generateBriefsFromResearch(
  siteId: string,
  researchJobId: string,
  maxBriefs: number = 10
): Promise<string[]> {
  // Get research job
  const { data: job } = await supabase
    .from("research_jobs")
    .select("*")
    .eq("id", researchJobId)
    .single();

  if (!job || job.status !== "completed") {
    throw new Error("Research job not found or not completed");
  }

  const gaps = (job.topic_gaps as any[]) || [];
  const topGaps = gaps
    .filter((g: any) => !g.our_coverage && g.opportunity_score >= 40)
    .slice(0, maxBriefs);

  console.log(`\n📝 Generating ${topGaps.length} briefs from research gaps`);

  // Build competitor data summary
  const competitors = (job.competitor_analysis as any[]) || [];
  const avgWordCount = competitors.length > 0
    ? Math.round(competitors.reduce((s: number, c: any) => s + (c.word_count || 0), 0) / competitors.length)
    : 1500;
  const hasFaq = competitors.some((c: any) => c.has_faq);
  const allSchemas = competitors.flatMap((c: any) => c.schema_types || []);

  const briefIds: string[] = [];

  for (const gap of topGaps) {
    try {
      const briefId = await generateBrief({
        siteId,
        targetKeyword: gap.topic,
        researchJobId,
        competitorData: {
          topics: gap.competitor_urls || [],
          avgWordCount,
          hasFaq,
          schemaTypes: [...new Set(allSchemas)],
        },
      });
      briefIds.push(briefId);
    } catch (err) {
      console.error(`   ❌ Failed to generate brief for "${gap.topic}":`, (err as Error).message);
    }
  }

  return briefIds;
}

// ─── AI Draft Generation (optional, uses Claude) ─────────────────
export async function generateAiDraft(briefId: string): Promise<void> {
  const { data: brief } = await supabase
    .from("content_briefs")
    .select("*")
    .eq("id", briefId)
    .single();

  if (!brief) throw new Error("Brief not found");

  // Update status
  await supabase
    .from("content_briefs")
    .update({ draft_status: "generating" })
    .eq("id", briefId);

  try {
    // Dynamic import to avoid requiring API key if not generating drafts
    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    const anthropic = new Anthropic();

    const outline = (brief.outline as OutlineSection[]) || [];
    const questions = (brief.questions_to_answer as string[]) || [];
    const internalLinks = (brief.internal_links as InternalLinkSuggestion[]) || [];
    const geoHints = (brief.geo_hints as any) || {};

    const prompt = `Write a comprehensive article based on this content brief.

TITLE: ${brief.title_suggestion}
TARGET KEYWORD: ${brief.target_keyword}
RECOMMENDED WORD COUNT: ${brief.recommended_word_count}

OUTLINE:
${outline.map((s) => `## ${s.heading}\n${s.talking_points.map((p) => `- ${p}`).join("\n")}\nTarget: ~${s.target_word_count} words`).join("\n\n")}

QUESTIONS TO ANSWER IN THE CONTENT:
${questions.map((q) => `- ${q}`).join("\n")}

INTERNAL LINKS TO INCLUDE (use these as contextual links within the text):
${internalLinks.map((l) => `- Link text: "${l.anchor_text}" → ${l.target_url}`).join("\n")}

GEO OPTIMIZATION REQUIREMENTS:
- Write in self-contained paragraphs of 134-167 words each
- Each paragraph should be independently quotable by AI assistants
- Start paragraphs with clear topic sentences
- Include specific facts, numbers, dates, and measurements
- ${geoHints.faq_section ? "Include a FAQ section with 5-7 questions at the end" : ""}

SCHEMA: This article should support ${brief.recommended_schema} structured data.

Write the full article in markdown format. Be factual, specific, and authoritative. Write as a knowledgeable expert with deep subject-matter expertise.`;

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    });

    const draft = response.content
      .filter((c) => c.type === "text")
      .map((c) => (c as any).text)
      .join("");

    await supabase
      .from("content_briefs")
      .update({ ai_draft: draft, draft_status: "ready" })
      .eq("id", briefId);

    console.log(`   ✅ AI draft generated for brief ${briefId}`);
  } catch (err) {
    console.error(`   ❌ AI draft failed:`, (err as Error).message);
    await supabase
      .from("content_briefs")
      .update({ draft_status: "none" })
      .eq("id", briefId);
  }
}

// ─── Helper Functions ────────────────────────────────────────────

function analyzeKeyword(keyword: string): { type: string; schemaType: string; intent: string } {
  const kw = keyword.toLowerCase();

  if (/buy|pricing|purchase|order|subscribe|plan/i.test(kw)) {
    return { type: "product", schemaType: "Product", intent: "transactional" };
  }
  if (/guide|tips|advice|know before|tutorial|walkthrough/i.test(kw)) {
    return { type: "guide", schemaType: "Article", intent: "informational" };
  }
  if (/best|top\s+\d|review|compare|comparison|vs\b/i.test(kw)) {
    return { type: "listicle", schemaType: "Article", intent: "informational" };
  }
  if (/faq|question|how to|what is|when to/i.test(kw)) {
    return { type: "faq", schemaType: "FAQPage", intent: "informational" };
  }
  if (/service|solution|platform|agency|consulting/i.test(kw)) {
    return { type: "service", schemaType: "Service", intent: "transactional" };
  }
  return { type: "article", schemaType: "Article", intent: "informational" };
}

function buildOutline(
  keyword: string,
  meta: { type: string; intent: string },
  competitorData?: BriefInput["competitorData"]
): OutlineSection[] {
  const sections: OutlineSection[] = [];
  const kw = keyword.toLowerCase();

  // Introduction
  sections.push({
    heading: `Introduction to ${capitalize(keyword)}`,
    talking_points: [
      `What is ${keyword} and why it matters`,
      "Set expectations for the reader",
      "Brief overview of what this article covers",
    ],
    target_word_count: 150,
  });

  // Type-specific sections
  if (meta.type === "product" || meta.type === "service") {
    sections.push(
      {
        heading: "Overview & Highlights",
        talking_points: ["Key features and unique selling points", "What makes this stand out", "Who this is best for"],
        target_word_count: 200,
      },
      {
        heading: "Detailed Breakdown & What to Expect",
        talking_points: ["Step-by-step walkthrough", "Key components and features", "Timeline and process"],
        target_word_count: 400,
      },
      {
        heading: "Pricing & What's Included",
        talking_points: ["Price ranges and tiers", "What's included vs extra", "Best value options"],
        target_word_count: 200,
      },
      {
        heading: "Practical Information",
        talking_points: ["How to get started", "Requirements and prerequisites", "Support and resources"],
        target_word_count: 250,
      }
    );
  } else if (meta.type === "guide") {
    sections.push(
      {
        heading: `Why ${capitalize(keyword)} Matters`,
        talking_points: ["Background and context", "Key benefits", "Who should care"],
        target_word_count: 250,
      },
      {
        heading: "Key Aspects to Understand",
        talking_points: ["Core concepts", "Important details", "Common approaches"],
        target_word_count: 400,
      },
      {
        heading: "Step-by-Step Guide",
        talking_points: ["Getting started", "Best practices", "Common pitfalls to avoid"],
        target_word_count: 300,
      },
      {
        heading: "Tips & Recommendations",
        talking_points: ["Expert advice", "Resources and tools", "Next steps"],
        target_word_count: 200,
      }
    );
  } else {
    sections.push(
      {
        heading: `Everything You Need to Know About ${capitalize(keyword)}`,
        talking_points: ["Core information", "Key facts and figures", "Important context"],
        target_word_count: 300,
      },
      {
        heading: "Key Details & Practical Tips",
        talking_points: ["Actionable advice", "Common mistakes to avoid", "Expert recommendations"],
        target_word_count: 300,
      }
    );
  }

  // FAQ section (always include for GEO)
  sections.push({
    heading: "Frequently Asked Questions",
    talking_points: [
      "Answer 5-7 common questions about this topic",
      "Use question as H3, answer in 134-167 word blocks",
      "Each answer should be self-contained and quotable by AI",
    ],
    target_word_count: 500,
  });

  // Conclusion
  sections.push({
    heading: "Final Thoughts",
    talking_points: ["Summary of key takeaways", "Call to action", "Related content to explore"],
    target_word_count: 150,
  });

  return sections;
}

function generateQuestions(keyword: string, meta: { type: string }): string[] {
  const kw = keyword.toLowerCase();
  const questions: string[] = [];

  // Universal questions
  questions.push(`What is the best way to experience ${kw}?`);
  questions.push(`How much does ${kw} cost?`);
  questions.push(`When is the best time for ${kw}?`);

  if (meta.type === "product" || meta.type === "service") {
    questions.push(`What features does ${kw} include?`);
    questions.push(`What are the pros and cons of ${kw}?`);
    questions.push(`Who is ${kw} best suited for?`);
    questions.push(`How do I get started with ${kw}?`);
  } else if (meta.type === "guide") {
    questions.push(`What are the key steps for ${kw}?`);
    questions.push(`What common mistakes should I avoid with ${kw}?`);
    questions.push(`What tools or resources help with ${kw}?`);
    questions.push(`How long does it take to see results from ${kw}?`);
  } else {
    questions.push(`What should I know before ${kw}?`);
    questions.push(`What are the top tips for ${kw}?`);
    questions.push(`Is ${kw} worth it?`);
  }

  return questions.slice(0, 7);
}

function calculateWordCount(
  outline: OutlineSection[],
  competitorData?: BriefInput["competitorData"]
): number {
  const outlineTotal = outline.reduce((s, sec) => s + sec.target_word_count, 0);

  // Aim for at least the outline total, or match competitor average + 20%
  const competitorTarget = competitorData?.avgWordCount
    ? Math.round(competitorData.avgWordCount * 1.2)
    : 0;

  return Math.max(outlineTotal, competitorTarget, 1200);
}

async function findInternalLinkOpportunities(
  siteId: string,
  keyword: string
): Promise<InternalLinkSuggestion[]> {
  // Search existing pages for keyword-related content
  const keywordWords = keyword.toLowerCase().split(/\s+/).filter((w) => w.length > 3);

  const { data: pages } = await supabase
    .from("pages")
    .select("id, url, path, title, body_text, word_count")
    .eq("site_id", siteId)
    .gt("word_count", 100);

  if (!pages) return [];

  // Score each page by keyword relevance
  const scored = pages
    .map((page) => {
      const text = `${page.title} ${page.body_text}`.toLowerCase();
      let score = 0;
      for (const word of keywordWords) {
        if (text.includes(word)) score++;
      }
      // Bonus for title match
      if (page.title?.toLowerCase().includes(keyword.toLowerCase())) score += 3;
      return { ...page, score };
    })
    .filter((p) => p.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  return scored.map((p) => ({
    target_url: p.url,
    target_path: p.path,
    target_title: p.title || p.path,
    anchor_text: p.title || p.path,
    relevance_score: Math.min(p.score / keywordWords.length, 1),
  }));
}

function generateTitle(keyword: string, meta: { type: string; intent: string }): string {
  const kw = capitalize(keyword);

  if (meta.type === "product") return `${kw}: Complete Guide, Features & Pricing`;
  if (meta.type === "guide") return `${kw}: The Ultimate Guide`;
  if (meta.type === "service") return `${kw}: What You Need to Know`;
  if (meta.type === "faq") return `${kw}: Your Questions Answered`;
  if (meta.type === "listicle") return `${kw}: Everything You Need to Know`;
  return `${kw}: A Complete Guide`;
}

function capitalize(str: string): string {
  return str.replace(/\b\w/g, (c) => c.toUpperCase());
}
