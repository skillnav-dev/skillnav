-- D1: Data layer hardening — normalize source_url + UNIQUE constraint
-- Prevents duplicate articles from URL variants (trailing slash, http/https, query params)

-- Step 1: Create normalization function
CREATE OR REPLACE FUNCTION normalize_url(url TEXT) RETURNS TEXT AS $$
  SELECT regexp_replace(
    regexp_replace(
      regexp_replace(lower(trim(url)), '^http://', 'https://'),
      '[?#].*$', ''),
    '/$', '')
$$ LANGUAGE sql IMMUTABLE;

-- Step 2: Add generated column
ALTER TABLE articles
  ADD COLUMN source_url_normalized TEXT
  GENERATED ALWAYS AS (normalize_url(source_url)) STORED;

-- Step 3: Create unique index (CONCURRENTLY not supported inside transaction block,
-- so we use a regular unique index here; for zero-downtime on large tables,
-- run CREATE UNIQUE INDEX CONCURRENTLY separately)
CREATE UNIQUE INDEX idx_articles_source_url_normalized
  ON articles (source_url_normalized)
  WHERE source_url_normalized IS NOT NULL;
