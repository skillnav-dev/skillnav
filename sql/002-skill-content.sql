-- Migration: 002-skill-content
-- Adds full SKILL.md content and structured metadata fields to the skills table.
-- Run via Supabase SQL Editor or psql.

ALTER TABLE skills ADD COLUMN IF NOT EXISTS content TEXT;
ALTER TABLE skills ADD COLUMN IF NOT EXISTS content_zh TEXT;
ALTER TABLE skills ADD COLUMN IF NOT EXISTS install_command TEXT;
ALTER TABLE skills ADD COLUMN IF NOT EXISTS requires_env TEXT[] DEFAULT '{}';
ALTER TABLE skills ADD COLUMN IF NOT EXISTS requires_bins TEXT[] DEFAULT '{}';
ALTER TABLE skills ADD COLUMN IF NOT EXISTS editor_rating TEXT;
ALTER TABLE skills ADD COLUMN IF NOT EXISTS editor_review_zh TEXT;
