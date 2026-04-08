-- Unique constraint on audits (one audit per page)
CREATE UNIQUE INDEX IF NOT EXISTS idx_audits_page_unique ON audits (page_id);

-- pgvector similarity search function
CREATE OR REPLACE FUNCTION match_pages(
  query_embedding vector(1536),
  match_site_id uuid,
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  id uuid,
  url text,
  path text,
  title text,
  content_type text,
  distance float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.url,
    p.path,
    p.title,
    p.content_type,
    (p.embedding <=> query_embedding)::float AS distance
  FROM pages p
  WHERE p.site_id = match_site_id
    AND p.embedding IS NOT NULL
    AND (p.embedding <=> query_embedding) < (1 - match_threshold)
  ORDER BY p.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
