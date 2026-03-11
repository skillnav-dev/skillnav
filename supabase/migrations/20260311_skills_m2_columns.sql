-- Skills M2: Tool Intelligence Pipeline columns
-- Adds status, quality scoring, freshness tracking, and repo metadata

ALTER TABLE skills ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'published' CHECK (status IN ('draft', 'published', 'hidden'));
ALTER TABLE skills ADD COLUMN IF NOT EXISTS intro_zh TEXT;
ALTER TABLE skills ADD COLUMN IF NOT EXISTS quality_score INTEGER;
ALTER TABLE skills ADD COLUMN IF NOT EXISTS quality_reason TEXT;
ALTER TABLE skills ADD COLUMN IF NOT EXISTS discovered_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE skills ADD COLUMN IF NOT EXISTS pushed_at TIMESTAMPTZ;
ALTER TABLE skills ADD COLUMN IF NOT EXISTS forks_count INTEGER DEFAULT 0;
ALTER TABLE skills ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false;
ALTER TABLE skills ADD COLUMN IF NOT EXISTS is_trending BOOLEAN DEFAULT false;
ALTER TABLE skills ADD COLUMN IF NOT EXISTS weekly_stars_delta INTEGER DEFAULT 0;
ALTER TABLE skills ADD COLUMN IF NOT EXISTS freshness TEXT DEFAULT 'active' CHECK (freshness IN ('fresh', 'active', 'stale', 'archived'));
ALTER TABLE skills ADD COLUMN IF NOT EXISTS install_count INTEGER DEFAULT 0;
ALTER TABLE skills ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ;

-- Index for status-based queries
CREATE INDEX IF NOT EXISTS idx_skills_status ON skills(status);

-- Backfill status from is_hidden
UPDATE skills SET status = CASE WHEN is_hidden = true THEN 'hidden' ELSE 'published' END WHERE status IS NULL;
