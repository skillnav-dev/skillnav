/**
 * Source adapter for skills.sh (Vercel Labs Skills ecosystem).
 *
 * Strategy:
 *   1. Try GitHub API: fetch vercel-labs/skills repo registry data
 *   2. Fallback: fetch the skills.sh website for structured data
 *
 * Key signal: install_count (more meaningful than stars)
 *
 * Output: { name, description, githubUrl, installCount, source: 'skills-sh' }
 */

import { githubFetch, githubFetchRaw } from "../github.mjs";
import { withRetry } from "../retry.mjs";
import { createLogger } from "../logger.mjs";

const log = createLogger("skills-sh");

// ─── Registry parsing ───────────────────────────────────────────────

/**
 * Parse a registry JSON or JSONL file that lists skills.
 * Expected format: array of { name, description, github_url, installs, ... }
 * Flexible enough to handle different naming conventions.
 */
function parseRegistryData(data) {
  const items = Array.isArray(data) ? data : [];
  const results = [];

  for (const item of items) {
    const name = item.name || item.title || item.slug || "";
    const description = item.description || item.summary || "";
    const githubUrl =
      item.github_url ||
      item.githubUrl ||
      item.repository ||
      item.repo_url ||
      item.url ||
      "";
    const installCount =
      item.installs ||
      item.install_count ||
      item.installCount ||
      item.downloads ||
      0;

    if (!name) continue;

    results.push({
      name,
      description: String(description).slice(0, 500),
      githubUrl: githubUrl ? normalizeUrl(githubUrl) : "",
      installCount: typeof installCount === "number" ? installCount : 0,
      source: "skills-sh",
      tags: Array.isArray(item.tags) ? item.tags : [],
    });
  }

  return results;
}

/**
 * Normalize a URL for consistency.
 */
function normalizeUrl(url) {
  if (!url) return "";
  try {
    // Strip git+ prefix and .git suffix (common in npm registry URLs)
    let cleaned = url.replace(/^git\+/, "").replace(/\.git$/, "");
    const u = new URL(cleaned);
    return u.href.replace(/\/+$/, "").toLowerCase();
  } catch {
    return url.replace(/^git\+/, "").replace(/\.git$/, "").toLowerCase().replace(/\/+$/, "");
  }
}

// ─── GitHub-based discovery ─────────────────────────────────────────

/**
 * Search for skills registry files in the vercel-labs/skills repo.
 * Tries common paths for registry/directory data.
 */
async function fetchFromGitHubRepo() {
  const owner = "vercel-labs";
  const repo = "skills";
  const ref = "main";

  // Try to fetch the repo tree to find registry files
  log.info(`Fetching ${owner}/${repo} tree...`);

  let tree;
  try {
    tree = await withRetry(
      () => githubFetch(`/repos/${owner}/${repo}/git/trees/${ref}?recursive=1`),
      { label: `tree:${owner}/${repo}`, maxRetries: 2 }
    );
  } catch (err) {
    log.warn(`Cannot access ${owner}/${repo}: ${err.message}`);
    return [];
  }

  // Look for JSON/JSONL registry files
  const registryPaths = tree.tree
    .filter((e) => {
      if (e.type !== "blob") return false;
      const p = e.path.toLowerCase();
      return (
        p.includes("registry") ||
        p.includes("directory") ||
        p.includes("skills.json") ||
        p.includes("packages.json") ||
        p.includes("catalog")
      );
    })
    .map((e) => e.path);

  if (registryPaths.length === 0) {
    log.info("No registry files found in repo tree");

    // Fallback: look for package.json files that define skills
    const skillPaths = tree.tree
      .filter(
        (e) =>
          e.type === "blob" &&
          e.path.endsWith("/package.json") &&
          !e.path.includes("node_modules")
      )
      .map((e) => e.path);

    if (skillPaths.length === 0) {
      log.info("No package.json skill files found either");
      return [];
    }

    log.info(`Found ${skillPaths.length} package.json files, sampling up to 50...`);
    const sampled = skillPaths.slice(0, 50);
    const results = [];

    for (const path of sampled) {
      try {
        const content = await withRetry(
          () => githubFetchRaw(owner, repo, path, ref),
          { label: path, maxRetries: 1 }
        );
        const pkg = JSON.parse(content);
        if (pkg.name && pkg.description) {
          results.push({
            name: pkg.name,
            description: String(pkg.description).slice(0, 500),
            githubUrl: pkg.repository?.url
              ? normalizeUrl(
                  pkg.repository.url.replace(/^git\+/, "").replace(/\.git$/, "")
                )
              : `https://github.com/${owner}/${repo}`,
            installCount: 0,
            source: "skills-sh",
            tags: Array.isArray(pkg.keywords) ? pkg.keywords : [],
          });
        }
      } catch {
        // Skip unparseable files
      }
      // Rate limit
      await new Promise((r) => setTimeout(r, 50));
    }

    return results;
  }

  // Parse found registry files
  log.info(`Found registry files: ${registryPaths.join(", ")}`);
  const allResults = [];

  for (const path of registryPaths.slice(0, 5)) {
    try {
      const content = await withRetry(
        () => githubFetchRaw(owner, repo, path, ref),
        { label: path, maxRetries: 2 }
      );
      const data = JSON.parse(content);
      const items = parseRegistryData(Array.isArray(data) ? data : data.skills || data.packages || data.items || []);
      log.info(`  Parsed ${items.length} items from ${path}`);
      allResults.push(...items);
    } catch (err) {
      log.warn(`  Failed to parse ${path}: ${err.message}`);
    }
  }

  return allResults;
}

