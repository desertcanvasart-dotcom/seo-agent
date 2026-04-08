import { Hono } from "hono";
import type { AppEnv } from "../../types/hono.js";
import { supabase } from "../../db/client.js";
import { syncGscData, getGscDataForSite } from "../../services/gsc.js";

const gsc = new Hono<AppEnv>();

// POST /sites/:siteId/gsc/sync — Sync GSC data
gsc.post("/sync", async (c) => {
  const apiKeyId = c.get("apiKeyId");
  const siteId = c.req.param("siteId")!;

  const { data: site } = await supabase
    .from("sites")
    .select("*")
    .eq("id", siteId)
    .eq("api_key_id", apiKeyId)
    .single();

  if (!site) return c.json({ error: "Site not found" }, 404);

  const body = await c.req.json().catch(() => ({}));
  const clientEmail = body.client_email || process.env.GSC_CLIENT_EMAIL;
  const privateKey = body.private_key || process.env.GSC_PRIVATE_KEY;

  if (!clientEmail || !privateKey) {
    return c.json({ error: "GSC credentials required. Provide client_email and private_key, or set GSC_CLIENT_EMAIL and GSC_PRIVATE_KEY env vars." }, 400);
  }

  // Run in background
  syncGscData(siteId, site.domain, { client_email: clientEmail, private_key: privateKey }, body.days || 30).catch((err) => {
    console.error("GSC sync failed:", err);
  });

  return c.json({ message: "GSC sync started", domain: site.domain });
});

// GET /sites/:siteId/gsc — Get GSC data
gsc.get("/", async (c) => {
  const apiKeyId = c.get("apiKeyId");
  const siteId = c.req.param("siteId")!;

  const { data: site } = await supabase
    .from("sites")
    .select("id")
    .eq("id", siteId)
    .eq("api_key_id", apiKeyId)
    .single();

  if (!site) return c.json({ error: "Site not found" }, 404);

  const gscData = await getGscDataForSite(siteId);

  const totalClicks = gscData.reduce((s, d) => s + (d.clicks || 0), 0);
  const totalImpressions = gscData.reduce((s, d) => s + (d.impressions || 0), 0);
  const avgPosition = gscData.length > 0
    ? Math.round(gscData.reduce((s, d) => s + (d.position || 0), 0) / gscData.length * 10) / 10
    : 0;

  return c.json({
    summary: {
      total_clicks: totalClicks,
      total_impressions: totalImpressions,
      avg_position: avgPosition,
      pages_with_data: gscData.length,
      date_range: gscData[0]?.date_range || null,
    },
    pages: gscData,
  });
});

export { gsc };
