-- Content tiers: distinguish editorial vs translated content
-- Series support: weekly newsletters, monthly roundups

ALTER TABLE articles ADD COLUMN IF NOT EXISTS content_tier TEXT DEFAULT 'translated'
  CHECK (content_tier IN ('editorial', 'translated'));
ALTER TABLE articles ADD COLUMN IF NOT EXISTS series TEXT;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS series_number INTEGER;

CREATE INDEX IF NOT EXISTS idx_articles_content_tier ON articles(content_tier);
CREATE INDEX IF NOT EXISTS idx_articles_series ON articles(series) WHERE series IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_articles_editorial_latest ON articles(content_tier, published_at DESC)
  WHERE status = 'published' AND content_tier = 'editorial';

-- Backfill existing articles
UPDATE articles SET content_tier = 'translated' WHERE content_tier IS NULL;
