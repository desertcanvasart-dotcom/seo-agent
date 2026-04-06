// ─── SEO Checker ─────────────────────────────────────────────────
// Analyzes a page's on-page SEO signals and returns structured checks

interface SeoCheckResult {
  pass: boolean;
  value?: string | number | null;
  issue?: string | null;
}

interface ImageAltCheck {
  pass: boolean;
  missing_count: number;
  total: number;
  missing_srcs: string[];
}

interface HeadingCheck {
  pass: boolean;
  issues: string[];
}

interface BrokenLinkCheck {
  pass: boolean;
  count: number;
  urls: string[];
}

export interface SeoChecks {
  title: SeoCheckResult;
  meta_description: SeoCheckResult;
  h1: SeoCheckResult;
  heading_hierarchy: HeadingCheck;
  image_alt: ImageAltCheck;
  word_count: SeoCheckResult;
  internal_links: SeoCheckResult;
  canonical: SeoCheckResult;
  url_structure: SeoCheckResult;
}

interface PageInput {
  url: string;
  path: string;
  title: string | null;
  meta_description: string | null;
  h1: string | null;
  headings: { level: number; text: string }[];
  body_text: string;
  word_count: number;
  outbound_links: { url: string; anchorText: string; isInternal: boolean }[];
  content_type: string;
}

export function runSeoChecks(page: PageInput, html?: string): SeoChecks {
  // ── Title ──
  const titleCheck = checkTitle(page.title, page.content_type);

  // ── Meta Description ──
  const metaCheck = checkMetaDescription(page.meta_description);

  // ── H1 ──
  const h1Check = checkH1(page.h1, page.headings);

  // ── Heading Hierarchy ──
  const headingCheck = checkHeadingHierarchy(page.headings);

  // ── Image Alt (from HTML if available) ──
  const imageCheck = checkImageAlts(html || "");

  // ── Word Count ──
  const wordCountCheck = checkWordCount(page.word_count, page.content_type);

  // ── Internal Links ──
  const internalLinks = page.outbound_links.filter((l) => l.isInternal);
  const internalLinksCheck = checkInternalLinks(internalLinks.length, page.content_type);

  // ── Canonical ──
  const canonicalCheck = checkCanonical(html || "", page.url);

  // ── URL Structure ──
  const urlCheck = checkUrlStructure(page.path);

  return {
    title: titleCheck,
    meta_description: metaCheck,
    h1: h1Check,
    heading_hierarchy: headingCheck,
    image_alt: imageCheck,
    word_count: wordCountCheck,
    internal_links: internalLinksCheck,
    canonical: canonicalCheck,
    url_structure: urlCheck,
  };
}

// ── Calculate SEO score from checks (0-100) ──
export function calculateSeoScore(checks: SeoChecks): number {
  const weights: Record<keyof SeoChecks, number> = {
    title: 20,
    meta_description: 15,
    h1: 15,
    heading_hierarchy: 10,
    image_alt: 5,
    word_count: 15,
    internal_links: 10,
    canonical: 5,
    url_structure: 5,
  };

  let score = 0;
  for (const [key, weight] of Object.entries(weights)) {
    const check = checks[key as keyof SeoChecks];
    if (check.pass) score += weight;
  }

  return score;
}

// ─── Individual Check Functions ──────────────────────────────────

function checkTitle(title: string | null, contentType: string): SeoCheckResult {
  if (!title) return { pass: false, value: null, issue: "Missing title tag" };
  if (title.length < 10) return { pass: false, value: title, issue: `Too short (${title.length} chars, min 10)` };
  if (title.length > 60) return { pass: false, value: title, issue: `Too long (${title.length} chars, max 60)` };
  if (title.toLowerCase().includes("untitled") || title.toLowerCase().includes("home"))
    return { pass: false, value: title, issue: "Generic title — should be descriptive" };
  return { pass: true, value: title, issue: null };
}

function checkMetaDescription(desc: string | null): SeoCheckResult {
  if (!desc) return { pass: false, value: null, issue: "Missing meta description" };
  if (desc.length < 50) return { pass: false, value: desc, issue: `Too short (${desc.length} chars, min 50)` };
  if (desc.length > 160) return { pass: false, value: desc, issue: `Too long (${desc.length} chars, max 160)` };
  return { pass: true, value: desc, issue: null };
}

