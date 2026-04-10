import { Hono } from "hono";
import { z } from "zod/v4";
import type { AppEnv } from "../../types/hono.js";
import { supabase } from "../../db/client.js";
import { generateSiteSchemas, generatePageSchemas } from "../../services/generators/schema-generator.js";
import { rewriteSiteContent, rewritePageContent } from "../../services/generators/content-rewriter.js";
import { generateLlmsTxt } from "../../services/generators/llmstxt-generator.js";
import { generateRobotsFix, generateMetaTitleFixes } from "../../services/generators/fixes-generator.js";

const generate = new Hono<AppEnv>();

// ─── Auth helper ─────────────────────────────────────────────────
async function getSiteOrFail(siteId: string, apiKeyId: string) {
  const { data: site } = await supabase
    .from("sites")
    .select("id, domain, name, crawl_status")
    .eq("id", siteId)
    .eq("api_key_id", apiKeyId)
    .single();
  return site;
}

// ─── POST /sites/:siteId/generate/schemas ────────────────────────
// Generate JSON-LD for all pages missing recommended schema types
generate.post("/schemas", async (c) => {
  const apiKeyId = c.get("apiKeyId");
  const siteId = c.req.param("siteId")!;

  const site = await getSiteOrFail(siteId, apiKeyId);
  if (!site) return c.json({ error: "Site not found" }, 404);

  if (site.crawl_status !== "completed") {
    return c.json({ error: "Run a site crawl first before generating schemas" }, 409);
  }

  // Run in background
  generateSiteSchemas(siteId).catch((err) =>
    console.error("Schema generation failed:", err)
  );

  return c.json({ message: "Schema generation started", site_id: siteId });
});

// POST /sites/:siteId/generate/schemas/:pageId — single page
generate.post("/schemas/:pageId", async (c) => {
  const apiKeyId = c.get("apiKeyId");
  const siteId = c.req.param("siteId")!;
  const pageId = c.req.param("pageId")!;

  const site = await getSiteOrFail(siteId, apiKeyId);
  if (!site) return c.json({ error: "Site not found" }, 404);

  const { data: page } = await supabase
    .from("pages")
    .select("id, url, path, title, h1, meta_description, headings, body_text, word_count, content_type, schema_types, has_json_ld, outbound_links")
    .eq("id", pageId)
    .eq("site_id", siteId)
    .single();

  if (!page) return c.json({ error: "Page not found" }, 404);

  try {
    const result = await generatePageSchemas(page as any, { domain: site.domain, name: site.name });

    if (result.schemas.length > 0) {
      await supabase.from("generated_fixes").upsert({
        site_id: siteId,
        page_id: pageId,
        fix_type: "schema",
        status: "pending",
        generated_content: result as any,
      }, { onConflict: "page_id,fix_type" });
    }

    return c.json({ result });
  } catch (err) {
    return c.json({ error: (err as Error).message }, 500);
  }
});

// ─── POST /sites/:siteId/generate/rewrites ───────────────────────
// Rewrite low-citability content for all qualifying pages
generate.post("/rewrites", async (c) => {
  const apiKeyId = c.get("apiKeyId");
  const siteId = c.req.param("siteId")!;

  const site = await getSiteOrFail(siteId, apiKeyId);
  if (!site) return c.json({ error: "Site not found" }, 404);

  rewriteSiteContent(siteId).catch((err) =>
    console.error("Content rewrite failed:", err)
  );

  return c.json({ message: "Content rewrite started", site_id: siteId });
});

// ─── POST /sites/:siteId/generate/llmstxt ───────────────────────
// Generate /llms.txt for the site
generate.post("/llmstxt", async (c) => {
  const apiKeyId = c.get("apiKeyId");
  const siteId = c.req.param("siteId")!;

  const site = await getSiteOrFail(siteId, apiKeyId);
  if (!site) return c.json({ error: "Site not found" }, 404);

  if (site.crawl_status !== "completed") {
    return c.json({ error: "Run a site crawl first" }, 409);
  }

  try {
    const result = await generateLlmsTxt(siteId);
    return c.json({ result });
  } catch (err) {
    return c.json({ error: (err as Error).message }, 500);
  }
});

// ─── POST /sites/:siteId/generate/robots ────────────────────────
// Generate a corrected robots.txt that unblocks AI crawlers
generate.post("/robots", async (c) => {
  const apiKeyId = c.get("apiKeyId");
  const siteId = c.req.param("siteId")!;

  const site = await getSiteOrFail(siteId, apiKeyId);
  if (!site) return c.json({ error: "Site not found" }, 404);

  try {
    const result = await generateRobotsFix(siteId);
    return c.json({ result });
  } catch (err) {
    return c.json({ error: (err as Error).message }, 500);
  }
});

