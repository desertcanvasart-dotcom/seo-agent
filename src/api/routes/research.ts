import { Hono } from "hono";
import type { AppEnv } from "../../types/hono.js";
import { z } from "zod/v4";
import { supabase } from "../../db/client.js";
import { runResearch } from "../../services/researcher.js";

const research = new Hono<AppEnv>();

// POST /sites/:siteId/research — Start a research job
const createResearchSchema = z.object({
  competitor_urls: z.array(z.string().url()).min(1).max(5),
  keyword: z.string().optional(),
});

research.post("/", async (c) => {
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

  const body = await c.req.json();
  const parsed = createResearchSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid request", details: parsed.error.format() }, 400);
  }

  const { competitor_urls, keyword } = parsed.data;

  // Create research job
  const { data: job, error } = await supabase
    .from("research_jobs")
    .insert({
      site_id: siteId,
      keyword: keyword || null,
      competitor_urls,
      status: "pending",
    })
    .select()
    .single();

  if (error) return c.json({ error: error.message }, 500);

  // Run in background
  runResearch(job.id, siteId, competitor_urls, keyword).catch((err) => {
    console.error(`Research failed:`, err);
  });

  return c.json({
    message: "Research started",
    job_id: job.id,
    competitor_urls,
    keyword: keyword || null,
  });
});

// GET /sites/:siteId/research — List research jobs
research.get("/", async (c) => {
  const apiKeyId = c.get("apiKeyId");
  const siteId = c.req.param("siteId")!;

  const { data: site } = await supabase
    .from("sites")
    .select("id")
    .eq("id", siteId)
    .eq("api_key_id", apiKeyId)
    .single();

  if (!site) return c.json({ error: "Site not found" }, 404);

  const { data: jobs } = await supabase
    .from("research_jobs")
    .select("id, keyword, competitor_urls, status, started_at, completed_at, created_at")
    .eq("site_id", siteId)
    .order("created_at", { ascending: false });

  return c.json({ jobs: jobs || [] });
});

// GET /sites/:siteId/research/:jobId — Get full research results
research.get("/:jobId", async (c) => {
  const apiKeyId = c.get("apiKeyId");
  const siteId = c.req.param("siteId")!;
  const jobId = c.req.param("jobId")!;

  const { data: site } = await supabase
    .from("sites")
    .select("id")
    .eq("id", siteId)
    .eq("api_key_id", apiKeyId)
    .single();

  if (!site) return c.json({ error: "Site not found" }, 404);

  const { data: job, error } = await supabase
    .from("research_jobs")
    .select("*")
    .eq("id", jobId)
    .eq("site_id", siteId)
    .single();

  if (error || !job) return c.json({ error: "Research job not found" }, 404);

  return c.json({ research: job });
});

// GET /sites/:siteId/research/:jobId/gaps — Get just the topic gaps
research.get("/:jobId/gaps", async (c) => {
  const apiKeyId = c.get("apiKeyId");
  const siteId = c.req.param("siteId")!;
  const jobId = c.req.param("jobId")!;

  const { data: site } = await supabase
    .from("sites")
    .select("id")
    .eq("id", siteId)
    .eq("api_key_id", apiKeyId)
    .single();

  if (!site) return c.json({ error: "Site not found" }, 404);

  const { data: job } = await supabase
    .from("research_jobs")
    .select("topic_gaps, opportunities, status")
    .eq("id", jobId)
    .eq("site_id", siteId)
    .single();

  if (!job) return c.json({ error: "Research job not found" }, 404);
  if (job.status !== "completed") {
    return c.json({ error: "Research not yet complete", status: job.status }, 400);
  }

  const gaps = (job.topic_gaps as any[]) || [];
  const missing = gaps.filter((g) => !g.our_coverage);
  const weak = gaps.filter((g) => g.our_coverage && g.opportunity_score > 30);

  return c.json({
    total_gaps: gaps.length,
    missing_topics: missing.length,
    weak_topics: weak.length,
    gaps: gaps,
    opportunities: job.opportunities,
  });
});

export { research };
