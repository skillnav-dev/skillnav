/**
 * Turn MCP discovery-source entries into mcp_servers rows (status=draft).
 * Shared by sync-mcp-servers.mjs and mcp-weekly-candidates.mjs.
 */

// ─── Slug generation ─────────────────────────────────────────────────

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Generate a slug from qualified name or server name.
 * "owner/repo" → "owner--repo", "my-server" → "my-server"
 */
function makeSlug(name) {
  if (!name) return "";
  if (name.includes("/")) {
    const parts = name.split("/").filter(Boolean);
    if (parts.length >= 2) {
      return `${slugify(parts[parts.length - 2])}--${slugify(parts[parts.length - 1])}`;
    }
  }
  // For reverse-DNS names like "com.example/server", simplify
  return slugify(name);
}

/**
 * Extract owner from GitHub URL or qualified name.
 */
function extractAuthor(githubUrl, name) {
  if (githubUrl) {
    try {
      const parts = new URL(githubUrl).pathname.split("/").filter(Boolean);
      if (parts[0]) return parts[0];
    } catch { /* fall through */ }
  }
  if (name && name.includes("/")) {
    return name.split("/")[0];
  }
  return "unknown";
}

// ─── Transform sources to DB rows ────────────────────────────────────

export function transformRegistryEntry(entry) {
  const slug = makeSlug(entry.name);
  if (!slug) return null;

  return {
    slug,
    name: entry.displayName || entry.name,
    author: extractAuthor(entry.githubUrl, entry.name),
    description: entry.description || "",
    github_url: entry.githubUrl || null,
    version: entry.version || null,
    source: "mcp-registry",
    source_url: entry.remoteUrl || entry.githubUrl || null,
    status: "draft",
    stars: 0,
    forks_count: 0,
    weekly_downloads: 0,
    tools_count: 0,
    quality_score: null,
    discovered_at: entry.publishedAt || new Date().toISOString(),
    last_synced_at: new Date().toISOString(),
  };
}
