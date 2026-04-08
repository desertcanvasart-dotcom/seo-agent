import { Hono } from "hono";
import type { AppEnv } from "../../types/hono.js";
import { z } from "zod/v4";
import { supabase } from "../../db/client.js";

const sites = new Hono<AppEnv>();

// POST /sites — Register a new site and start crawling
const createSiteSchema = z.object({
  domain: z.string().min(1),
  name: z.string().optional(),
  settings: z
    .object({
      max_depth: z.number().default(3),
      max_pages: z.number().default(500),
      respect_robots: z.boolean().default(true),
    })
    .optional(),
});

sites.post("/", async (c) => {
  const body = await c.req.json();
  const parsed = createSiteSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: "Invalid request", details: parsed.error.format() }, 400);
  }

  const apiKeyId = c.get("apiKeyId");
  const { domain, name, settings } = parsed.data;

  // Clean domain (remove protocol, trailing slash)
  const cleanDomain = domain.replace(/^https?:\/\//, "").replace(/\/$/, "");

  const { data, error } = await supabase
    .from("sites")
    .insert({
      api_key_id: apiKeyId,
      domain: cleanDomain,
      name: name || cleanDomain,
      settings: settings || {},
      crawl_status: "pending",
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return c.json({ error: "Site already registered" }, 409);
    }
    return c.json({ error: error.message }, 500);
  }

  // TODO: Queue crawl job here (Phase 1)

  return c.json({ site: data, message: "Site registered. Crawl will begin shortly." }, 201);
});

// GET /sites — List all sites for this API key
sites.get("/", async (c) => {
  const apiKeyId = c.get("apiKeyId");

  const { data, error } = await supabase
    .from("sites")
    .select("id, domain, name, crawl_status, page_count, created_at, updated_at")
    .eq("api_key_id", apiKeyId)
    .order("created_at", { ascending: false });

  if (error) {
    return c.json({ error: error.message }, 500);
  }

  return c.json({ sites: data });
});

// GET /sites/:id — Get site details
sites.get("/:id", async (c) => {
  const apiKeyId = c.get("apiKeyId");
  const siteId = c.req.param("id")!;

  const { data, error } = await supabase
    .from("sites")
    .select("*")
    .eq("id", siteId)
    .eq("api_key_id", apiKeyId)
    .single();

  if (error || !data) {
    return c.json({ error: "Site not found" }, 404);
  }

  return c.json({ site: data });
});

// DELETE /sites/:id — Delete a site and all its data
sites.delete("/:id", async (c) => {
  const apiKeyId = c.get("apiKeyId");
  const siteId = c.req.param("id")!;

  // Verify ownership
  const { data: site } = await supabase
    .from("sites")
    .select("id, domain")
    .eq("id", siteId)
    .eq("api_key_id", apiKeyId)
    .single();

  if (!site) {
    return c.json({ error: "Site not found" }, 404);
  }

  // Delete site — CASCADE will remove pages, audits, suggestions, etc.
  const { error } = await supabase
    .from("sites")
    .delete()
    .eq("id", siteId);

  if (error) {
    return c.json({ error: error.message }, 500);
  }

  return c.json({ message: `Site ${site.domain} deleted`, site_id: siteId });
});

export { sites };
