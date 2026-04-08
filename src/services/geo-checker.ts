// ─── GEO Checker ─────────────────────────────────────────────────
// Analyzes a page's Generative Engine Optimization signals
// How well will AI assistants (ChatGPT, Perplexity, Google AI) cite this content?

export interface GeoChecks {
  citability: CitabilityCheck;
  ai_crawler_access: AiCrawlerCheck;
  schema_completeness: SchemaCheck;
  eeat_signals: EeatCheck;
  content_structure: ContentStructureCheck;
  llms_txt: LlmsTxtCheck;
}

interface CitabilityCheck {
  score: number; // 0-100
  citable_blocks: { text: string; word_count: number; score: number }[];
  issues: string[];
}

interface AiCrawlerCheck {
  pass: boolean;
  bots: Record<string, boolean>;
  issues: string[];
}

interface SchemaCheck {
  score: number;
  present: string[];
  missing: string[];
  issues: string[];
}

interface EeatCheck {
  score: number;
  signals_found: string[];
  issues: string[];
}

interface ContentStructureCheck {
  pass: boolean;
  has_lists: boolean;
  has_tables: boolean;
  has_faq_structure: boolean;
  paragraph_count: number;
  avg_paragraph_length: number;
  issues: string[];
}

interface LlmsTxtCheck {
  exists: boolean;
  issue: string | null;
}

interface PageInput {
  url: string;
  path: string;
  title: string | null;
  body_text: string;
  word_count: number;
  headings: { level: number; text: string }[];
  schema_types: string[];
  has_json_ld: boolean;
  content_type: string;
}

// ─── Main GEO Check Runner ──────────────────────────────────────
export function runGeoChecks(
  page: PageInput,
  html: string,
  robotsTxt: string | null,
  llmsTxtExists: boolean
): GeoChecks {
  return {
    citability: checkCitability(page.body_text, page.headings),
    ai_crawler_access: checkAiCrawlerAccess(robotsTxt),
    schema_completeness: checkSchemaCompleteness(page.schema_types, page.has_json_ld, page.content_type),
    eeat_signals: checkEeatSignals(html, page.body_text),
    content_structure: checkContentStructure(html, page.body_text, page.headings),
    llms_txt: { exists: llmsTxtExists, issue: llmsTxtExists ? null : "No llms.txt file found at site root" },
  };
}

// ── Calculate GEO score from checks (0-100) ──
export function calculateGeoScore(checks: GeoChecks): number {
  const weights = {
    citability: 30,
    ai_crawler_access: 15,
    schema_completeness: 20,
    eeat_signals: 15,
    content_structure: 15,
    llms_txt: 5,
  };

  let score = 0;
  score += (checks.citability.score / 100) * weights.citability;
  score += (checks.ai_crawler_access.pass ? 1 : 0) * weights.ai_crawler_access;
  score += (checks.schema_completeness.score / 100) * weights.schema_completeness;
  score += (checks.eeat_signals.score / 100) * weights.eeat_signals;
  score += (checks.content_structure.pass ? 1 : 0) * weights.content_structure;
  score += (checks.llms_txt.exists ? 1 : 0) * weights.llms_txt;

  return Math.round(score);
}

