-- MCP Servers table for SkillNav
-- Run in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS mcp_servers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  name_zh TEXT,
  author TEXT,
  description TEXT,
  description_zh TEXT,
  intro_zh TEXT,
  category TEXT,
  tags TEXT[] DEFAULT '{}',
  github_url TEXT,
  npm_package TEXT,
  install_command TEXT,
  install_config JSONB,
  tools_count INTEGER DEFAULT 0,
  version TEXT,
  stars INTEGER DEFAULT 0,
  forks_count INTEGER DEFAULT 0,
  weekly_downloads INTEGER DEFAULT 0,
  quality_score INTEGER,
  quality_tier TEXT DEFAULT 'B' CHECK (quality_tier IN ('S', 'A', 'B', 'C')),
  quality_reason TEXT,
  editor_comment_zh TEXT,
  editor_rating NUMERIC(2,1),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'hidden')),
  source TEXT,
  source_url TEXT,
  is_verified BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  is_trending BOOLEAN DEFAULT false,
  is_archived BOOLEAN DEFAULT false,
  weekly_stars_delta INTEGER DEFAULT 0,
  freshness TEXT DEFAULT 'active' CHECK (freshness IN ('fresh', 'active', 'stale', 'archived')),
  pushed_at TIMESTAMPTZ,
  discovered_at TIMESTAMPTZ DEFAULT now(),
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mcp_servers_status ON mcp_servers(status);
CREATE INDEX IF NOT EXISTS idx_mcp_servers_category ON mcp_servers(category);
CREATE INDEX IF NOT EXISTS idx_mcp_servers_source ON mcp_servers(source);
-- Note: slug UNIQUE constraint already creates an implicit index

-- Enable RLS
ALTER TABLE mcp_servers ENABLE ROW LEVEL SECURITY;

-- Public read policy (published only, anon + authenticated)
CREATE POLICY "Public can read published mcp_servers"
  ON mcp_servers FOR SELECT
  USING (status = 'published');

-- Service role bypasses RLS automatically, no extra policy needed
