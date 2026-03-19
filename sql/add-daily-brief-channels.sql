-- Add zhihu and xiaohongshu content columns to daily_briefs
ALTER TABLE daily_briefs ADD COLUMN IF NOT EXISTS content_zhihu text;
ALTER TABLE daily_briefs ADD COLUMN IF NOT EXISTS content_xhs text;

-- Update brief_publications channel constraint: rename xiaohongshu → xhs
ALTER TABLE brief_publications DROP CONSTRAINT IF EXISTS brief_publications_channel_check;
ALTER TABLE brief_publications ADD CONSTRAINT brief_publications_channel_check
  CHECK (channel IN ('wechat', 'x', 'rss', 'xhs', 'zhihu', 'email', 'openclaw'));

-- Migrate any existing rows (unlikely but safe)
UPDATE brief_publications SET channel = 'xhs' WHERE channel = 'xiaohongshu';
