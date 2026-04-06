import { Hono } from "hono";
import type { AppEnv } from "../../types/hono.js";
import { z } from "zod/v4";
import { supabase } from "../../db/client.js";
import { generateBrief, generateBriefsFromResearch, generateAiDraft } from "../../services/brief-generator.js";

const briefs = new Hono<AppEnv>();

// POST /sites/:siteId/briefs — Generate a content brief
const createBriefSchema = z.object({
  target_keyword: z.string().min(1),
  research_job_id: z.string().uuid().optional(),
});

briefs.post("/", async (c) => {
  const apiKeyId = c.get("apiKeyId");
  const siteId = c.req.param("siteId")!;

  const { data: site } = await supabase
    .from("sites")
    .select("id")
    .eq("id", siteId)
    .eq("api_key_id", apiKeyId)
    .single();

  if (!site) return c.json({ error: "Site not found" }, 404);

  const body = await c.req.json();
  const parsed = createBriefSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: "Invalid request", details: parsed.error.format() }, 400);

  try {
    const briefId = await generateBrief({
      siteId,
      targetKeyword: parsed.data.target_keyword,
      researchJobId: parsed.data.research_job_id,
    });

    return c.json({ message: "Brief generated", brief_id: briefId }, 201);
  } catch (err) {
    return c.json({ error: (err as Error).message }, 500);
  }
});

// POST /sites/:siteId/briefs/from-research — Generate briefs from research gaps
const fromResearchSchema = z.object({
  research_job_id: z.string().uuid(),
  max_briefs: z.number().min(1).max(20).default(10),
});

briefs.post("/from-research", async (c) => {
  const apiKeyId = c.get("apiKeyId");
  const siteId = c.req.param("siteId")!;

  const { data: site } = await supabase
    .from("sites")
    .select("id")
    .eq("id", siteId)
    .eq("api_key_id", apiKeyId)
    .single();

  if (!site) return c.json({ error: "Site not found" }, 404);

  const body = await c.req.json();
  const parsed = fromResearchSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: "Invalid request", details: parsed.error.format() }, 400);

  // Run in background
  generateBriefsFromResearch(siteId, parsed.data.research_job_id, parsed.data.max_briefs).catch((err) => {
    console.error("Brief generation failed:", err);
  });

  return c.json({ message: "Brief generation from research started", research_job_id: parsed.data.research_job_id });
});

// GET /sites/:siteId/briefs — List all briefs
briefs.get("/", async (c) => {
  const apiKeyId = c.get("apiKeyId");
  const siteId = c.req.param("siteId")!;

  const { data: site } = await supabase
    .from("sites")
    .select("id")
    .eq("id", siteId)
    .eq("api_key_id", apiKeyId)
    .single();

  if (!site) return c.json({ error: "Site not found" }, 404);

  const { data, error } = await supabase
    .from("content_briefs")
    .select("id, target_keyword, title_suggestion, recommended_word_count, recommended_schema, status, draft_status, created_at")
    .eq("site_id", siteId)
    .order("created_at", { ascending: false });

  if (error) return c.json({ error: error.message }, 500);

  return c.json({ briefs: data || [] });
});

// GET /sites/:siteId/briefs/:briefId — Get full brief
briefs.get("/:briefId", async (c) => {
  const apiKeyId = c.get("apiKeyId");
  const siteId = c.req.param("siteId")!;
  const briefId = c.req.param("briefId")!;

  const { data: site } = await supabase
    .from("sites")
    .select("id")
    .eq("id", siteId)
    .eq("api_key_id", apiKeyId)
    .single();

  if (!site) return c.json({ error: "Site not found" }, 404);

  const { data, error } = await supabase
    .from("content_briefs")
    .select("*")
    .eq("id", briefId)
    .eq("site_id", siteId)
    .single();

  if (error || !data) return c.json({ error: "Brief not found" }, 404);

  return c.json({ brief: data });
});

// POST /sites/:siteId/briefs/:briefId/draft — Generate AI draft for a brief
briefs.post("/:briefId/draft", async (c) => {
  const apiKeyId = c.get("apiKeyId");
  const siteId = c.req.param("siteId")!;
  const briefId = c.req.param("briefId")!;

  const { data: site } = await supabase
    .from("sites")
    .select("id")
    .eq("id", siteId)
    .eq("api_key_id", apiKeyId)
    .single();

  if (!site) return c.json({ error: "Site not found" }, 404);

  // Run in background
  generateAiDraft(briefId).catch((err) => {
    console.error("AI draft failed:", err);
  });

  return c.json({ message: "AI draft generation started", brief_id: briefId });
});

export { briefs };
