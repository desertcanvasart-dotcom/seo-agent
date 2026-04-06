import { Hono } from "hono";
import type { AppEnv } from "../../types/hono.js";
import { supabase } from "../../db/client.js";
import { crawlSite } from "../../services/crawler.js";

const crawl = new Hono<AppEnv>();

// POST /sites/:siteId/crawl — Start crawling a site
crawl.post("/", async (c) => {
  const apiKeyId = c.get("apiKeyId");
  const siteId = c.req.param("siteId")!;

  // Verify site ownership
  const { data: site } = await supabase
    .from("sites")
    .select("*")
    .eq("id", siteId)
    .eq("api_key_id", apiKeyId)
    .single();

  if (!site) {
    return c.json({ error: "Site not found" }, 404);
  }

  if (site.crawl_status === "crawling") {
    return c.json({ error: "Crawl already in progress" }, 409);
  }

  // Get settings from request body or use site defaults
  const body = await c.req.json().catch(() => ({}));
  const maxDepth = body.max_depth ?? site.settings?.max_depth ?? 3;
  const maxPages = body.max_pages ?? site.settings?.max_pages ?? 500;
  const delayMs = body.delay_ms ?? 500;

  // Start crawl in background (don't await)
  crawlSite({
    siteId: site.id,
    domain: site.domain,
    maxDepth,
    maxPages,
    respectRobots: body.respect_robots ?? true,
    delayMs,
    useJsRendering: body.use_js_rendering ?? true,
  }).catch(async (err) => {
    console.error(`Crawl failed for ${site.domain}:`, err);
    await supabase
      .from("sites")
      .update({ crawl_status: "failed" })
      .eq("id", siteId);
  });

  return c.json({
    message: "Crawl started",
    site_id: siteId,
    domain: site.domain,
    settings: { max_depth: maxDepth, max_pages: maxPages, delay_ms: delayMs },
  });
});

// GET /sites/:siteId/crawl/status — Check crawl progress
crawl.get("/status", async (c) => {
  const apiKeyId = c.get("apiKeyId");
  const siteId = c.req.param("siteId")!;

  const { data: site } = await supabase
    .from("sites")
    .select("id, domain, crawl_status, crawl_started_at, crawl_completed_at, page_count")
    .eq("id", siteId)
    .eq("api_key_id", apiKeyId)
    .single();

  if (!site) {
    return c.json({ error: "Site not found" }, 404);
  }

  // Get page count from actual pages table
  const { count } = await supabase
    .from("pages")
    .select("id", { count: "exact", head: true })
    .eq("site_id", siteId);

  return c.json({
    site_id: site.id,
    domain: site.domain,
    crawl_status: site.crawl_status,
    crawl_started_at: site.crawl_started_at,
    crawl_completed_at: site.crawl_completed_at,
    pages_crawled: count || 0,
  });
});

export { crawl };