// ─── Citability Checker ──────────────────────────────────────────
// AI assistants cite content that is: self-contained, fact-rich,
// 134-167 words per block, answers a question directly
function checkCitability(bodyText: string, headings: { level: number; text: string }[]): CitabilityCheck {
  const issues: string[] = [];
  const citableBlocks: { text: string; word_count: number; score: number }[] = [];

  // Split text into paragraphs (by double newline or heading boundaries)
  const paragraphs = bodyText
    .split(/\n\s*\n|\.\s{2,}/)
    .map((p) => p.trim())
    .filter((p) => p.length > 50);

  if (paragraphs.length === 0) {
    return { score: 0, citable_blocks: [], issues: ["No substantial paragraphs found"] };
  }

  // Score each paragraph for citability
  for (const para of paragraphs) {
    const words = para.split(/\s+/).length;
    let blockScore = 0;

    // Ideal length: 134-167 words
    if (words >= 100 && words <= 200) blockScore += 30;
    else if (words >= 50 && words <= 300) blockScore += 15;
    else blockScore += 5;

    // Contains factual signals (numbers, dates, names)
    if (/\d{4}/.test(para)) blockScore += 10; // Years
    if (/\d+%/.test(para)) blockScore += 10; // Percentages
    if (/\d+\s*(km|miles|meters|feet|hours|days|USD|EUR|\$|£)/.test(para)) blockScore += 10; // Measurements
    if (/according to|research shows|studies show|experts|officially/i.test(para)) blockScore += 10; // Authority signals

    // Self-contained (starts with a topic sentence)
    if (/^[A-Z][^.]+\s(is|are|was|were|has|have|provides|offers|features|includes)/i.test(para)) blockScore += 15;

    // Answers a question pattern
    if (/^(what|how|why|when|where|who|which)\s/i.test(para)) blockScore += 10;
    if (headings.some((h) => /\?/.test(h.text))) blockScore += 5; // Page has Q&A structure

    // Cap at 100
    blockScore = Math.min(blockScore, 100);

    if (blockScore >= 30) {
      citableBlocks.push({
        text: para.slice(0, 200) + (para.length > 200 ? "..." : ""),
        word_count: words,
        score: blockScore,
      });
    }
  }

  // Overall citability score
  if (citableBlocks.length === 0) {
    issues.push("No citable content blocks found — AI assistants are unlikely to quote this page");
  } else if (citableBlocks.length < 3) {
    issues.push("Few citable blocks — add more self-contained, fact-rich paragraphs");
  }

  const avgBlockScore = citableBlocks.length > 0
    ? citableBlocks.reduce((sum, b) => sum + b.score, 0) / citableBlocks.length
    : 0;

  // Bonus for having many citable blocks
  const quantityBonus = Math.min(citableBlocks.length * 5, 20);
  const overallScore = Math.min(Math.round(avgBlockScore + quantityBonus), 100);

  return {
    score: overallScore,
    citable_blocks: citableBlocks.slice(0, 5), // Top 5 blocks
    issues,
  };
}

// ─── AI Crawler Access ───────────────────────────────────────────
function checkAiCrawlerAccess(robotsTxt: string | null): AiCrawlerCheck {
  const aiBots = [
    "GPTBot",
    "ChatGPT-User",
    "ClaudeBot",
    "anthropic-ai",
    "Google-Extended",
    "PerplexityBot",
    "Bytespider",
    "CCBot",
    "Amazonbot",
    "FacebookExternalHit",
    "Applebot-Extended",
    "cohere-ai",
    "Diffbot",
    "Meta-ExternalAgent",
  ];

  const bots: Record<string, boolean> = {};
  const issues: string[] = [];

  if (!robotsTxt) {
    // No robots.txt = all bots allowed
    for (const bot of aiBots) bots[bot] = true;
    return { pass: true, bots, issues: [] };
  }

  const lines = robotsTxt.toLowerCase().split("\n");

  // Check for blanket disallow
  let inWildcard = false;
  let wildcardDisallow = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("user-agent:")) {
      const agent = trimmed.split(":")[1]?.trim();
      inWildcard = agent === "*";
    } else if (inWildcard && trimmed.startsWith("disallow: /") && trimmed === "disallow: /") {
      wildcardDisallow = true;
    }
  }

  // Check each bot
  for (const bot of aiBots) {
    let isBlocked = wildcardDisallow; // Start with wildcard rule
    let hasSpecificRule = false;

    let inBotSection = false;
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith("user-agent:")) {
        const agent = trimmed.split(":")[1]?.trim();
        inBotSection = agent === bot.toLowerCase();
      } else if (inBotSection) {
        if (trimmed === "disallow: /") {
          isBlocked = true;
          hasSpecificRule = true;
        } else if (trimmed === "allow: /") {
          isBlocked = false;
          hasSpecificRule = true;
        }
      }
    }

    bots[bot] = !isBlocked;
    if (isBlocked) {
      issues.push(`${bot} is blocked${hasSpecificRule ? " (specific rule)" : " (wildcard Disallow: /)"}`);
    }
  }

  const allBlocked = Object.values(bots).every((v) => !v);
  const someBlocked = Object.values(bots).some((v) => !v);

  if (allBlocked) issues.unshift("ALL AI crawlers are blocked — your content cannot be cited by any AI assistant");
  else if (someBlocked) issues.unshift("Some AI crawlers are blocked");

  return { pass: !allBlocked, bots, issues };
}

