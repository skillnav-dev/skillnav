ALTER TABLE mcp_servers ADD COLUMN IF NOT EXISTS tools JSONB;
COMMENT ON COLUMN mcp_servers.tools IS 'Array of MCP tools: [{name, description, inputSchema?}]';
