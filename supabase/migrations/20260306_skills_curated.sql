-- Skills 2.0: Curated Gallery
-- Add curated source, repo_source tracking, and editor comments

-- Expand source enum to include 'curated'
ALTER TABLE skills DROP CONSTRAINT IF EXISTS skills_source_check;
ALTER TABLE skills ADD CONSTRAINT skills_source_check
  CHECK (source IN ('clawhub','skills_sh','anthropic','skillsmp','agentskill','manual','curated'));

-- New columns for curated gallery
ALTER TABLE skills ADD COLUMN IF NOT EXISTS repo_source TEXT;
ALTER TABLE skills ADD COLUMN IF NOT EXISTS editor_comment_zh TEXT;

-- Indexes for new filter dimensions
CREATE INDEX IF NOT EXISTS idx_skills_repo_source ON skills(repo_source);
CREATE INDEX IF NOT EXISTS idx_skills_platform ON skills USING GIN(platform);

-- Hide all ClawHub skills (detail pages remain accessible via direct URL)
UPDATE skills SET is_hidden = TRUE WHERE source = 'clawhub';
