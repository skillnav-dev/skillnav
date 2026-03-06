-- Article content review: add status + relevance_score fields

-- Add status field (replaces implicit "all published")
ALTER TABLE articles ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'published'
  CHECK (status IN ('published', 'draft', 'hidden'));

-- Add LLM relevance score (1-5)
ALTER TABLE articles ADD COLUMN IF NOT EXISTS relevance_score INTEGER
  CHECK (relevance_score BETWEEN 1 AND 5);

-- Index for listing queries filtered by status
CREATE INDEX IF NOT EXISTS idx_articles_status ON articles (status);

-- Set existing short/low-quality articles to hidden
UPDATE articles SET status = 'hidden'
WHERE length(coalesce(content, '')) < 300;
