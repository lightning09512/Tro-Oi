-- Imported rental listings have no Trọ Ơi account owner. Keep their source
-- attribution while allowing the source to omit the room area.
ALTER TABLE listings ALTER COLUMN owner_id DROP NOT NULL;
ALTER TABLE listings ALTER COLUMN area_m2 DROP NOT NULL;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS source_name text;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS source_url text;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS source_checked_at timestamptz;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'listings_owner_or_source_check'
      AND conrelid = 'listings'::regclass
  ) THEN
    ALTER TABLE listings ADD CONSTRAINT listings_owner_or_source_check CHECK (
      (owner_id IS NOT NULL AND source_name IS NULL AND source_url IS NULL)
      OR (owner_id IS NULL AND source_name IS NOT NULL AND source_url IS NOT NULL AND source_checked_at IS NOT NULL)
    );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS listings_source_url_idx ON listings(source_url) WHERE source_url IS NOT NULL;
