-- Fix linear MCP server: original repo linear/linear-mcp-server is 404
-- Community alternative: jerhadf/linear-mcp-server (344 stars)

UPDATE mcp_servers
SET
  author = 'jerhadf',
  github_url = 'https://github.com/jerhadf/linear-mcp-server',
  install_command = 'npx -y linear-mcp-server',
  stars = 344,
  updated_at = now()
WHERE slug = 'linear';
