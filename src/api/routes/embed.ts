import { Hono } from "hono";
import { supabase } from "../../db/client.js";
import { hashApiKey } from "../middleware/auth.js";

const embed = new Hono();

// GET /embed/snippet.js — Serve the embed script
embed.get("/snippet.js", async (c) => {
  const script = `
(function() {
  var SEO_AGENT_API = '__API_URL__';
  var SEO_AGENT_KEY = document.currentScript?.getAttribute('data-key') || '';
  var SEO_AGENT_SITE = document.currentScript?.getAttribute('data-site') || '';

  if (!SEO_AGENT_KEY || !SEO_AGENT_SITE) {
    console.warn('[SEO Agent] Missing data-key or data-site attribute');
    return;
  }

  // Report current page to the API
  function reportPage() {
    var data = {
      url: window.location.href,
      path: window.location.pathname,
      title: document.title,
      meta_description: (document.querySelector('meta[name="description"]') || {}).content || '',
      has_json_ld: !!document.querySelector('script[type="application/ld+json"]'),
    };

    fetch(SEO_AGENT_API + '/sites/' + SEO_AGENT_SITE + '/beacon', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + SEO_AGENT_KEY,
      },
      body: JSON.stringify(data),
    }).catch(function() {});
  }

  // Run on page load
  if (document.readyState === 'complete') {
    reportPage();
  } else {
    window.addEventListener('load', reportPage);
  }
})();
`.trim();

  const apiUrl = c.req.header("host") ? `https://${c.req.header("host")}/v1` : "http://localhost:8000/v1";
  const finalScript = script.replace("__API_URL__", apiUrl);

  c.header("Content-Type", "application/javascript");
  c.header("Cache-Control", "public, max-age=3600");
  return c.body(finalScript);
});

// POST /sites/:siteId/beacon — Receive data from embed snippet
embed.post("/sites/:siteId/beacon", async (c) => {
  const header = c.req.header("Authorization");
  if (!header?.startsWith("Bearer ")) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const key = header.slice(7);
  const keyHash = hashApiKey(key);

  const { data: apiKey } = await supabase
    .from("api_keys")
    .select("id")
    .eq("key_hash", keyHash)
    .eq("is_active", true)
    .single();

  if (!apiKey) return c.json({ error: "Invalid key" }, 401);

  const siteId = c.req.param("siteId")!;
  const body = await c.req.json();

  // Update or insert the page with basic info from the beacon
  const { error } = await supabase.from("pages").upsert(
    {
      site_id: siteId,
      url: body.url?.split("#")[0]?.replace(/\/$/, "") || "",
      path: body.path || "/",
      title: body.title || null,
      meta_description: body.meta_description || null,
      has_json_ld: body.has_json_ld || false,
      last_crawled_at: new Date().toISOString(),
      status_code: 200,
    },
    { onConflict: "site_id,url" }
  );

  if (error) return c.json({ error: error.message }, 500);

  return c.json({ ok: true });
});

export { embed };
