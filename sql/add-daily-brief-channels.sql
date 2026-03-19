-- Add zhihu and xiaohongshu content columns to daily_briefs
ALTER TABLE daily_briefs ADD COLUMN IF NOT EXISTS content_zhihu text;
ALTER TABLE daily_briefs ADD COLUMN IF NOT EXISTS content_xhs text;
