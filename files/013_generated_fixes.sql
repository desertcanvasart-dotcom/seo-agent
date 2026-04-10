-- Generated fix suggestions — one row per page per fix type
-- fix_type: "schema" | "content_rewrite" | "llms_txt" | "robots_txt" | "meta_title"
-- status:   "pending" | "approved" | "dismissed"
-- For site-level fixes (llms_txt, robots_txt), page_id is NULL

CREATE TABLE IF NOT EXISTS generated_fixes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  page_id UUID REFERENCES pages(id) ON DELETE CASCADE,

  fix_type TEXT NOT NULL,
  -- schema:         JSON-LD blocks ready to paste into <head>
  -- content_rewrite: before/after passage rewrites + FAQ additions
  -- llms_txt:       complete llms.txt file ready to deploy at /llms.txt
  -- robots_txt:     complete corrected robots.txt + minimal lines to add
  -- meta_title:     suggested title and meta description

  status TEXT DEFAULT 'pending',
  -- pending:   generated, not yet reviewed by the user
  -- approved:  user has approved — considered "done"
  -- dismissed: user has dismissed — not relevant

  generated_content JSONB NOT NULL DEFAULT '{}',
  -- The full structured output from the generator service.
  -- Shape varies per fix_type — see generator services for exact schema.

  reviewed_at TIMESTAMPTZ,
  reviewed_by TEXT,
  note TEXT,  -- optional user note on approval/dismissal

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- One active fix per page per type (upsert target)
CREATE UNIQUE INDEX IF NOT EXISTS idx_generated_fixes_page_type
  ON generated_fixes (page_id, fix_type)
  WHERE page_id IS NOT NULL;

-- One active site-level fix per type (llms_txt, robots_txt)
CREATE UNIQUE INDEX IF NOT EXISTS idx_generated_fixes_site_type
  ON generated_fixes (site_id, fix_type)
  WHERE page_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_generated_fixes_site ON generated_fixes (site_id);
CREATE INDEX IF NOT EXISTS idx_generated_fixes_status ON generated_fixes (status);
CREATE INDEX IF NOT EXISTS idx_generated_fixes_type ON generated_fixes (fix_type);
