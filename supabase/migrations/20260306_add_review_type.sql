-- Add 'review' article type for original review/evaluation articles

ALTER TABLE articles DROP CONSTRAINT IF EXISTS articles_article_type_check;
ALTER TABLE articles ADD CONSTRAINT articles_article_type_check
  CHECK (article_type IN ('news', 'tutorial', 'analysis', 'review'));
