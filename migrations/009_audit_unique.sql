-- Add unique constraint on page_id for audit upserts (one audit per page)
CREATE UNIQUE INDEX IF NOT EXISTS idx_audits_page_unique ON audits (page_id);
