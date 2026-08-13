-- Add name_key column (idempotent: may already exist from an earlier migration)
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "name_key" TEXT;

-- Backfill name_key for all projects that still have NULL.
-- The canonicalization must match the app's toNameKey() logic: lower-case,
-- replace spaces and underscores with hyphens, strip non-letter/digit chars,
-- collapse repeated hyphens, and trim leading/trailing hyphens.
UPDATE "projects" SET "name_key" = (
  CASE
    WHEN regexp_replace(
      regexp_replace(
        regexp_replace(
          regexp_replace(
            lower(trim("name")),
            '[\s_]+', '-', 'g'
          ),
          '[^[:alnum:][:space:]-]', '', 'g'
        ),
        '-+', '-', 'g'
      ),
      '^-+|-+$', '', 'g'
    ) = '' THEN lower(trim("name"))
    ELSE regexp_replace(
      regexp_replace(
        regexp_replace(
          regexp_replace(
            lower(trim("name")),
            '[\s_]+', '-', 'g'
          ),
          '[^[:alnum:][:space:]-]', '', 'g'
        ),
        '-+', '-', 'g'
      ),
      '^-+|-+$', '', 'g'
    )
  END
)
WHERE "name_key" IS NULL;

-- Ensure the backfill did not produce conflicting (owner_id, name_key) pairs.
-- If any duplicates remain, abort with a clear report listing their project IDs.
DO $$
DECLARE
  duplicate_count integer;
  conflict_report text;
BEGIN
  WITH duplicate_groups AS (
    SELECT owner_id, name_key, array_agg(id ORDER BY id) AS project_ids
    FROM "projects"
    GROUP BY owner_id, name_key
    HAVING count(*) > 1
  )
  SELECT count(*), string_agg(project_id::text, ', ' ORDER BY project_id)
    INTO duplicate_count, conflict_report
  FROM (
    SELECT unnest(project_ids) AS project_id
    FROM duplicate_groups
  ) d;

  IF duplicate_count > 0 THEN
    RAISE EXCEPTION 'Duplicate project name keys detected before unique index creation. Conflicting project IDs: %', conflict_report;
  END IF;
END $$;

-- Make name_key NOT NULL after population
ALTER TABLE "projects" ALTER COLUMN "name_key" SET NOT NULL;

-- Add unique index on (owner_id, name_key) (idempotent: may already exist)
CREATE UNIQUE INDEX IF NOT EXISTS "projects_owner_id_name_key_key" ON "projects"("owner_id", "name_key");
