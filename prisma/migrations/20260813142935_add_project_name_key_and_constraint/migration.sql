-- Add name_key column (nullable initially for data migration)
ALTER TABLE "projects" ADD COLUMN "name_key" TEXT;

-- Populate name_key for all existing projects:
-- Simple slug: lowercase, spaces to hyphens, remove special chars
UPDATE "projects" SET "name_key" = (
  SELECT regexp_replace(
    regexp_replace(
      regexp_replace(
        lower(trim("name")),
        '\s+', '-', 'g'      -- Replace spaces/underscores with hyphens
      ),
      '[^\w-]', '', 'g'     -- Remove non-word chars except hyphens
    ),
    '-+', '-', 'g'          -- Replace multiple hyphens with single
  )
)
WHERE "name_key" IS NULL;

-- Handle edge case: empty slugs (all special chars)
-- For names that slugify to empty string, use the trimmed lowercase original
UPDATE "projects" 
SET "name_key" = lower(trim("name"))
WHERE "name_key" = '' OR "name_key" IS NULL;

-- Make name_key NOT NULL after population
ALTER TABLE "projects" ALTER COLUMN "name_key" SET NOT NULL;

-- Add unique constraint on (owner_id, name_key)
ALTER TABLE "projects" ADD CONSTRAINT "projects_owner_id_name_key_key" UNIQUE ("owner_id", "name_key");
