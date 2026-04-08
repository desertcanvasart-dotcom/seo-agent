import { Hono } from "hono";
import type { AppEnv } from "../../types/hono.js";
import { supabase } from "../../db/client.js";
import { reCrawlSite, getScoreHistory, recordScoreSnapshot } from "../../services/scheduler.js";

const schedule = new Hono<AppEnv>();

// POST /sites/:siteId/recrawl — Trigger a full re-crawl + re-audit
schedule.post("/recrawl", async (c) => {
  const apiKeyId = c.get("apiKeyId");
  const siteId = c.req.param("siteId")!;

  const { data: site } = await supabase
    .from("sites")
    .select("*")
    .eq("id", siteId)
    .eq("api_key_id", apiKeyId)
    .single();

  if (!site) return c.json({ error: "Site not found" }, 404);

  if (site.crawl_status === "crawling") {
    return c.json({ error: "Crawl already in progress" }, 409);
  }

  // Run in background
  reCrawlSite(siteId).catch((err) => {
    console.error("Re-crawl failed:", err);
    supabase.from("sites").update({ crawl_status: "failed" }).eq("id", siteId);
  });

  return c.json({ message: "Re-crawl started", domain: site.domain });
});

// GET /sites/:siteId/history — Get score history
schedule.get("/history", async (c) => {
  const apiKeyId = c.get("apiKeyId");
  const siteId = c.req.param("siteId")!;

  const { data: site } = await supabase
    .from("sites")
    .select("id")
    .eq("id", siteId)
    .eq("api_key_id", apiKeyId)
    .single();

  if (!site) return c.json({ error: "Site not found" }, 404);

  const history = await getScoreHistory(siteId);

  return c.json({ history });
});

// POST /sites/:siteId/snapshot — Manually record a score snapshot
schedule.post("/snapshot", async (c) => {
  const apiKeyId = c.get("apiKeyId");
  const siteId = c.req.param("siteId")!;

  const { data: site } = await supabase
    .from("sites")
    .select("id")
    .eq("id", siteId)
    .eq("api_key_id", apiKeyId)
    .single();

  if (!site) return c.json({ error: "Site not found" }, 404);

  await recordScoreSnapshot(siteId);
  return c.json({ message: "Score snapshot recorded" });
});

export { schedule };
