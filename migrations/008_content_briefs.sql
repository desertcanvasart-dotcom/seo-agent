-- Content briefs generated from research
CREATE TABLE IF NOT EXISTS content_briefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  research_job_id UUID REFERENCES research_jobs(id) ON DELETE SET NULL,

  -- Brief details
  target_keyword TEXT NOT NULL,
  title_suggestion TEXT,

  outline JSONB DEFAULT '[]',
  -- [{heading: "H2: ...", talking_points: ["...", "..."], target_word_count: 200}]

  questions_to_answer TEXT[] DEFAULT '{}',
  recommended_word_count INTEGER,

  -- Pre-filled from other modules
  internal_links JSONB DEFAULT '[]',
  -- [{target_page_id, target_url, anchor_text, relevance_score}]

  recommended_schema TEXT,               -- "FAQPage", "TourPackage", etc.

  -- Optional AI draft
  ai_draft TEXT,
  draft_status TEXT DEFAULT 'none',      -- none | generating | ready

  -- GEO optimization hints
  geo_hints JSONB DEFAULT '{}',
  -- {citable_block_targets: 3, recommended_structure: "...", llms_txt_include: true}

  status TEXT DEFAULT 'draft',           -- draft | finalized | assigned | published
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_briefs_site ON content_briefs (site_id);
CREATE INDEX idx_briefs_status ON content_briefs (status);
