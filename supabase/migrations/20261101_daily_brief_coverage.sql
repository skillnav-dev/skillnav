-- Per-brief source coverage for "今日覆盖 N 个源" on /daily (issue #26).
-- Shape: { total, ok, generated_at, sources: [{ name, label, group, ok, count? }] }
-- Older briefs keep NULL and simply don't show the line.
ALTER TABLE daily_briefs ADD COLUMN IF NOT EXISTS coverage jsonb;
