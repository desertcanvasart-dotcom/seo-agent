-- Research jobs and competitor analysis
CREATE TABLE IF NOT EXISTS research_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,

  keyword TEXT,                           -- target keyword for research
  competitor_urls TEXT[] DEFAULT '{}',    -- manually provided competitors

  status TEXT DEFAULT 'pending',         -- pending | running | completed | failed

  -- Results
  competitor_analysis JSONB DEFAULT '[]',
  -- [{url, title, topics_covered: [], word_count, schema_types: [], score}]

  topic_gaps JSONB DEFAULT '[]',
  -- [{topic, competitor_coverage: 3, our_coverage: 0, opportunity_score: 85}]

  opportunities JSONB DEFAULT '[]',
  -- [{keyword, volume, difficulty, our_position, gap_type: "missing"|"weak"}]

  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_research_site ON research_jobs (site_id);
CREATE INDEX idx_research_status ON research_jobs (status);
