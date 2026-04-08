import * as cheerio from "cheerio";
import { supabase } from "../db/client.js";

// ─── Types ───────────────────────────────────────────────────────
interface CompetitorPage {
  url: string;
  title: string;
  meta_description: string;
  h1: string;
  headings: string[];
  body_text: string;
  word_count: number;
  topics: string[];
  schema_types: string[];
  has_faq: boolean;
}

interface TopicGap {
  topic: string;
  competitor_coverage: number; // how many competitors cover this
  our_coverage: boolean;       // do we cover it?
  opportunity_score: number;   // 0-100
  competitor_urls: string[];   // which competitors cover it
}

interface CompetitorAnalysis {
  url: string;
  title: string;
  topics_covered: string[];
  word_count: number;
  schema_types: string[];
  has_faq: boolean;
  headings_count: number;
}

// ─── Fetch and parse a competitor page ───────────────────────────
async function fetchCompetitorPage(url: string): Promise<CompetitorPage | null> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) return null;

    const html = await res.text();
    const $ = cheerio.load(html);

    // Remove noise elements
    $("script, style, noscript, iframe, svg").remove();

    const title = $("title").text().trim();
    const metaDesc = $('meta[name="description"]').attr("content")?.trim() || "";
    const h1 = $("h1").first().text().trim();

    // Remove nav, footer, header, sidebar for content extraction
    const contentArea = $("body").clone();
    contentArea.find("nav, header, footer, aside, [role='navigation'], [role='banner'], [role='contentinfo'], form, .nav, .menu, .footer, .header, .sidebar, .cookie, .popup").remove();

    // Headings from content area only
    const headings: string[] = [];
    contentArea.find("h1, h2, h3").each((_, el) => {
      const text = $(el).text().trim();
      if (text && text.length > 3) headings.push(text);
    });

    // Body text from content area
    const bodyText = contentArea.text().replace(/\s+/g, " ").trim();
    const wordCount = bodyText.split(/\s+/).filter(Boolean).length;

    // Extract topics from headings and content
    const topics = extractTopics(headings, bodyText, title);

    // Schema types
    const schemaTypes: string[] = [];
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const data = JSON.parse($(el).html() || "");
        const items = Array.isArray(data) ? data : [data];
        for (const item of items) {
          if (item["@type"]) {
            const types = Array.isArray(item["@type"]) ? item["@type"] : [item["@type"]];
            schemaTypes.push(...types);
          }
        }
      } catch {}
    });

    // FAQ detection
    const hasFaq = headings.some((h) => /\?|faq|frequently asked/i.test(h)) || schemaTypes.includes("FAQPage");

    return {
      url,
      title,
      meta_description: metaDesc,
      h1,
      headings,
      body_text: bodyText.slice(0, 30000),
      word_count: wordCount,
      topics,
      schema_types: schemaTypes,
      has_faq: hasFaq,
    };
  } catch (err) {
    console.error(`   ❌ Failed to fetch ${url}:`, (err as Error).message);
    return null;
  }
}

// ─── Noise words to filter out ───────────────────────────────────
const NOISE_PATTERNS = [
  // Form fields and UI elements
  /^(submit|cancel|close|open|click|select|choose|enter|type|search|filter|sort|clear|reset|apply|save|edit|delete|remove|add|create|update|upload|download|sign|log|register|subscribe|unsubscribe)(\s|$)/i,
  /^(your |my |our |the |a |an )\w{0,10}$/i,
  // Navigation and layout
  /^(menu|nav|header|footer|sidebar|breadcrumb|pagination|next|prev|previous|back|home|sitemap|copyright|all rights|terms|privacy|cookie|accept|decline)/i,
  // Form labels
  /^(first name|last name|email|phone|password|address|city|state|zip|country|date|number of|age of|desired|preferred|select a|choose a|enter your|your name|your email)/i,
  // Generic UI
  /^(read more|learn more|see more|view all|show more|load more|get started|contact us|about us|follow us|share|tweet|pin|like)/i,
  // Too short or just numbers
  /^\d+$|^.{1,4}$/,
  // Common repeated footer/header text
  /^(company|resources|support|help|blog|careers|press|investors|partners|legal|sitemap|social|connect)/i,
];