function checkH1(h1: string | null, headings: { level: number; text: string }[]): SeoCheckResult {
  const h1Count = headings.filter((h) => h.level === 1).length;
  if (!h1 || h1Count === 0) return { pass: false, value: null, issue: "Missing H1 tag" };
  if (h1Count > 1) return { pass: false, value: h1, issue: `Multiple H1 tags (${h1Count} found) — should have exactly 1` };
  if (h1.length < 5) return { pass: false, value: h1, issue: "H1 too short" };
  return { pass: true, value: h1, issue: null };
}

function checkHeadingHierarchy(headings: { level: number; text: string }[]): HeadingCheck {
  const issues: string[] = [];

  if (headings.length === 0) {
    return { pass: false, issues: ["No headings found on page"] };
  }

  // Check for skipped levels (e.g., H1 → H3 without H2)
  const levels = headings.map((h) => h.level);
  for (let i = 1; i < levels.length; i++) {
    if (levels[i] > levels[i - 1] + 1) {
      issues.push(`Skipped heading level: H${levels[i - 1]} → H${levels[i]}`);
      break; // Only flag once
    }
  }

  // Check for empty headings
  const empty = headings.filter((h) => !h.text.trim());
  if (empty.length > 0) {
    issues.push(`${empty.length} empty heading(s)`);
  }

  return { pass: issues.length === 0, issues };
}

function checkImageAlts(html: string): ImageAltCheck {
  // Simple regex-based check (we don't have cheerio here)
  const imgRegex = /<img[^>]*>/gi;
  const images = html.match(imgRegex) || [];
  const total = images.length;

  const missingSrcs: string[] = [];
  let missingCount = 0;

  for (const img of images) {
    const hasAlt = /alt\s*=\s*"[^"]+"/i.test(img) || /alt\s*=\s*'[^']+'/i.test(img);
    if (!hasAlt) {
      missingCount++;
      const srcMatch = img.match(/src\s*=\s*["']([^"']+)["']/i);
      if (srcMatch) missingSrcs.push(srcMatch[1]);
    }
  }

  return {
    pass: missingCount === 0,
    missing_count: missingCount,
    total,
    missing_srcs: missingSrcs.slice(0, 5), // Only keep first 5
  };
}

function checkWordCount(wordCount: number, contentType: string): SeoCheckResult {
  const minimums: Record<string, number> = {
    homepage: 200,
    blog: 300,
    tour: 300,
    destination: 300,
    page: 200,
    info: 100,
    legal: 100,
    category: 50,
  };

  const min = minimums[contentType] || 200;

  if (wordCount < min) {
    return { pass: false, value: wordCount, issue: `Thin content (${wordCount} words, min ${min} for ${contentType})` };
  }

  return { pass: true, value: wordCount, issue: null };
}

function checkInternalLinks(count: number, contentType: string): SeoCheckResult {
  if (contentType === "legal" || contentType === "info") {
    return { pass: true, value: count, issue: null }; // Don't penalize legal/info pages
  }

  if (count === 0) return { pass: false, value: 0, issue: "No internal links — page is isolated" };
  if (count < 3) return { pass: false, value: count, issue: `Only ${count} internal link(s), aim for 3+` };
  return { pass: true, value: count, issue: null };
}

function checkCanonical(html: string, pageUrl: string): SeoCheckResult {
  const match = html.match(/<link[^>]*rel\s*=\s*["']canonical["'][^>]*href\s*=\s*["']([^"']+)["']/i);
  if (!match) return { pass: false, value: null, issue: "Missing canonical tag" };

  const canonical = match[1];
  // Check if canonical points to a different URL (potential issue)
  const cleanPage = pageUrl.replace(/\/$/, "");
  const cleanCanonical = canonical.replace(/\/$/, "");
  if (cleanCanonical !== cleanPage) {
    return { pass: true, value: canonical, issue: `Canonical points to different URL: ${canonical}` };
  }

  return { pass: true, value: canonical, issue: null };
}

function checkUrlStructure(path: string): SeoCheckResult {
  const issues: string[] = [];

  if (path.length > 75) issues.push("URL too long (over 75 chars)");
  if (/[A-Z]/.test(path)) issues.push("URL contains uppercase letters");
  if (/_/.test(path)) issues.push("URL uses underscores instead of hyphens");
  if (/\s/.test(path)) issues.push("URL contains spaces");
  if (/[?&]/.test(path) && !path.includes("wp-")) issues.push("URL contains query parameters");
  if ((path.match(/\//g) || []).length > 4) issues.push("URL too deep (more than 4 levels)");

  if (issues.length > 0) {
    return { pass: false, value: path, issue: issues.join("; ") };
  }

  return { pass: true, value: path, issue: null };
}
