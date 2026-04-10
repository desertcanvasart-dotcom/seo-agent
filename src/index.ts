import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { env } from "./config/env.js";
import { authMiddleware } from "./api/middleware/auth.js";
import { health } from "./api/routes/health.js";
import { sites } from "./api/routes/sites.js";
import { pages } from "./api/routes/pages.js";
import { crawl } from "./api/routes/crawl.js";
import { audit } from "./api/routes/audit.js";
import { links } from "./api/routes/links.js";
import { research } from "./api/routes/research.js";
import { briefs } from "./api/routes/briefs.js";
import { gsc } from "./api/routes/gsc.js";
import { schedule } from "./api/routes/schedule.js";
import { exportRoutes } from "./api/routes/export.js";
import { embed } from "./api/routes/embed.js";
import { generate } from "./api/routes/generate.js";
import { supabase } from "./db/client.js";

const app = new Hono();

// Global middleware
app.use("*", cors());
app.use("*", logger());

// Debug route
app.get("/debug", (c) => {
  return c.json({ routes: "working", prefix: env.API_PREFIX, port: env.PORT });
});

// Delete site
app.post("/delete-site/:siteId", authMiddleware, async (c) => {
  const apiKeyId = c.get("apiKeyId");
  const siteId = c.req.param("siteId")!;
  const { data: site } = await supabase.from("sites").select("id, domain").eq("id", siteId).eq("api_key_id", apiKeyId).single();
  if (!site) return c.json({ error: "Site not found" }, 404);
  const { error } = await supabase.from("sites").delete().eq("id", siteId);
  if (error) return c.json({ error: error.message }, 500);
  return c.json({ message: `Deleted ${site.domain}` });
});

// Public routes (no auth needed)
app.route("/", health);
app.route("/embed", embed);       // GET /embed/snippet.js
app.route("/v1", embed);          // POST /v1/sites/:siteId/beacon

// Protected API routes
const api = new Hono<{ Variables: { apiKeyId: string; apiKeyName: string; apiKeyScopes: string[] } }>();
api.use("*", authMiddleware);

api.route("/sites", sites);


// Pages are nested under sites: /v1/sites/:siteId/pages
api.get("/sites/:siteId/pages", async (c) => {
  // Re-route to pages handler with siteId
  const pagesApp = new Hono();
  pagesApp.route("/", pages);
  return pagesApp.fetch(c.req.raw);
});
api.route("/sites/:siteId/pages", pages);
api.route("/sites/:siteId/crawl", crawl);
api.route("/sites/:siteId/audit", audit);
api.route("/sites/:siteId/links", links);
api.route("/sites/:siteId/research", research);
api.route("/sites/:siteId/briefs", briefs);
api.route("/sites/:siteId/gsc", gsc);
api.route("/sites/:siteId/schedule", schedule);
api.route("/sites/:siteId/generate", generate);
api.route("/sites/:siteId/export", exportRoutes);

app.route(env.API_PREFIX, api);


// 404 fallback
app.notFound((c) => {
  return c.json({ error: "Not found", path: c.req.path }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error(`Error: ${err.message}`);
  const status = "status" in err ? (err.status as number) : 500;
  return c.json({ error: err.message }, status as any);
});

// Start server
console.log(`
  ╔══════════════════════════════════════╗
  ║   SEO/GEO Agent API                 ║
  ║   Port: ${env.PORT}                         ║
  ║   API:  ${env.API_PREFIX}/*                     ║
  ╚══════════════════════════════════════╝
`);

serve({ fetch: app.fetch, port: env.PORT });