function isNoise(text: string): boolean {
  const t = text.trim().toLowerCase();
  if (t.length < 8) return true;  // Too short to be meaningful
  if (t.length > 80) return true; // Too long, probably a sentence not a topic
  if (t.split(/\s+/).length < 2) return true; // Single word
  if (t.split(/\s+/).length > 10) return true; // Too many words
  for (const pattern of NOISE_PATTERNS) {
    if (pattern.test(t)) return true;
  }
  return false;
}

// ─── Extract topics from page content ────────────────────────────
function extractTopics(headings: string[], bodyText: string, title: string): string[] {
  const topics = new Set<string>();

  // Topics from headings (most reliable) — but filter noise
  for (const h of headings) {
    const clean = h
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, " ")
      .trim();
    if (!isNoise(clean)) {
      topics.add(clean);
    }
  }

  // Topics from title
  const titleClean = title
    .toLowerCase()
    .replace(/[|–-]\s*[^|–-]*$/, "")
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!isNoise(titleClean)) topics.add(titleClean);

  // Content-focused patterns (questions, guides, comparisons)
  const patterns = [
    /best\s+(?:places?|things?|time|ways?|options?|tools?|practices?)\s+(?:to|in|for)\s+\w[\w\s]{5,40}/gi,
    /(?:how|what|when|where|why)\s+(?:to|is|are|do|does|should|can)\s+\w[\w\s]{5,40}/gi,
    /(?:guide|tips?|review|comparison|overview|introduction|tutorial)\s+(?:to|for|of|on)\s+\w[\w\s]{5,40}/gi,
    /(?:top|best|complete|ultimate|essential|beginner|advanced)\s+\w[\w\s]{5,40}/gi,
    /(?:benefits?|advantages?|features?|pricing|cost)\s+(?:of|for)\s+\w[\w\s]{5,40}/gi,
    /(?:step.by.step|checklist|roadmap|strategy|plan)\s+(?:for|to)\s+\w[\w\s]{5,40}/gi,
  ];

  for (const pattern of patterns) {
    const matches = bodyText.match(pattern) || [];
    for (const match of matches.slice(0, 8)) {
      const clean = match.toLowerCase().replace(/\s+/g, " ").trim();
      if (!isNoise(clean)) topics.add(clean);
    }
  }

  return [...topics].slice(0, 25);
}

// ─── Crawl competitor pages ──────────────────────────────────────
async function crawlCompetitor(baseUrl: string, maxPages: number = 15): Promise<CompetitorPage[]> {
  const pages: CompetitorPage[] = [];
  const visited = new Set<string>();
  const queue = [baseUrl];
  let domain: string;

  try {
    domain = new URL(baseUrl).hostname.replace("www.", "");
  } catch {
    return [];
  }

  console.log(`   🔍 Crawling competitor: ${domain}`);

  while (queue.length > 0 && pages.length < maxPages) {
    const url = queue.shift()!;
    const cleanUrl = url.split("#")[0].replace(/\/$/, "");
    if (visited.has(cleanUrl)) continue;
    visited.add(cleanUrl);

    const page = await fetchCompetitorPage(cleanUrl);
    if (!page || page.word_count < 50) continue;

    pages.push(page);
    console.log(`      📄 [${pages.length}/${maxPages}] ${page.title.slice(0, 60)}`);

    // Find internal links for further crawling
    try {
      const res = await fetch(cleanUrl, {
        headers: { "User-Agent": "Mozilla/5.0", Accept: "text/html" },
        signal: AbortSignal.timeout(10000),
      });
      const html = await res.text();
      const $ = cheerio.load(html);

      $("a[href]").each((_, el) => {
        const href = $(el).attr("href");
        if (!href) return;
        try {
          const abs = new URL(href, cleanUrl);
          if (abs.hostname.replace("www.", "") === domain && !visited.has(abs.href.replace(/\/$/, ""))) {
            queue.push(abs.href);
          }
        } catch {}
      });
    } catch {}

    await new Promise((r) => setTimeout(r, 500)); // Rate limit
  }

  return pages;
}

