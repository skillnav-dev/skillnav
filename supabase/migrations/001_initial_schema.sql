-- ============================================================
-- SkillNav Initial Schema
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- Skills table (multi-source aggregation)
-- ============================================================
CREATE TABLE skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  name_zh TEXT,
  description TEXT,
  description_zh TEXT,
  author TEXT,
  category TEXT,
  tags TEXT[] DEFAULT '{}',
  -- Source tracking
  source TEXT NOT NULL CHECK (source IN ('clawhub', 'skills_sh', 'anthropic', 'skillsmp', 'agentskill', 'manual')),
  source_url TEXT,
  github_url TEXT,
  -- Metrics
  stars INTEGER DEFAULT 0,
  downloads INTEGER DEFAULT 0,
  weekly_downloads INTEGER DEFAULT 0,
  -- Security & trust
  security_score TEXT DEFAULT 'unscanned' CHECK (security_score IN ('safe', 'warning', 'danger', 'unscanned')),
  is_verified BOOLEAN DEFAULT FALSE,
  is_featured BOOLEAN DEFAULT FALSE,
  -- Enrichment
  pricing_type TEXT DEFAULT 'free' CHECK (pricing_type IN ('free', 'freemium', 'paid')),
  platform TEXT[] DEFAULT '{}',
  version TEXT,
  screenshot_urls TEXT[] DEFAULT '{}',
  similar_skills UUID[] DEFAULT '{}',
  -- Freshness
  last_verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Indexes for common queries
CREATE INDEX idx_skills_source ON skills(source);
CREATE INDEX idx_skills_category ON skills(category);
CREATE INDEX idx_skills_is_featured ON skills(is_featured) WHERE is_featured = TRUE;
CREATE INDEX idx_skills_security_score ON skills(security_score);
CREATE INDEX idx_skills_stars ON skills(stars DESC);
CREATE INDEX idx_skills_downloads ON skills(downloads DESC);
CREATE INDEX idx_skills_created_at ON skills(created_at DESC);
CREATE INDEX idx_skills_tags ON skills USING GIN(tags);

-- Dedup index: same name+author from same source should not duplicate
CREATE UNIQUE INDEX idx_skills_dedup ON skills(lower(name), lower(coalesce(author, '')), source);

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_skills_updated_at
  BEFORE UPDATE ON skills
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- Articles table
-- ============================================================
CREATE TABLE articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  title_zh TEXT,
  summary TEXT,
  summary_zh TEXT,
  content TEXT,
  content_zh TEXT,
  source_url TEXT,
  cover_image TEXT,
  reading_time INTEGER DEFAULT 5,
  article_type TEXT DEFAULT 'news' CHECK (article_type IN ('news', 'review', 'comparison', 'tutorial', 'weekly')),
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_articles_article_type ON articles(article_type);
CREATE INDEX idx_articles_published_at ON articles(published_at DESC);

-- ============================================================
-- Submissions table (developer skill submissions)
-- ============================================================
CREATE TABLE submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_name TEXT NOT NULL,
  skill_url TEXT NOT NULL,
  submitter_email TEXT,
  description TEXT,
  is_fast_track BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_submissions_status ON submissions(status);

-- ============================================================
-- Row Level Security
-- ============================================================

-- Skills: public read, service_role write
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Skills are publicly readable"
  ON skills FOR SELECT
  USING (true);

CREATE POLICY "Skills writable by service role"
  ON skills FOR ALL
  USING (auth.role() = 'service_role');

-- Articles: public read, service_role write
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Articles are publicly readable"
  ON articles FOR SELECT
  USING (true);

CREATE POLICY "Articles writable by service role"
  ON articles FOR ALL
  USING (auth.role() = 'service_role');

-- Submissions: anyone can insert, service_role reads/updates
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit"
  ON submissions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Submissions readable by service role"
  ON submissions FOR SELECT
  USING (auth.role() = 'service_role');

CREATE POLICY "Submissions updatable by service role"
  ON submissions FOR UPDATE
  USING (auth.role() = 'service_role');
