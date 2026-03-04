-- Articles upgrade: add source column, simplify article_type from 6 to 3

-- Add source field
ALTER TABLE articles ADD COLUMN IF NOT EXISTS source TEXT;

-- Backfill source from source_url patterns
UPDATE articles SET source = 'anthropic' WHERE source_url LIKE '%anthropic.com%';
UPDATE articles SET source = 'openai' WHERE source_url LIKE '%openai.com%';
UPDATE articles SET source = 'langchain' WHERE source_url LIKE '%langchain%';
UPDATE articles SET source = 'simonw' WHERE source_url LIKE '%simonwillison%';
UPDATE articles SET source = 'google-ai' WHERE source_url LIKE '%blog.google%';
UPDATE articles SET source = 'github' WHERE source_url LIKE '%github.blog%';
UPDATE articles SET source = 'huggingface' WHERE source_url LIKE '%huggingface%';
UPDATE articles SET source = 'crewai' WHERE source_url LIKE '%crewai%';
UPDATE articles SET source = 'techcrunch-ai' WHERE source_url LIKE '%techcrunch%';
UPDATE articles SET source = 'other' WHERE source IS NULL;

-- Simplify article_type: merge unused types into news
UPDATE articles SET article_type = 'news' WHERE article_type IN ('review', 'comparison', 'weekly');

-- Replace constraint with 3-value check
ALTER TABLE articles DROP CONSTRAINT IF EXISTS articles_article_type_check;
ALTER TABLE articles ADD CONSTRAINT articles_article_type_check
  CHECK (article_type IN ('news', 'tutorial', 'analysis'));

-- Index for source queries
CREATE INDEX IF NOT EXISTS idx_articles_source ON articles(source);