// ─── Run gap analysis ────────────────────────────────────────────
function analyzeGaps(
  ourTopics: Set<string>,
  competitorPages: CompetitorPage[]
): TopicGap[] {
  // Collect all competitor topics
  const competitorTopicMap = new Map<string, { count: number; urls: string[] }>();

  for (const page of competitorPages) {
    for (const topic of page.topics) {
      const existing = competitorTopicMap.get(topic) || { count: 0, urls: [] };
      existing.count++;
      existing.urls.push(page.url);
      competitorTopicMap.set(topic, existing);
    }
  }

  // Find gaps — topics competitors cover that we don't
  const gaps: TopicGap[] = [];

  for (const [topic, data] of competitorTopicMap) {
    // Check if we cover this topic (fuzzy match)
    const weCover = [...ourTopics].some((t) => {
      return t.includes(topic) || topic.includes(t) || similarWords(t, topic) > 0.6;
    });

    // Score: more competitors covering it = higher opportunity
    const opportunityScore = Math.min(Math.round((data.count / competitorPages.length) * 100 + (weCover ? 0 : 30)), 100);

    gaps.push({
      topic,
      competitor_coverage: data.count,
      our_coverage: weCover,
      opportunity_score: weCover ? Math.max(opportunityScore - 40, 10) : opportunityScore,
      competitor_urls: [...new Set(data.urls)].slice(0, 3),
    });
  }

  // Sort by opportunity (gaps we don't cover first, then by coverage count)
  gaps.sort((a, b) => {
    if (a.our_coverage !== b.our_coverage) return a.our_coverage ? 1 : -1;
    return b.opportunity_score - a.opportunity_score;
  });

  return gaps.slice(0, 50); // Top 50 gaps
}

// ─── Simple word similarity ──────────────────────────────────────
function similarWords(a: string, b: string): number {
  const wordsA = new Set(a.toLowerCase().split(/\s+/));
  const wordsB = new Set(b.toLowerCase().split(/\s+/));
  let overlap = 0;
  for (const w of wordsA) {
    if (wordsB.has(w)) overlap++;
  }
  return overlap / Math.max(wordsA.size, wordsB.size);
}

// ─── Main Research Job ───────────────────────────────────────────
export async function runResearch(
  jobId: string,
  siteId: string,
  competitorUrls: string[],
  keyword?: string
): Promise<void> {
  // Update job status
  await supabase
    .from("research_jobs")
    .update({ status: "running", started_at: new Date().toISOString() })
    .eq("id", jobId);

  console.log(`\n🔬 Starting research job ${jobId}`);

  try {
    // Step 1: Get our topics from our own pages
    const { data: ourPages } = await supabase
      .from("pages")
      .select("title, headings, body_text, path")
      .eq("site_id", siteId)
      .gt("word_count", 50);

    const ourTopics = new Set<string>();
    for (const page of ourPages || []) {
      const headings = (page.headings || []) as { text: string }[];
      const topics = extractTopics(
        headings.map((h) => h.text),
        page.body_text || "",
        page.title || ""
      );
      topics.forEach((t) => ourTopics.add(t));
    }

    console.log(`   Our topics: ${ourTopics.size}`);

    // Step 2: Crawl competitors
    const allCompetitorPages: CompetitorPage[] = [];

    for (const url of competitorUrls) {
      const pages = await crawlCompetitor(url, 15);
      allCompetitorPages.push(...pages);
      console.log(`   ${url}: ${pages.length} pages crawled`);
    }

    // Step 3: Build competitor analysis
    const competitorAnalysis: CompetitorAnalysis[] = allCompetitorPages.map((p) => ({
      url: p.url,
      title: p.title,
      topics_covered: p.topics,
      word_count: p.word_count,
      schema_types: p.schema_types,
      has_faq: p.has_faq,
      headings_count: p.headings.length,
    }));

    // Step 4: Run gap analysis
    const gaps = analyzeGaps(ourTopics, allCompetitorPages);

    // Step 5: Generate opportunities
    const opportunities = gaps
      .filter((g) => !g.our_coverage)
      .map((g) => ({
        keyword: g.topic,
        competitor_coverage: g.competitor_coverage,
        opportunity_score: g.opportunity_score,
        gap_type: "missing" as const,
      }));

    // Store results
    await supabase
      .from("research_jobs")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        competitor_analysis: competitorAnalysis,
        topic_gaps: gaps,
        opportunities: opportunities,
      })
      .eq("id", jobId);

    console.log(`\n✅ Research complete`);
    console.log(`   Competitor pages analyzed: ${allCompetitorPages.length}`);
    console.log(`   Topic gaps found: ${gaps.filter((g) => !g.our_coverage).length}`);
    console.log(`   Total opportunities: ${opportunities.length}`);
  } catch (err) {
    console.error("Research failed:", err);
    await supabase
      .from("research_jobs")
      .update({ status: "failed" })
      .eq("id", jobId);
  }
}
