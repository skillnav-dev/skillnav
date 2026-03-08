-- Phase 1: Simplify article types to tutorial / analysis / guide
-- Removes: news, review, comparison, weekly
-- Applied manually via reclassify-news.mjs + Management API on 2026-03-08

-- Merge legacy types
UPDATE articles SET article_type = 'guide' WHERE article_type IN ('review', 'comparison', 'weekly');
UPDATE articles SET article_type = 'analysis' WHERE article_type = 'news';

-- Update constraint
ALTER TABLE articles DROP CONSTRAINT IF EXISTS articles_article_type_check;
ALTER TABLE articles ADD CONSTRAINT articles_article_type_check
  CHECK (article_type IN ('tutorial', 'analysis', 'guide'));
