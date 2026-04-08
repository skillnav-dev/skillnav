-- Community signals: X/Twitter, Hacker News, Reddit posts for /trending social track.
CREATE TABLE community_signals (
  id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  platform        TEXT NOT NULL
                  CHECK (platform IN ('x', 'hn', 'reddit')),
  external_id     TEXT NOT NULL,            -- tweet ID / HN story ID / Reddit post ID
  author          TEXT,                     -- display name
  author_handle   TEXT,                     -- @handle (X) or username (HN/Reddit)
  title           TEXT,                     -- HN/Reddit title, null for X
  content_summary TEXT,                     -- original text or excerpt
  content_summary_zh TEXT,                  -- LLM Chinese summary
  url             TEXT NOT NULL,            -- link to original
  score           INT DEFAULT 0,           -- likes (X), score (HN), score (Reddit)
  likes           INT DEFAULT 0,           -- X only
  retweets        INT DEFAULT 0,           -- X only
  comments        INT DEFAULT 0,           -- reply count
  signal_date     DATE NOT NULL,           -- CST date
  fetched_at      TIMESTAMPTZ DEFAULT now(),
  is_hidden       BOOLEAN DEFAULT FALSE,   -- admin moderation flag
  UNIQUE(platform, external_id)
);

-- Primary lookup: trending by date + platform
CREATE INDEX idx_community_signals_date
  ON community_signals(signal_date DESC, platform);

-- Admin moderation queries
CREATE INDEX idx_community_signals_hidden
  ON community_signals(is_hidden, signal_date DESC)
  WHERE is_hidden = TRUE;

-- RLS: scripts write via service_role, public reads non-hidden
ALTER TABLE community_signals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_full_access"
  ON community_signals FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "anon_select_visible"
  ON community_signals FOR SELECT
  USING (is_hidden = FALSE);
