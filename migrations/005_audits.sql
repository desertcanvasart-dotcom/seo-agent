-- SEO/GEO audit results per page
CREATE TABLE IF NOT EXISTS audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,

  -- Overall scores (0-100)
  seo_score INTEGER,
  geo_score INTEGER,
  total_score INTEGER,

  -- Technical SEO checks
  seo_checks JSONB DEFAULT '{}',
  -- {
  --   title: {pass: true, value: "...", issue: null},
  --   meta_description: {pass: false, value: null, issue: "missing"},
  --   h1: {pass: true, value: "...", issue: null},
  --   heading_hierarchy: {pass: true, issues: []},
  --   image_alt: {pass: false, missing_count: 3, total: 10},
  --   broken_links: {pass: true, count: 0, urls: []},
  --   canonical: {pass: true, value: "..."},
  --   robots_meta: {pass: true, value: "index, follow"}
  -- }

  -- GEO checks
  geo_checks JSONB DEFAULT '{}',
  -- {
  --   citability_score: 72,
  --   citable_blocks: [{text, word_count, score}],
  --   ai_crawler_access: {GPTBot: true, ClaudeBot: false, ...},
  --   llms_txt: {exists: false},
  --   schema_completeness: {score: 60, missing: ["FAQPage"]},
  --   eeat_signals: {score: 45, issues: ["no author bio"]}
  -- }

  -- Recommendations
  recommendations JSONB DEFAULT '[]',
  -- [{priority: "high", type: "missing_meta", message: "Add meta description", fix: "..."}]

  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_audits_page ON audits (page_id);
CREATE INDEX idx_audits_site ON audits (site_id);
CREATE INDEX idx_audits_created ON audits (created_at DESC);
