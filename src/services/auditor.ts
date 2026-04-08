import { supabase } from "../db/client.js";
import { runSeoChecks, calculateSeoScore, type SeoChecks } from "./seo-checker.js";
import { runGeoChecks, calculateGeoScore, type GeoChecks } from "./geo-checker.js";

interface AuditResult {
  page_id: string;
  seo_score: number;
  geo_score: number;
  total_score: number;
  seo_checks: SeoChecks;
  geo_checks: GeoChecks;
  recommendations: Recommendation[];
}

interface Recommendation {
  priority: "critical" | "high" | "medium" | "low";
  type: string;
  message: string;
  fix?: string;
}

// ─── Audit a single page ─────────────────────────────────────────
export async function auditPage(
  pageId: string,
  siteId: string,
  robotsTxt: string | null,
  llmsTxtExists: boolean
): Promise<AuditResult> {
  // Get page data
  const { data: page, error } = await supabase
    .from("pages")
    .select("*")
    .eq("id", pageId)
    .single();

  if (error || !page) throw new Error(`Page not found: ${pageId}`);

  // Fetch the raw HTML for checks that need it
  let html = "";
  try {
    const res = await fetch(page.url, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
      signal: AbortSignal.timeout(10000),
    });
    if (res.ok) html = await res.text();
  } catch {}

  // Run SEO checks
  const seoChecks = runSeoChecks(
    {
      url: page.url,
      path: page.path,
      title: page.title,
      meta_description: page.meta_description,
      h1: page.h1,
      headings: page.headings || [],
      body_text: page.body_text || "",
      word_count: page.word_count || 0,
      outbound_links: page.outbound_links || [],
      content_type: page.content_type || "page",
    },
    html
  );

  // Run GEO checks
  const geoChecks = runGeoChecks(
    {
      url: page.url,
      path: page.path,
      title: page.title,
      body_text: page.body_text || "",
      word_count: page.word_count || 0,
      headings: page.headings || [],
      schema_types: page.schema_types || [],
      has_json_ld: page.has_json_ld || false,
      content_type: page.content_type || "page",
    },
    html,
    robotsTxt,
    llmsTxtExists
  );

  // Calculate scores
  const seoScore = calculateSeoScore(seoChecks);
  const geoScore = calculateGeoScore(geoChecks);
  const totalScore = Math.round(seoScore * 0.5 + geoScore * 0.5);

  // Generate recommendations
  const recommendations = generateRecommendations(seoChecks, geoChecks, page);

  return {
    page_id: pageId,
    seo_score: seoScore,
    geo_score: geoScore,
    total_score: totalScore,
    seo_checks: seoChecks,
    geo_checks: geoChecks,
    recommendations,
  };
}

// ─── Audit entire site ───────────────────────────────────────────
export async function auditSite(
  siteId: string,
  onProgress?: (done: number, total: number) => void
): Promise<{ results: AuditResult[]; summary: SiteSummary }> {
  // Get site domain
  const { data: site } = await supabase.from("sites").select("domain").eq("id", siteId).single();
  if (!site) throw new Error("Site not found");

  // Fetch robots.txt once for the whole site
  let robotsTxt: string | null = null;
  try {
    const res = await fetch(`https://${site.domain}/robots.txt`, { signal: AbortSignal.timeout(5000) });
    if (res.ok) robotsTxt = await res.text();
  } catch {}

  // Check llms.txt
  let llmsTxtExists = false;
  try {
    const res = await fetch(`https://${site.domain}/llms.txt`, { signal: AbortSignal.timeout(5000) });
    llmsTxtExists = res.ok;
  } catch {}

  // Get all pages
  const { data: pages } = await supabase
    .from("pages")
    .select("id")
    .eq("site_id", siteId)
    .not("status_code", "is", null)
    .eq("status_code", 200);

  if (!pages || pages.length === 0) throw new Error("No pages to audit");

  console.log(`\n🔍 Starting audit: ${site.domain} (${pages.length} pages)`);

  const results: AuditResult[] = [];

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];

    try {
      console.log(`   📋 [${i + 1}/${pages.length}] Auditing page...`);
      const result = await auditPage(page.id, siteId, robotsTxt, llmsTxtExists);
      results.push(result);

      // Store in database
      await supabase.from("audits").upsert(
        {
          page_id: page.id,
          site_id: siteId,
          seo_score: result.seo_score,
          geo_score: result.geo_score,
          total_score: result.total_score,
          seo_checks: result.seo_checks as any,
          geo_checks: result.geo_checks as any,
          recommendations: result.recommendations as any,
        },
        { onConflict: "page_id" }
      );

      if (onProgress) onProgress(i + 1, pages.length);
    } catch (err) {
      console.error(`   ❌ Audit failed for page ${page.id}:`, (err as Error).message);
    }

    // Small delay to avoid hammering the site
    await new Promise((r) => setTimeout(r, 200));
  }

  // Calculate summary
  const summary = calculateSummary(results);

  console.log(`\n✅ Audit complete: ${site.domain}`);
  console.log(`   Pages audited: ${results.length}`);
  console.log(`   Avg SEO score: ${summary.avg_seo_score}`);
  console.log(`   Avg GEO score: ${summary.avg_geo_score}`);
  console.log(`   Critical issues: ${summary.critical_count}`);

  // Auto-record score snapshot
  try {
    const { recordScoreSnapshot } = await import("./scheduler.js");
    await recordScoreSnapshot(siteId);
  } catch {}

  return { results, summary };
}

