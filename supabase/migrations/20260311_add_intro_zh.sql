-- Add intro_zh column for editor's intro (导读)
ALTER TABLE articles ADD COLUMN IF NOT EXISTS intro_zh TEXT;

-- Add comment
COMMENT ON COLUMN articles.intro_zh IS 'Editor intro (导读): 2-3 sentence summary of what article covers and why it matters';
