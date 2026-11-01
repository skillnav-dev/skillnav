-- Permission boundaries for Skills / MCP servers (issue #24).
-- An LLM writes `draft`; an editor reviews it in /admin/permissions, which
-- copies the (possibly edited) content into `final` and sets `reviewed_at`.
-- Only reviewed rows are public. Shape of draft / final:
-- { files: "none"|"read"|"write", files_note, exec: bool, exec_note,
--   network: bool, network_note, secrets: string[], risk_zh }
CREATE TABLE IF NOT EXISTS tool_permissions (
  item_type     TEXT NOT NULL CHECK (item_type IN ('skill', 'mcp')),
  slug          TEXT NOT NULL,
  draft         JSONB NOT NULL,
  final         JSONB,
  generated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at   TIMESTAMPTZ,
  PRIMARY KEY (item_type, slug)
);

CREATE INDEX IF NOT EXISTS idx_tool_permissions_pending
  ON tool_permissions (item_type, generated_at)
  WHERE reviewed_at IS NULL;

ALTER TABLE tool_permissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_full_access" ON tool_permissions;
CREATE POLICY "service_role_full_access"
  ON tool_permissions FOR ALL
  USING (auth.role() = 'service_role');

-- Public sees reviewed entries only; drafts never leave the admin.
DROP POLICY IF EXISTS "anon_select_reviewed" ON tool_permissions;
CREATE POLICY "anon_select_reviewed"
  ON tool_permissions FOR SELECT
  USING (reviewed_at IS NOT NULL);