// ─── Generate Recommendations ────────────────────────────────────
function generateRecommendations(seo: SeoChecks, geo: GeoChecks, page: any): Recommendation[] {
  const recs: Recommendation[] = [];

  // SEO recommendations
  if (!seo.title.pass) {
    recs.push({
      priority: "critical",
      type: "missing_title",
      message: seo.title.issue || "Fix title tag",
      fix: seo.title.value ? undefined : `Add a descriptive title (30-60 chars) for ${page.path}`,
    });
  }

  if (!seo.meta_description.pass) {
    recs.push({
      priority: "high",
      type: "missing_meta",
      message: seo.meta_description.issue || "Fix meta description",
      fix: "Add a compelling meta description (50-160 chars) that includes target keywords",
    });
  }

  if (!seo.h1.pass) {
    recs.push({
      priority: "high",
      type: "h1_issue",
      message: seo.h1.issue || "Fix H1 tag",
    });
  }

  if (!seo.heading_hierarchy.pass) {
    for (const issue of seo.heading_hierarchy.issues) {
      recs.push({ priority: "medium", type: "heading_hierarchy", message: issue });
    }
  }

  if (!seo.image_alt.pass && seo.image_alt.missing_count > 0) {
    recs.push({
      priority: "medium",
      type: "missing_alt",
      message: `${seo.image_alt.missing_count} of ${seo.image_alt.total} images missing alt text`,
      fix: "Add descriptive alt text to all images",
    });
  }

  if (!seo.word_count.pass) {
    recs.push({
      priority: "high",
      type: "thin_content",
      message: seo.word_count.issue || "Content too thin",
      fix: "Expand content with useful, relevant information",
    });
  }

  if (!seo.internal_links.pass) {
    recs.push({
      priority: "high",
      type: "low_internal_links",
      message: seo.internal_links.issue || "Add more internal links",
    });
  }

  if (!seo.canonical.pass) {
    recs.push({
      priority: "medium",
      type: "missing_canonical",
      message: seo.canonical.issue || "Add canonical tag",
    });
  }

  // GEO recommendations
  if (geo.citability.score < 30) {
    recs.push({
      priority: "high",
      type: "low_citability",
      message: "Content is unlikely to be cited by AI assistants",
      fix: "Add self-contained, fact-rich paragraphs (134-167 words) that directly answer questions",
    });
  }

  if (!geo.ai_crawler_access.pass) {
    recs.push({
      priority: "critical",
      type: "ai_bots_blocked",
      message: "AI crawlers are blocked by robots.txt",
      fix: "Update robots.txt to allow GPTBot, ClaudeBot, and other AI crawlers",
    });
  }

  if (geo.schema_completeness.score < 50) {
    recs.push({
      priority: "high",
      type: "missing_schema",
      message: `Missing schema markup: ${geo.schema_completeness.missing.join(", ")}`,
      fix: "Add JSON-LD structured data for better AI understanding",
    });
  }

  if (geo.eeat_signals.score < 30) {
    recs.push({
      priority: "medium",
      type: "weak_eeat",
      message: "Weak E-E-A-T signals",
      fix: "Add author bios, dates, sources, and first-hand experience language",
    });
  }

  if (!geo.content_structure.pass) {
    for (const issue of geo.content_structure.issues) {
      recs.push({ priority: "medium", type: "content_structure", message: issue });
    }
  }

  if (!geo.llms_txt.exists) {
    recs.push({
      priority: "low",
      type: "missing_llms_txt",
      message: "No llms.txt file — add one to help AI assistants understand your site",
    });
  }

  // Sort by priority
  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  recs.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return recs;
}

// ─── Site Summary ────────────────────────────────────────────────
interface SiteSummary {
  pages_audited: number;
  avg_seo_score: number;
  avg_geo_score: number;
  avg_total_score: number;
  critical_count: number;
  high_count: number;
  medium_count: number;
  low_count: number;
  top_issues: { type: string; count: number; priority: string }[];
}

function calculateSummary(results: AuditResult[]): SiteSummary {
  const n = results.length || 1;

  const avgSeo = Math.round(results.reduce((s, r) => s + r.seo_score, 0) / n);
  const avgGeo = Math.round(results.reduce((s, r) => s + r.geo_score, 0) / n);
  const avgTotal = Math.round(results.reduce((s, r) => s + r.total_score, 0) / n);

  // Count issues by priority
  const allRecs = results.flatMap((r) => r.recommendations);
  const critical = allRecs.filter((r) => r.priority === "critical").length;
  const high = allRecs.filter((r) => r.priority === "high").length;
  const medium = allRecs.filter((r) => r.priority === "medium").length;
  const low = allRecs.filter((r) => r.priority === "low").length;

  // Top issues by frequency
  const issueCounts = new Map<string, { count: number; priority: string }>();
  for (const rec of allRecs) {
    const existing = issueCounts.get(rec.type) || { count: 0, priority: rec.priority };
    issueCounts.set(rec.type, { count: existing.count + 1, priority: rec.priority });
  }

  const topIssues = Array.from(issueCounts.entries())
    .map(([type, data]) => ({ type, ...data }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return {
    pages_audited: results.length,
    avg_seo_score: avgSeo,
    avg_geo_score: avgGeo,
    avg_total_score: avgTotal,
    critical_count: critical,
    high_count: high,
    medium_count: medium,
    low_count: low,
    top_issues: topIssues,
  };
}
