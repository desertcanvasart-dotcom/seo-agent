import { Hono } from "hono";
import type { AppEnv } from "../../types/hono.js";
import { supabase } from "../../db/client.js";
import { auditSite } from "../../services/auditor.js";

const audit = new Hono<AppEnv>();

// POST /sites/:siteId/audit — Run audit on all pages
audit.post("/", async (c) => {
  const apiKeyId = c.get("apiKeyId");
  const siteId = c.req.param("siteId")!;

  // Verify ownership
  const { data: site } = await supabase
    .from("sites")
    .select("*")
    .eq("id", siteId)
    .eq("api_key_id", apiKeyId)
    .single();

  if (!site) return c.json({ error: "Site not found" }, 404);
  if (site.crawl_status !== "completed") {
    return c.json({ error: "Site must be crawled before auditing" }, 400);
  }

  // Run audit in background
  auditSite(siteId).catch((err) => {
    console.error(`Audit failed for ${site.domain}:`, err);
  });

  return c.json({ message: "Audit started", site_id: siteId, domain: site.domain });
});

// GET /sites/:siteId/audit — Get audit results
audit.get("/", async (c) => {
  const apiKeyId = c.get("apiKeyId");
  const siteId = c.req.param("siteId")!;

  // Verify ownership
  const { data: site } = await supabase
    .from("sites")
    .select("id")
    .eq("id", siteId)
    .eq("api_key_id", apiKeyId)
    .single();

  if (!site) return c.json({ error: "Site not found" }, 404);

  // Get all audits for this site
  const { data: audits, error } = await supabase
    .from("audits")
    .select(`
      id,
      seo_score,
      geo_score,
      total_score,
      recommendations,
      created_at,
      pages!inner(url, path, title, content_type, word_count)
    `)
    .eq("site_id", siteId)
    .order("total_score", { ascending: true });

  if (error) return c.json({ error: error.message }, 500);

  // Calculate summary stats
  const total = audits?.length || 0;
  const avgSeo = total ? Math.round(audits!.reduce((s, a) => s + a.seo_score, 0) / total) : 0;
  const avgGeo = total ? Math.round(audits!.reduce((s, a) => s + a.geo_score, 0) / total) : 0;
  const avgTotal = total ? Math.round(audits!.reduce((s, a) => s + a.total_score, 0) / total) : 0;

  // Count all recommendations
  const allRecs = audits?.flatMap((a) => a.recommendations as any[]) || [];
  const critical = allRecs.filter((r) => r.priority === "critical").length;
  const high = allRecs.filter((r) => r.priority === "high").length;

  return c.json({
    summary: {
      pages_audited: total,
      avg_seo_score: avgSeo,
      avg_geo_score: avgGeo,
      avg_total_score: avgTotal,
      critical_issues: critical,
      high_issues: high,
    },
    audits,
  });
});

// GET /sites/:siteId/audit/:pageId — Get audit for a specific page
audit.get("/:auditId", async (c) => {
  const apiKeyId = c.get("apiKeyId");
  const siteId = c.req.param("siteId")!;
  const auditId = c.req.param("auditId")!;

  const { data: site } = await supabase
    .from("sites")
    .select("id")
    .eq("id", siteId)
    .eq("api_key_id", apiKeyId)
    .single();

  if (!site) return c.json({ error: "Site not found" }, 404);

  const { data, error } = await supabase
    .from("audits")
    .select("*, pages(url, path, title, content_type)")
    .eq("id", auditId)
    .eq("site_id", siteId)
    .single();

  if (error || !data) return c.json({ error: "Audit not found" }, 404);

  return c.json({ audit: data });
});

export { audit };
