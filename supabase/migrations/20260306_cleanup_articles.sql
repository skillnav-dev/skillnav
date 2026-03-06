-- Cleanup: hide articles from removed sources, low relevance, and short content

-- 1. Hide articles from removed sources
UPDATE articles SET status = 'hidden'
WHERE source IN ('vercel', 'google-ai', 'semantic-kernel', 'arstechnica-ai', 'techcrunch-ai')
  AND status != 'hidden';

-- 2. Hide low-relevance articles
UPDATE articles SET status = 'hidden'
WHERE relevance_score < 3
  AND status = 'published';

-- 3. Hide short-content articles (< 500 chars)
UPDATE articles SET status = 'hidden'
WHERE length(coalesce(content, '')) < 500
  AND status = 'published';
