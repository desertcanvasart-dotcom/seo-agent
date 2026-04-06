import { Hono } from "hono";
import type { AppEnv } from "../../types/hono.js";
import { supabase } from "../../db/client.js";

const pages = new Hono<AppEnv>();

// GET /sites/:siteId/pages — List pages for a site
pages.get("/", async (c) => {
  const apiKeyId = c.get("apiKeyId");
  const siteId = c.req.param("siteId")!;

  // Verify site belongs to this API key
  const { data: site } = await supabase
    .from("sites")
    .select("id")
    .eq("id", siteId)
    .eq("api_key_id", apiKeyId)
    .single();

  if (!site) {
    return c.json({ error: "Site not found" }, 404);
  }

  const limit = Math.min(Number(c.req.query("limit") || 50), 100);
  const offset = Number(c.req.query("offset") || 0);

  const { data, error, count } = await supabase
    .from("pages")
    .select(
      "id, url, path, title, meta_description, h1, word_count, content_type, inbound_link_count, has_json_ld, status_code, last_crawled_at",
      { count: "exact" }
    )
    .eq("site_id", siteId)
    .order("path")
    .range(offset, offset + limit - 1);

  if (error) {
    return c.json({ error: error.message }, 500);
  }

  return c.json({ pages: data, total: count, limit, offset });
});

// GET /sites/:siteId/pages/:pageId — Get full page details
pages.get("/:pageId", async (c) => {
  const apiKeyId = c.get("apiKeyId");
  const siteId = c.req.param("siteId")!;
  const pageId = c.req.param("pageId")!;

  const { data: site } = await supabase
    .from("sites")
    .select("id")
    .eq("id", siteId)
    .eq("api_key_id", apiKeyId)
    .single();

  if (!site) {
    return c.json({ error: "Site not found" }, 404);
  }

  const { data, error } = await supabase
    .from("pages")
    .select("*")
    .eq("id", pageId)
    .eq("site_id", siteId)
    .single();

  if (error || !data) {
    return c.json({ error: "Page not found" }, 404);
  }

  // Strip embedding from response (too large)
  const { embedding, ...page } = data;

  return c.json({ page });
});

export { pages };
