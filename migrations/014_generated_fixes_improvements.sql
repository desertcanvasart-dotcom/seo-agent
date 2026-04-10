-- Improvements to the generated_fixes table (follow-up to 013)
-- This migration adds:
--   1. An auto-updating `updated_at` trigger
--   2. A composite index for the most common query path (site + type + status)
--   3. CHECK constraints on fix_type and status to enforce valid values
--
-- Run this migration after 013_generated_fixes.sql.
-- If there are existing rows with non-standard fix_type or status values,
-- clean them up first or the ALTER TABLE statements below will fail.

-- ─── 1. Auto-update `updated_at` on row modifications ─────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS generated_fixes_set_updated_at ON generated_fixes;
CREATE TRIGGER generated_fixes_set_updated_at
  BEFORE UPDATE ON generated_fixes
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- ─── 2. Composite index for /fixes list queries ──────────────────
-- The most common query path: filter by site_id, optionally by fix_type and status,
-- ordered by created_at. A composite index covers all filter combinations.
CREATE INDEX IF NOT EXISTS idx_generated_fixes_site_type_status
  ON generated_fixes (site_id, fix_type, status);

-- ─── 3. CHECK constraints for data integrity ──────────────────────
ALTER TABLE generated_fixes
  DROP CONSTRAINT IF EXISTS generated_fixes_fix_type_check;
ALTER TABLE generated_fixes
  ADD CONSTRAINT generated_fixes_fix_type_check
  CHECK (fix_type IN ('schema', 'content_rewrite', 'llms_txt', 'robots_txt', 'meta_title'));

ALTER TABLE generated_fixes
  DROP CONSTRAINT IF EXISTS generated_fixes_status_check;
ALTER TABLE generated_fixes
  ADD CONSTRAINT generated_fixes_status_check
  CHECK (status IN ('pending', 'approved', 'dismissed'));
