-- Daily briefs: AI-generated daily newsletter content
create table if not exists daily_briefs (
  id uuid primary key default gen_random_uuid(),
  brief_date date unique not null,
  title text not null,
  summary text,
  content_md text not null,
  content_wechat text,
  content_x text,
  article_ids uuid[] default '{}',
  status text not null default 'draft' check (status in ('draft', 'approved', 'published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Index for listing briefs by date
create index if not exists idx_daily_briefs_date on daily_briefs (brief_date desc);
-- Index for filtering by status
create index if not exists idx_daily_briefs_status on daily_briefs (status);

-- Publication records: tracks per-channel publish status
create table if not exists brief_publications (
  id uuid primary key default gen_random_uuid(),
  brief_id uuid not null references daily_briefs(id) on delete cascade,
  channel text not null check (channel in ('wechat', 'x', 'rss', 'xhs', 'zhihu', 'email', 'openclaw')),
  status text not null default 'pending' check (status in ('pending', 'published', 'failed')),
  published_at timestamptz,
  external_url text,
  created_at timestamptz not null default now(),
  unique (brief_id, channel)
);

-- Auto-update updated_at on daily_briefs
create or replace function update_daily_briefs_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger daily_briefs_updated_at
  before update on daily_briefs
  for each row execute function update_daily_briefs_updated_at();