// ─── npm-based discovery ────────────────────────────────────────────

/**
 * Search npm registry for skills-related packages.
 * Uses the npm search API as a supplementary source.
 */
async function fetchFromNpmSearch() {
  const queries = [
    "keywords:claude-skill",
    "keywords:agent-skill",
    "keywords:claude-code-skill",
  ];

  const results = [];

  for (const q of queries) {
    try {
      const url = `https://registry.npmjs.org/-/v1/search?text=${encodeURIComponent(q)}&size=50`;
      const res = await fetch(url, {
        headers: { "User-Agent": "SkillNav-Sync/1.0" },
      });

      if (!res.ok) {
        log.warn(`npm search failed for "${q}": ${res.status}`);
        continue;
      }

      const data = await res.json();
      const objects = data.objects || [];

      for (const obj of objects) {
        const pkg = obj.package;
        if (!pkg?.name) continue;

        const repoUrl = pkg.links?.repository || "";
        results.push({
          name: pkg.name,
          description: String(pkg.description || "").slice(0, 500),
          githubUrl: repoUrl ? normalizeUrl(repoUrl) : "",
          installCount: 0, // npm doesn't expose download count in search
          source: "skills-sh",
          tags: Array.isArray(pkg.keywords) ? pkg.keywords : [],
        });
      }

      log.info(`  npm search "${q}": ${objects.length} results`);
    } catch (err) {
      log.warn(`npm search error for "${q}": ${err.message}`);
    }
  }

  return results;
}

// ─── Public API ─────────────────────────────────────────────────────

/**
 * Fetch skills from the skills.sh ecosystem.
 * Combines GitHub repo discovery + npm search as a supplementary source.
 *
 * @returns {Promise<Array<{ name, description, githubUrl, installCount, source, tags }>>}
 */
export async function fetchSkillsShSkills() {
  log.info("Fetching skills.sh ecosystem data...");

  // Run both discovery strategies
  const [githubResults, npmResults] = await Promise.allSettled([
    fetchFromGitHubRepo(),
    fetchFromNpmSearch(),
  ]);

  const allSkills = [];

  if (githubResults.status === "fulfilled") {
    allSkills.push(...githubResults.value);
    log.info(`GitHub repo: ${githubResults.value.length} skills`);
  } else {
    log.warn(`GitHub repo fetch failed: ${githubResults.reason?.message}`);
  }

  if (npmResults.status === "fulfilled") {
    allSkills.push(...npmResults.value);
    log.info(`npm search: ${npmResults.value.length} skills`);
  } else {
    log.warn(`npm search failed: ${npmResults.reason?.message}`);
  }

  // Deduplicate by name (since githubUrl may be empty for some)
  const seen = new Map();
  const deduped = [];
  for (const skill of allSkills) {
    const key = skill.githubUrl || skill.name.toLowerCase();
    if (!seen.has(key)) {
      seen.set(key, true);
      deduped.push(skill);
    }
  }

  log.info(`skills.sh total: ${allSkills.length} raw -> ${deduped.length} deduplicated`);
  return deduped;
}
