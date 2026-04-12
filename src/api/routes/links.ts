import { Hono } from "hono";
import type { AppEnv } from "../../types/hono.js";
import { supabase } from "../../db/client.js";
import { embedSitePages } from "../../services/embedder.js";
import { generateLinkSuggestions, detectCannibalization } from "../../services/linker.js";

const links = new Hono<AppEnv>();

// POST /sites/:siteId/links/embed — Generate embeddings for all pages
links.post("/embed", async (c) => {
  const apiKeyId = c.get("apiKeyId");
  const siteId = c.req.param("siteId")!;

  const { data: site } = await supabase
    .from("sites")
    .select("*")
    .eq("id", siteId)
    .eq("api_key_id", apiKeyId)
    .single();

  if (!site) return c.json({ error: "Site not found" }, 404);
  if (site.crawl_status !== "completed") {
    return c.json({ error: "Site must be crawled first" }, 400);
  }

  // Run embed then auto-generate links
  embedSitePages(siteId)
    .then(async () => {
      console.log(`   🔗 Auto-generating link suggestions for ${site.domain}...`);
      await generateLinkSuggestions(siteId);
    })
    .catch((err) => {
      console.error(`Embedding/linking failed for ${site.domain}:`, err);
    });

  return c.json({ message: "Link analysis started — embedding pages then generating suggestions", site_id: siteId, domain: site.domain });
});

// POST /sites/:siteId/links/generate — Generate link suggestions
links.post("/generate", async (c) => {
  const apiKeyId = c.get("apiKeyId");
  const siteId = c.req.param("siteId")!;

  const { data: site } = await supabase
    .from("sites")
    .select("*")
    .eq("id", siteId)
    .eq("api_key_id", apiKeyId)
    .single();

  if (!site) return c.json({ error: "Site not found" }, 404);

  // Run in background
  generateLinkSuggestions(siteId).catch((err) => {
    console.error(`Link generation failed for ${site.domain}:`, err);
  });

  return c.json({ message: "Link suggestion generation started", site_id: siteId });
});

// GET /sites/:siteId/links/suggestions — List link suggestions
links.get("/suggestions", async (c) => {
  const apiKeyId = c.get("apiKeyId");
  const siteId = c.req.param("siteId")!;

  const { data: site } = await supabase
    .from("sites")
    .select("id")
    .eq("id", siteId)
    .eq("api_key_id", apiKeyId)
    .single();

  if (!site) return c.json({ error: "Site not found" }, 404);

  const status = c.req.query("status") || "pending";
  const confidence = c.req.query("confidence"); // optional filter
  const limit = Math.min(Number(c.req.query("limit") || 50), 100);
  const offset = Number(c.req.query("offset") || 0);

  let query = supabase
    .from("link_suggestions")
    .select(
      `
      id,
      anchor_text,
      context_snippet,
      similarity_score,
      relevance_score,
      confidence,
      status,
      reason,
      created_at,
      source_page:source_page_id(url, path, title, content_type),
      target_page:target_page_id(url, path, title, content_type)
    `,
      { count: "exact" }
    )
    .eq("site_id", siteId)
    .eq("status", status)
    .order("relevance_score", { ascending: false })
    .range(offset, offset + limit - 1);

  if (confidence) {
    query = query.eq("confidence", confidence);
  }

  const { data, error, count } = await query;

  if (error) return c.json({ error: error.message }, 500);

  // Determine whether link analysis has ever run on this site — i.e. at least
  // one page has an embedding. This lets the UI persist the "analysis complete"
  // state across reloads even when 0 suggestions were produced.
  const { count: embeddedCount } = await supabase
    .from("pages")
    .select("id", { count: "exact", head: true })
    .eq("site_id", siteId)
    .not("embedding", "is", null);

  return c.json({
    suggestions: data,
    total: count,
    analyzed: (embeddedCount || 0) > 0,
    limit,
    offset,
  });
});

// POST /sites/:siteId/links/suggestions/:id/approve — Approve a suggestion
links.post("/suggestions/:suggestionId/approve", async (c) => {
  const apiKeyId = c.get("apiKeyId");
  const siteId = c.req.param("siteId")!;
  const suggestionId = c.req.param("suggestionId")!;

  const { data: site } = await supabase
    .from("sites")
    .select("id")
    .eq("id", siteId)
    .eq("api_key_id", apiKeyId)
    .single();

  if (!site) return c.json({ error: "Site not found" }, 404);

  const { data, error } = await supabase
    .from("link_suggestions")
    .update({
      status: "approved",
      reviewed_at: new Date().toISOString(),
      reviewed_by: "api",
    })
    .eq("id", suggestionId)
    .eq("site_id", siteId)
    .select()
    .single();

  if (error || !data) return c.json({ error: "Suggestion not found" }, 404);

  return c.json({ suggestion: data });
});

// POST /sites/:siteId/links/suggestions/:id/reject — Reject a suggestion
links.post("/suggestions/:suggestionId/reject", async (c) => {
  const apiKeyId = c.get("apiKeyId");
  const siteId = c.req.param("siteId")!;
  const suggestionId = c.req.param("suggestionId")!;

  const { data: site } = await supabase
    .from("sites")
    .select("id")
    .eq("id", siteId)
    .eq("api_key_id", apiKeyId)
    .single();

  if (!site) return c.json({ error: "Site not found" }, 404);

  const { data, error } = await supabase
    .from("link_suggestions")
    .update({
      status: "rejected",
      reviewed_at: new Date().toISOString(),
      reviewed_by: "api",
    })
    .eq("id", suggestionId)
    .eq("site_id", siteId)
    .select()
    .single();

  if (error || !data) return c.json({ error: "Suggestion not found" }, 404);

  return c.json({ suggestion: data });
});

// GET /sites/:siteId/links/cannibalization — Detect keyword cannibalization
links.get("/cannibalization", async (c) => {
  const apiKeyId = c.get("apiKeyId");
  const siteId = c.req.param("siteId")!;

  const { data: site } = await supabase
    .from("sites")
    .select("id")
    .eq("id", siteId)
    .eq("api_key_id", apiKeyId)
    .single();

  if (!site) return c.json({ error: "Site not found" }, 404);

  const results = await detectCannibalization(siteId);

  return c.json({
    cannibalization: results,
    total: results.length,
  });
});

export { links };
