import { supabase } from "../db/client.js";

// ─── Record score snapshot ───────────────────────────────────────
export async function recordScoreSnapshot(siteId: string): Promise<void> {
  // Get current audit summary
  const { data: audits } = await supabase
    .from("audits")
    .select("seo_score, geo_score, total_score, recommendations")
    .eq("site_id", siteId);

  if (!audits || audits.length === 0) return;

  const n = audits.length;
  const avgSeo = Math.round(audits.reduce((s, a) => s + a.seo_score, 0) / n);
  const avgGeo = Math.round(audits.reduce((s, a) => s + a.geo_score, 0) / n);
  const avgTotal = Math.round(audits.reduce((s, a) => s + a.total_score, 0) / n);
  const critical = audits.reduce((s, a) => s + ((a.recommendations as any[]) || []).filter((r: any) => r.priority === "critical").length, 0);

  await supabase.from("score_history").insert({
    site_id: siteId,
    avg_seo_score: avgSeo,
    avg_geo_score: avgGeo,
    avg_total_score: avgTotal,
    pages_audited: n,
    critical_issues: critical,
  });

  console.log(`   📊 Score snapshot recorded: SEO ${avgSeo}, GEO ${avgGeo}, Total ${avgTotal}`);
}

// ─── Get score history for a site ────────────────────────────────
export async function getScoreHistory(siteId: string, limit: number = 30) {
  const { data } = await supabase
    .from("score_history")
    .select("*")
    .eq("site_id", siteId)
    .order("recorded_at", { ascending: false })
    .limit(limit);

  return (data || []).reverse(); // Oldest first for charts
}

// ─── Re-crawl a site (full pipeline) ─────────────────────────────
export async function reCrawlSite(siteId: string): Promise<void> {
  const { data: site } = await supabase
    .from("sites")
    .select("domain, settings")
    .eq("id", siteId)
    .single();

  if (!site) return;

  // Record current scores before re-crawl
  await recordScoreSnapshot(siteId);

  // Import and run crawler with auto pipeline
  const { crawlSite } = await import("./crawler.js");
  await crawlSite({
    siteId,
    domain: site.domain,
    maxDepth: site.settings?.max_depth ?? 3,
    maxPages: site.settings?.max_pages ?? 100,
    respectRobots: false,
    delayMs: 800,
    useJsRendering: true,
    autoPipeline: true,
  });
}
