/**
 * Source adapter for awesome-list repositories.
 * Parses README.md markdown tables/lists to extract skill entries.
 *
 * Sources:
 *   - VoltAgent/awesome-agent-skills (8.4K stars, 500+ skills)
 *   - travisvn/awesome-claude-skills (7.6K stars)
 *
 * Output: { name, description, githubUrl, source: 'awesome-list', tags: [] }
 */

import { githubFetchRaw } from "../github.mjs";
import { withRetry } from "../retry.mjs";
import { createLogger } from "../logger.mjs";

const log = createLogger("awesome");

// ─── URL normalization ──────────────────────────────────────────────

/**
 * Normalize a GitHub URL for deduplication.
 * Strips trailing slash, enforces https, lowercases host.
 */
export function normalizeGithubUrl(url) {
  if (!url) return null;
  try {
    const u = new URL(url);
    // Only keep github.com URLs
    if (!u.hostname.includes("github.com")) return null;
    // Remove trailing slash, hash, query params
    let path = u.pathname.replace(/\/+$/, "");
    // Strip /tree/main etc. to get the repo root
    path = path.replace(/\/tree\/[^/]+.*$/, "");
    // Strip /blob/... paths
    path = path.replace(/\/blob\/[^/]+.*$/, "");
    return `https://github.com${path}`.toLowerCase();
  } catch {
    return null;
  }
}

// ─── Markdown parsing helpers ───────────────────────────────────────

/**
 * Extract GitHub links from markdown text.
 * Supports:
 *   - [name](https://github.com/owner/repo) — description
 *   - | [name](url) | description | ...
 *   - - [name](url) - description
 */
function extractLinksFromMarkdown(content) {
  const results = [];
  const lines = content.split("\n");

  for (const line of lines) {
    // Skip headings, empty lines, comments
    if (/^#+\s/.test(line) || !line.trim()) continue;

    // Match markdown links: [text](url)
    const linkPattern = /\[([^\]]+)\]\((https?:\/\/github\.com\/[^)]+)\)/g;
    let match;

    while ((match = linkPattern.exec(line)) !== null) {
      const name = match[1].trim();
      const rawUrl = match[2].trim();

      // Skip non-repo links (e.g. github.com/topics/...)
      const urlPath = new URL(rawUrl).pathname.replace(/\/+$/, "");
      const pathParts = urlPath.split("/").filter(Boolean);
      if (pathParts.length < 2) continue;

      // Extract description: text after the link
      const afterLink = line.slice(match.index + match[0].length);
      let description = "";

      // Table format: | ... | description | ...
      if (line.trim().startsWith("|")) {
        const cells = line.split("|").map((c) => c.trim()).filter(Boolean);
        // Find the cell after the one containing the link
        const linkCellIdx = cells.findIndex((c) => c.includes(rawUrl));
        if (linkCellIdx >= 0 && linkCellIdx + 1 < cells.length) {
          description = cells[linkCellIdx + 1];
        }
      } else {
        // List format: - [name](url) - description  OR  — description
        const descMatch = afterLink.match(/^\s*[-–—:]\s*(.+)/);
        if (descMatch) {
          description = descMatch[1].trim();
        } else {
          // Fallback: everything after the link on the same line
          description = afterLink.replace(/^\s*[-–—|:]*\s*/, "").trim();
        }
      }

      // Clean up description: remove trailing markdown artifacts
      description = description
        .replace(/\|.*$/, "")  // Remove trailing table cells
        .replace(/\[.*?\]\(.*?\)/g, "")  // Remove nested links
        .replace(/[`*_]/g, "")  // Remove formatting
        .trim();

      // Skip entries with very short names (likely navigation links)
      if (name.length < 2) continue;
      // Skip if name is just emoji or icon
      if (/^[\p{Emoji}\s]+$/u.test(name)) continue;

      const githubUrl = normalizeGithubUrl(rawUrl);
      if (!githubUrl) continue;

      results.push({
        name,
        description: description.slice(0, 500),
        githubUrl,
        source: "awesome-list",
        tags: [],
      });
    }
  }

  return results;
}

// ─── Source definitions ─────────────────────────────────────────────

const AWESOME_SOURCES = [
  {
    owner: "VoltAgent",
    repo: "awesome-agent-skills",
    ref: "main",
    file: "README.md",
    label: "awesome-agent-skills",
  },
  {
    owner: "travisvn",
    repo: "awesome-claude-skills",
    ref: "main",
    file: "README.md",
    label: "awesome-claude-skills",
  },
];

// ─── Public API ─────────────────────────────────────────────────────

/**
 * Fetch and parse all awesome-list sources.
 * Returns deduplicated skill entries.
 *
 * @returns {Promise<Array<{ name, description, githubUrl, source, tags }>>}
 */
export async function fetchAwesomeSkills() {
  const allSkills = [];

  for (const src of AWESOME_SOURCES) {
    log.info(`Fetching ${src.owner}/${src.repo}/${src.file}...`);

    try {
      const content = await withRetry(
        () => githubFetchRaw(src.owner, src.repo, src.file, src.ref),
        { label: `${src.owner}/${src.repo}`, maxRetries: 2 }
      );

      const skills = extractLinksFromMarkdown(content);
      log.info(`  Parsed ${skills.length} entries from ${src.label}`);

      // Tag with source repo for traceability
      for (const s of skills) {
        s.repoSource = `${src.owner}/${src.repo}`;
      }

      allSkills.push(...skills);
    } catch (err) {
      log.warn(`Failed to fetch ${src.label}: ${err.message}`);
    }
  }

  // Deduplicate by normalized githubUrl
  const seen = new Map();
  const deduped = [];
  for (const skill of allSkills) {
    if (!seen.has(skill.githubUrl)) {
      seen.set(skill.githubUrl, true);
      deduped.push(skill);
    }
  }

  log.info(`Awesome-list total: ${allSkills.length} raw -> ${deduped.length} deduplicated`);
  return deduped;
}
