/**
 * Source adapter for the Official MCP Registry.
 * Fetches all servers via cursor-based pagination.
 *
 * API: GET https://registry.modelcontextprotocol.io/v0/servers
 *
 * Output: { name, displayName, description, githubUrl, source: 'mcp-registry',
 *           version, remoteUrl, publishedAt }
 */

import { withRetry } from "../retry.mjs";
import { createLogger } from "../logger.mjs";

const log = createLogger("mcp-registry");

const BASE_URL = "https://registry.modelcontextprotocol.io/v0/servers";
const PAGE_SIZE = 100;
const USER_AGENT = "SkillNav-Sync/1.0";

// ─── Helpers ────────────────────────────────────────────────────────

/**
 * Normalize repository URL to a clean GitHub URL.
 */
function normalizeRepoUrl(url) {
  if (!url) return "";
  try {
    const u = new URL(url.replace(/^git\+/, "").replace(/\.git$/, ""));
    if (!u.hostname.includes("github.com")) return url;
    return `https://github.com${u.pathname.replace(/\/+$/, "")}`.toLowerCase();
  } catch {
    return url;
  }
}

/**
 * Fetch a single page from the registry API.
 */
async function fetchPage(cursor) {
  const params = new URLSearchParams({ limit: String(PAGE_SIZE) });
  if (cursor) params.set("cursor", cursor);

  const url = `${BASE_URL}?${params}`;
  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT },
  });

  if (!res.ok) {
    throw new Error(`Registry API ${res.status}: ${res.statusText}`);
  }

  return res.json();
}

// ─── Public API ─────────────────────────────────────────────────────

/**
 * Fetch all servers from the Official MCP Registry.
 * Returns deduplicated server entries.
 *
 * @returns {Promise<Array<{ name, displayName, description, githubUrl, source, version, remoteUrl, publishedAt }>>}
 */
export async function fetchMcpRegistryServers() {
  log.info("Fetching servers from Official MCP Registry...");

  const allServers = [];
  let cursor = undefined;
  let page = 0;

  // Paginate through all results
  while (true) {
    page++;
    log.info(`  Page ${page}${cursor ? ` (cursor: ${cursor.slice(0, 16)}...)` : ""}...`);

    let data;
    try {
      data = await withRetry(() => fetchPage(cursor), {
        label: `registry-page-${page}`,
        maxRetries: 2,
      });
    } catch (err) {
      log.warn(`Failed to fetch page ${page}: ${err.message}`);
      break;
    }

    const servers = data.servers || [];
    for (const entry of servers) {
      const s = entry.server || {};
      const meta = entry._meta?.["io.modelcontextprotocol.registry/official"] || {};

      allServers.push({
        name: s.name || "",
        displayName: s.title || s.name || "",
        description: s.description || "",
        githubUrl: normalizeRepoUrl(s.repository?.url),
        source: "mcp-registry",
        version: s.version || "",
        remoteUrl: s.remotes?.[0]?.url || "",
        publishedAt: meta.publishedAt || "",
      });
    }

    cursor = data.metadata?.nextCursor;
    if (!cursor || servers.length === 0) break;
  }

  // Deduplicate by name
  const seen = new Map();
  const deduped = [];
  for (const server of allServers) {
    const key = server.name.toLowerCase();
    if (key && !seen.has(key)) {
      seen.set(key, true);
      deduped.push(server);
    }
  }

  log.info(`MCP Registry total: ${allServers.length} raw -> ${deduped.length} deduplicated`);
  return deduped;
}
