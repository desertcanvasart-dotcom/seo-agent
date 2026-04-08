import { Hono } from "hono";
import type { AppEnv } from "../../types/hono.js";
import { supabase } from "../../db/client.js";
import { hashApiKey } from "../middleware/auth.js";

const exportRoutes = new Hono<AppEnv>();

// Auth helper for export routes (supports ?key= query param for downloads)
async function verifyExportAccess(c: any, siteId: string): Promise<boolean> {
  // Try header auth first
  let apiKeyId = c.get("apiKeyId");

  // If no header auth, check query param
  if (!apiKeyId) {
    const key = c.req.query("key");
    if (key) {
      const keyHash = hashApiKey(key);
      const { data } = await supabase.from("api_keys").select("id").eq("key_hash", keyHash).eq("is_active", true).single();
      if (data) apiKeyId = data.id;
    }
  }

  if (!apiKeyId) return false;

  const { data: site } = await supabase.from("sites").select("id").eq("id", siteId).eq("api_key_id", apiKeyId).single();
  return !!site;
}

// GET /sites/:siteId/export/audit.csv — Export audit results as CSV
exportRoutes.get("/audit.csv", async (c) => {
  const siteId = c.req.param("siteId")!;
  if (!(await verifyExportAccess(c, siteId))) return c.json({ error: "Unauthorized" }, 401);

  const { data: audits } = await supabase
    .from("audits")
    .select("seo_score, geo_score, total_score, recommendations, pages(url, path, title, content_type, word_count)")
    .eq("site_id", siteId)
    .order("total_score", { ascending: true });

  if (!audits) return c.json({ error: "No audit data" }, 404);

  const header = "URL,Path,Title,Type,Words,SEO Score,GEO Score,Total Score,Top Issue";
  const rows = audits.map((a: any) => {
    const topIssue = (a.recommendations as any[])?.[0]?.message || "";
    return [
      csvEscape(a.pages?.url || ""),
      csvEscape(a.pages?.path || ""),
      csvEscape(a.pages?.title || ""),
      a.pages?.content_type || "",
      a.pages?.word_count || 0,
      a.seo_score,
      a.geo_score,
      a.total_score,
      csvEscape(topIssue),
    ].join(",");
  });

  const csv = [header, ...rows].join("\n");
  c.header("Content-Type", "text/csv");
  c.header("Content-Disposition", "attachment; filename=audit-report.csv");
  return c.body(csv);
});

// GET /sites/:siteId/export/links.csv — Export link suggestions as CSV
exportRoutes.get("/links.csv", async (c) => {
  const apiKeyId = c.get("apiKeyId");
  const siteId = c.req.param("siteId")!;

  if (!(await verifyExportAccess(c, siteId))) return c.json({ error: "Unauthorized" }, 401);

  const { data: suggestions } = await supabase
    .from("link_suggestions")
    .select("anchor_text, similarity_score, confidence, status, reason, source_page:source_page_id(url, path, title), target_page:target_page_id(url, path, title)")
    .eq("site_id", siteId)
    .order("similarity_score", { ascending: false });

  if (!suggestions) return c.json({ error: "No suggestions" }, 404);

  const header = "From URL,From Path,To URL,To Path,Anchor Text,Similarity,Confidence,Status,Reason";
  const rows = suggestions.map((s: any) => [
    csvEscape(s.source_page?.url || ""),
    csvEscape(s.source_page?.path || ""),
    csvEscape(s.target_page?.url || ""),
    csvEscape(s.target_page?.path || ""),
    csvEscape(s.anchor_text || ""),
    (s.similarity_score * 100).toFixed(1) + "%",
    s.confidence,
    s.status,
    csvEscape(s.reason || ""),
  ].join(","));

  const csv = [header, ...rows].join("\n");
  c.header("Content-Type", "text/csv");
  c.header("Content-Disposition", "attachment; filename=link-suggestions.csv");
  return c.body(csv);
});

// GET /sites/:siteId/export/briefs.csv — Export briefs as CSV
exportRoutes.get("/briefs.csv", async (c) => {
  const siteId = c.req.param("siteId")!;
  if (!(await verifyExportAccess(c, siteId))) return c.json({ error: "Unauthorized" }, 401);

  const { data: briefs } = await supabase
    .from("content_briefs")
    .select("target_keyword, title_suggestion, recommended_word_count, recommended_schema, status, draft_status, created_at")
    .eq("site_id", siteId)
    .order("created_at", { ascending: false });

  if (!briefs) return c.json({ error: "No briefs" }, 404);

  const header = "Keyword,Title,Word Count,Schema,Status,Draft,Created";
  const rows = briefs.map((b: any) => [
    csvEscape(b.target_keyword),
    csvEscape(b.title_suggestion || ""),
    b.recommended_word_count,
    b.recommended_schema,
    b.status,
    b.draft_status,
    new Date(b.created_at).toLocaleDateString(),
  ].join(","));

  const csv = [header, ...rows].join("\n");
  c.header("Content-Type", "text/csv");
  c.header("Content-Disposition", "attachment; filename=content-briefs.csv");
  return c.body(csv);
});

function csvEscape(str: string): string {
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export { exportRoutes };
