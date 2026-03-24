-- Pipeline observability: track script runs with status, duration, and funnel data.
CREATE TABLE pipeline_runs (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  pipeline   TEXT NOT NULL,
  status     TEXT NOT NULL DEFAULT 'success'
             CHECK (status IN ('success', 'partial', 'failure', 'skipped')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  duration_s NUMERIC(8,1),
  summary    JSONB DEFAULT '{}'::jsonb,
  error_msg  TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Primary lookup: latest runs per pipeline
CREATE INDEX idx_pipeline_runs_lookup
  ON pipeline_runs(pipeline, started_at DESC);

-- Alert queries: recent failures
CREATE INDEX idx_pipeline_runs_failures
  ON pipeline_runs(status, started_at DESC)
  WHERE status IN ('failure', 'partial');

-- RLS: scripts write via service_role, admin UI reads via anon
ALTER TABLE pipeline_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_full_access"
  ON pipeline_runs FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "anon_select"
  ON pipeline_runs FOR SELECT
  USING (true);
