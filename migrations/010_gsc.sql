-- Google Search Console data per page
CREATE TABLE IF NOT EXISTS gsc_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  page_url TEXT NOT NULL,
  page_path TEXT NOT NULL,

  -- GSC metrics (daily snapshot)
  clicks INTEGER DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  ctr FLOAT DEFAULT 0,
  position FLOAT DEFAULT 0,

  -- Top queries for this page
  top_queries JSONB DEFAULT '[]',  -- [{query, clicks, impressions, ctr, position}]

  date_range TEXT,                  -- e.g., "2026-03-08 to 2026-04-07"
  synced_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX idx_gsc_page ON gsc_data (site_id, page_url);
CREATE INDEX idx_gsc_site ON gsc_data (site_id);

-- Score history for tracking improvement over time
CREATE TABLE IF NOT EXISTS score_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  avg_seo_score INTEGER,
  avg_geo_score INTEGER,
  avg_total_score INTEGER,
  pages_audited INTEGER,
  critical_issues INTEGER,
  recorded_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_score_history_site ON score_history (site_id, recorded_at DESC);
