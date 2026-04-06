-- Individual pages discovered during crawl
CREATE TABLE IF NOT EXISTS pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  path TEXT NOT NULL,                    -- e.g., "/egypt-tours/upper-egypt"
  title TEXT,
  meta_description TEXT,
  h1 TEXT,
  headings JSONB DEFAULT '[]',           -- [{level: 1, text: "..."}, ...]
  body_text TEXT,                         -- plain text content (stripped HTML)
  word_count INTEGER DEFAULT 0,
  content_type TEXT,                      -- "tour", "destination", "blog", "category", etc.

  -- Existing links found on this page
  outbound_links JSONB DEFAULT '[]',     -- [{url, anchor_text, is_internal}]
  inbound_link_count INTEGER DEFAULT 0,  -- how many other pages link to this one

  -- Schema/structured data found
  schema_types TEXT[] DEFAULT '{}',      -- e.g., '{TourPackage, FAQPage}'
  has_json_ld BOOLEAN DEFAULT false,

  -- Embedding for similarity search (Phase 3)
  embedding vector(1024),                -- Cohere embed-english-v3.0 dimension

  -- Status
  crawl_depth INTEGER DEFAULT 0,         -- how many clicks from homepage
  last_crawled_at TIMESTAMPTZ,
  status_code INTEGER,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX idx_pages_url ON pages (site_id, url);
CREATE INDEX idx_pages_site ON pages (site_id);
CREATE INDEX idx_pages_path ON pages (path);
CREATE INDEX idx_pages_content_type ON pages (content_type);

-- Vector similarity index (IVFFlat for fast nearest-neighbor search)
-- Only useful after embeddings are populated (Phase 3)
CREATE INDEX idx_pages_embedding ON pages
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);
