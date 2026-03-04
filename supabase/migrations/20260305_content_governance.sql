-- Content Governance: quality_tier, is_hidden for skills; expand article_type
-- Run via Supabase SQL Editor or Management API

-- Skills: quality tier (A/B/C) for content scoring
ALTER TABLE skills ADD COLUMN IF NOT EXISTS quality_tier TEXT CHECK (quality_tier IN ('A', 'B', 'C'));

-- Skills: hide spam / low-quality from listings
ALTER TABLE skills ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT FALSE;

-- Indexes for governance queries
CREATE INDEX IF NOT EXISTS idx_skills_quality ON skills(quality_tier);
CREATE INDEX IF NOT EXISTS idx_skills_hidden ON skills(is_hidden) WHERE is_hidden = TRUE;

-- Articles: expand article_type to include 'analysis'
-- First drop old constraint, then add new one
ALTER TABLE articles DROP CONSTRAINT IF EXISTS articles_article_type_check;
ALTER TABLE articles ADD CONSTRAINT articles_article_type_check
  CHECK (article_type IN ('news', 'tutorial', 'analysis', 'review', 'comparison', 'weekly'));