// ─── POST /sites/:siteId/generate/meta ──────────────────────────
// Generate improved titles and meta descriptions for failing pages
generate.post("/meta", async (c) => {
  const apiKeyId = c.get("apiKeyId");
  const siteId = c.req.param("siteId")!;

  const site = await getSiteOrFail(siteId, apiKeyId);
  if (!site) return c.json({ error: "Site not found" }, 404);

  generateMetaTitleFixes(siteId).catch((err) =>
    console.error("Meta/title fix failed:", err)
  );

  return c.json({ message: "Title and meta generation started", site_id: siteId });
});

// ─── GET /sites/:siteId/generate/fixes ──────────────────────────
// List all generated fixes for a site (with optional filter)
generate.get("/fixes", async (c) => {
  const apiKeyId = c.get("apiKeyId");
  const siteId = c.req.param("siteId")!;

  const site = await getSiteOrFail(siteId, apiKeyId);
  if (!site) return c.json({ error: "Site not found" }, 404);

  const fixType = c.req.query("type");   // optional: schema | content_rewrite | llms_txt | robots_txt | meta_title
  const status = c.req.query("status");  // optional: pending | approved | dismissed

  let query = supabase
    .from("generated_fixes")
    .select(`
      id, fix_type, status, created_at, updated_at,
      page_id,
      generated_content,
      pages (url, path, title, content_type)
    `)
    .eq("site_id", siteId)
    .order("created_at", { ascending: false });

  if (fixType) query = query.eq("fix_type", fixType);
  if (status) query = query.eq("status", status);

  const { data, error } = await query;
  if (error) return c.json({ error: error.message }, 500);

  // Summary counts
  const all = data || [];
  const counts = {
    total: all.length,
    pending: all.filter((f) => f.status === "pending").length,
    approved: all.filter((f) => f.status === "approved").length,
    dismissed: all.filter((f) => f.status === "dismissed").length,
    by_type: Object.fromEntries(
      ["schema", "content_rewrite", "llms_txt", "robots_txt", "meta_title"].map((t) => [
        t,
        all.filter((f) => f.fix_type === t).length,
      ])
    ),
  };

  return c.json({ summary: counts, fixes: all });
});

// ─── PATCH /sites/:siteId/generate/fixes/:fixId ──────────────────
// Approve or dismiss a fix
const updateFixSchema = z.object({
  status: z.enum(["approved", "dismissed"]),
  note: z.string().optional(),
});

generate.patch("/fixes/:fixId", async (c) => {
  const apiKeyId = c.get("apiKeyId");
  const siteId = c.req.param("siteId")!;
  const fixId = c.req.param("fixId")!;

  const site = await getSiteOrFail(siteId, apiKeyId);
  if (!site) return c.json({ error: "Site not found" }, 404);

  const body = await c.req.json();
  const parsed = updateFixSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: "Invalid request" }, 400);

  const { error } = await supabase
    .from("generated_fixes")
    .update({
      status: parsed.data.status,
      note: parsed.data.note || null,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", fixId)
    .eq("site_id", siteId);

  if (error) return c.json({ error: error.message }, 500);

  return c.json({ message: `Fix ${parsed.data.status}`, fix_id: fixId });
});

// ─── POST /sites/:siteId/generate/all ───────────────────────────
// Run all generators in sequence (full fix generation pass)
generate.post("/all", async (c) => {
  const apiKeyId = c.get("apiKeyId");
  const siteId = c.req.param("siteId")!;

  const site = await getSiteOrFail(siteId, apiKeyId);
  if (!site) return c.json({ error: "Site not found" }, 404);

  if (site.crawl_status !== "completed") {
    return c.json({ error: "Run a site crawl first" }, 409);
  }

  // Run all generators in background, sequentially to avoid API rate limits
  (async () => {
    try {
      console.log(`\n🚀 Running all generators for ${site.domain}`);
      await generateRobotsFix(siteId).catch((e) => console.error("Robots fix failed:", e));
      await generateLlmsTxt(siteId).catch((e) => console.error("llms.txt failed:", e));
      await generateSiteSchemas(siteId).catch((e) => console.error("Schema gen failed:", e));
      await generateMetaTitleFixes(siteId).catch((e) => console.error("Meta gen failed:", e));
      await rewriteSiteContent(siteId).catch((e) => console.error("Rewrite failed:", e));
      console.log(`\n✅ All generators complete for ${site.domain}`);
    } catch (err) {
      console.error("Generator suite failed:", err);
    }
  })();

  return c.json({
    message: "All generators started",
    site_id: siteId,
    domain: site.domain,
    generators: ["robots_txt", "llms_txt", "schema", "meta_title", "content_rewrite"],
  });
});

export { generate };
