-- Stars snapshots table for weekly trend tracking.
-- Records point-in-time metrics for skills and MCP servers.

CREATE TABLE IF NOT EXISTS stars_snapshots (
  id BIGSERIAL PRIMARY KEY,
  tool_type TEXT NOT NULL CHECK (tool_type IN ('skill', 'mcp')),
  tool_slug TEXT NOT NULL,
  stars_count INTEGER NOT NULL,
  forks_count INTEGER DEFAULT 0,
  pushed_at TIMESTAMPTZ,
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tool_type, tool_slug, snapshot_date)
);

CREATE INDEX IF NOT EXISTS idx_snapshots_lookup
  ON stars_snapshots(tool_type, tool_slug, snapshot_date DESC);