// ─── Schema Completeness ─────────────────────────────────────────
function checkSchemaCompleteness(
  schemaTypes: string[],
  hasJsonLd: boolean,
  contentType: string
): SchemaCheck {
  const issues: string[] = [];

  // Recommended schemas per content type
  const recommended: Record<string, string[]> = {
    homepage: ["Organization", "WebSite", "SearchAction"],
    blog: ["Article", "BlogPosting", "BreadcrumbList"],
    product: ["Product", "Offer", "FAQPage", "BreadcrumbList"],
    service: ["Service", "Offer", "BreadcrumbList"],
    page: ["WebPage", "BreadcrumbList"],
    info: ["WebPage", "FAQPage"],
    category: ["CollectionPage", "BreadcrumbList"],
    legal: ["WebPage"],
  };

  const rec = recommended[contentType] || recommended.page;
  const present = schemaTypes.filter((s) => rec.some((r) => s.toLowerCase().includes(r.toLowerCase())));
  const missing = rec.filter((r) => !schemaTypes.some((s) => s.toLowerCase().includes(r.toLowerCase())));

  if (!hasJsonLd) {
    issues.push("No JSON-LD structured data found");
  }

  if (missing.length > 0) {
    issues.push(`Missing recommended schemas: ${missing.join(", ")}`);
  }

  const score = rec.length > 0 ? Math.round((present.length / rec.length) * 100) : 0;

  return { score, present: schemaTypes, missing, issues };
}

// ─── E-E-A-T Signals ─────────────────────────────────────────────
function checkEeatSignals(html: string, bodyText: string): EeatCheck {
  const signals: string[] = [];
  const issues: string[] = [];
  let score = 0;

  // Experience signals
  if (/first-hand|firsthand|personal experience|i visited|we visited|our team|our guide/i.test(bodyText)) {
    signals.push("First-hand experience language");
    score += 15;
  }

  if (/photo by|photographed by|our photo|taken by/i.test(html)) {
    signals.push("Original photography credited");
    score += 10;
  }

  // Expertise signals
  if (/expert|specialist|certified|licensed|professional|years of experience|\d+ years/i.test(bodyText)) {
    signals.push("Expertise claims present");
    score += 10;
  }

  // Author information
  if (/author|written by|by\s+[A-Z][a-z]+\s+[A-Z]/i.test(html)) {
    signals.push("Author attribution found");
    score += 15;
  } else {
    issues.push("No author attribution — add author name and bio");
  }

  // Authoritativeness
  if (/award|recognized|featured in|as seen on|partner|member of/i.test(bodyText)) {
    signals.push("Authority signals (awards, partnerships)");
    score += 10;
  }

  if (/tripadvisor|trustpilot|google review|rated|star rating|\d\.\d\/5/i.test(html)) {
    signals.push("Review/rating signals");
    score += 10;
  }

  // Trustworthiness
  if (/privacy policy|terms|secure|ssl|https/i.test(html)) {
    signals.push("Trust signals (privacy/terms links)");
    score += 5;
  }

  if (/last updated|updated on|published on|date/i.test(html)) {
    signals.push("Content freshness signals");
    score += 10;
  } else {
    issues.push("No publication/update date — add dates for freshness signals");
  }

  if (/source|reference|according to|cited|data from/i.test(bodyText)) {
    signals.push("Sources/references cited");
    score += 15;
  } else {
    issues.push("No sources cited — add references to build trust");
  }

  if (signals.length < 3) {
    issues.unshift("Weak E-E-A-T signals — AI assistants prefer authoritative, experience-backed content");
  }

  return { score: Math.min(score, 100), signals_found: signals, issues };
}

// ─── Content Structure ───────────────────────────────────────────
function checkContentStructure(
  html: string,
  bodyText: string,
  headings: { level: number; text: string }[]
): ContentStructureCheck {
  const issues: string[] = [];

  // Check for lists
  const hasLists = /<[uo]l[^>]*>/.test(html);

  // Check for tables
  const hasTables = /<table[^>]*>/.test(html);

  // Check for FAQ structure (questions in headings)
  const questionHeadings = headings.filter((h) => /\?/.test(h.text) || /^(what|how|why|when|where|who|which|can|do|is|are)/i.test(h.text));
  const hasFaqStructure = questionHeadings.length >= 2;

  // Paragraph analysis
  const paragraphs = bodyText.split(/\n\s*\n/).filter((p) => p.trim().length > 20);
  const avgLen = paragraphs.length > 0
    ? Math.round(paragraphs.reduce((s, p) => s + p.split(/\s+/).length, 0) / paragraphs.length)
    : 0;

  if (!hasLists) issues.push("No lists found — lists improve scannability and AI extraction");
  if (!hasFaqStructure) issues.push("No FAQ-style headings — question-based headings boost AI citability");
  if (headings.length < 3) issues.push("Few headings — add more H2/H3 to structure content");
  if (avgLen > 200) issues.push("Paragraphs too long — break into shorter, citable blocks");

  const pass = issues.length <= 1;

  return {
    pass,
    has_lists: hasLists,
    has_tables: hasTables,
    has_faq_structure: hasFaqStructure,
    paragraph_count: paragraphs.length,
    avg_paragraph_length: avgLen,
    issues,
  };
}
