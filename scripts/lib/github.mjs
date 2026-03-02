/**
 * GitHub API helper with rate limit handling and pagination.
 */

const GITHUB_API = "https://api.github.com";

function getHeaders() {
  const headers = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "SkillNav-Sync/1.0",
  };
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  return headers;
}

/**
 * Fetch from GitHub API with automatic rate limit retry.
 */
export async function githubFetch(path, options = {}) {
  const url = path.startsWith("http") ? path : `${GITHUB_API}${path}`;
  const response = await fetch(url, {
    ...options,
    headers: { ...getHeaders(), ...options.headers },
  });

  if (response.status === 403) {
    const resetTime = response.headers.get("x-ratelimit-reset");
    if (resetTime) {
      const waitMs = Number(resetTime) * 1000 - Date.now() + 1000;
      console.log(`Rate limited. Waiting ${Math.ceil(waitMs / 1000)}s...`);
      await new Promise((r) => setTimeout(r, Math.max(waitMs, 1000)));
      return githubFetch(path, options);
    }
  }

  if (!response.ok) {
    throw new Error(`GitHub API ${response.status}: ${await response.text()}`);
  }

  return response.json();
}

/**
 * Fetch raw file content from GitHub.
 */
export async function githubFetchRaw(owner, repo, path, ref = "main") {
  const url = `https://raw.githubusercontent.com/${owner}/${repo}/${ref}/${path}`;
  const response = await fetch(url, {
    headers: { "User-Agent": "SkillNav-Sync/1.0" },
  });

  if (!response.ok) {
    throw new Error(`GitHub raw ${response.status}: ${url}`);
  }

  return response.text();
}

/**
 * Fetch all items from a paginated GitHub endpoint.
 */
export async function githubFetchAll(path, maxPages = 50) {
  const allItems = [];
  let page = 1;

  while (page <= maxPages) {
    const separator = path.includes("?") ? "&" : "?";
    const data = await githubFetch(
      `${path}${separator}per_page=100&page=${page}`
    );

    if (!Array.isArray(data) || data.length === 0) break;
    allItems.push(...data);
    page++;

    // Small delay between pages
    await new Promise((r) => setTimeout(r, 200));
  }

  return allItems;
}
