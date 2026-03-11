/**
 * Source adapter for Smithery MCP registry.
 * Paginates through the public API to fetch all MCP server entries.
 *
 * API: GET https://registry.smithery.ai/servers
 * Output: { name, displayName, description, githubUrl, source, verified, useCount, iconUrl, homepage }
 */

import { withRetry } from "../retry.mjs";
import { createLogger } from "../logger.mjs";

const log = createLogger("smithery");

const API_BASE = "https://registry.smithery.ai/servers";
const PAGE_SIZE = 100;
const USER_AGENT = "SkillNav-Sync/1.0";

// ─── Helpers ────────────────────────────────────────────────────────

/**
 * Construct a GitHub URL from qualifiedName if it looks like "owner/repo".
 * Returns null otherwise.
 */
function toGithubUrl(qualifiedName) {
  if (!qualifiedName) return null;
  const parts = qualifiedName.split("/");
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
  return `https://github.com/${qualifiedName}`;
}

/**
 * Fetch a single page of servers from Smithery.
 */
async function fetchPage(page, query = "") {
  const url = new URL(API_BASE);
  if (query) url.searchParams.set("q", query);
  url.searchParams.set("page", String(page));
  url.searchParams.set("pageSize", String(PAGE_SIZE));

  const res = await fetch(url.toString(), {
    headers: { "User-Agent": USER_AGENT },
  });

  if (!res.ok) {
    throw new Error(`Smithery API ${res.status}: ${res.statusText}`);
  }

  return res.json();
}

// ─── Public API ─────────────────────────────────────────────────────

/**
 * Fetch all MCP servers from Smithery registry.
 * Returns deduplicated entries.
 *
 * @returns {Promise<Array<{ name, displayName, description, githubUrl, source, verified, useCount, iconUrl, homepage }>>}
 */
export async function fetchSmitheryServers() {
  const allServers = [];
  let page = 1;
  let totalPages = 1;

  log.info("Fetching servers from Smithery registry...");

  while (page <= totalPages) {
    try {
      const data = await withRetry(() => fetchPage(page), {
        label: `smithery page ${page}`,
        maxRetries: 2,
      });

      const { servers = [], pagination = {} } = data;
      totalPages = pagination.totalPages || 1;

      for (const s of servers) {
        allServers.push({
          name: s.qualifiedName || "",
          displayName: s.displayName || "",
          description: (s.description || "").slice(0, 500),
          githubUrl: toGithubUrl(s.qualifiedName),
          source: "smithery",
          verified: Boolean(s.verified),
          useCount: s.useCount || 0,
          iconUrl: s.iconUrl || "",
          homepage: s.homepage || "",
        });
      }

      log.info(`  Page ${page}/${totalPages}: ${servers.length} servers`);
      page++;
    } catch (err) {
      log.warn(`Failed to fetch page ${page}: ${err.message}`);
      break;
    }
  }

  // Deduplicate by qualifiedName
  const seen = new Map();
  const deduped = [];
  for (const server of allServers) {
    if (server.name && !seen.has(server.name)) {
      seen.set(server.name, true);
      deduped.push(server);
    }
  }

  log.info(
    `Smithery total: ${allServers.length} raw -> ${deduped.length} deduplicated`
  );
  return deduped;
}
