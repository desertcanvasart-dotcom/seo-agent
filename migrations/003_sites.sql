-- Sites registered for auditing
CREATE TABLE IF NOT EXISTS sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id UUID NOT NULL REFERENCES api_keys(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,                -- e.g., "travel2egypt.com"
  name TEXT,                           -- friendly name
  crawl_status TEXT DEFAULT 'pending', -- pending | crawling | completed | failed
  crawl_started_at TIMESTAMPTZ,
  crawl_completed_at TIMESTAMPTZ,
  page_count INTEGER DEFAULT 0,
  settings JSONB DEFAULT '{}',         -- site-specific config (crawl depth, etc.)
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX idx_sites_domain_apikey ON sites (domain, api_key_id);
CREATE INDEX idx_sites_api_key ON sites (api_key_id);
