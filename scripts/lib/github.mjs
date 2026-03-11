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

const GITHUB_GRAPHQL = "https://api.github.com/graphql";

/**
 * Batch query GitHub repos via GraphQL.
 * Uses alias pattern to query up to 50 repos per request.
 * @param {{ owner: string; repo: string }[]} repos
 * @returns {Promise<Map<string, { stargazerCount: number; forkCount: number; pushedAt: string; isArchived: boolean; updatedAt: string; description: string | null }>>}
 */
export async function githubGraphQLBatch(repos) {
  const BATCH_SIZE = 50;
  const results = new Map();

  for (let i = 0; i < repos.length; i += BATCH_SIZE) {
    const batch = repos.slice(i, i + BATCH_SIZE);
    const aliases = batch
      .map(
        (r, idx) =>
          `r${idx}: repository(owner: "${r.owner}", name: "${r.repo}") {
      stargazerCount
      forkCount
      pushedAt
      isArchived
      updatedAt
      description
    }`
      )
      .join("\n");

    const query = `query { ${aliases} }`;

    const response = await fetch(GITHUB_GRAPHQL, {
      method: "POST",
      headers: {
        ...getHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      throw new Error(
        `GitHub GraphQL ${response.status}: ${await response.text()}`
      );
    }

    const json = await response.json();

    if (json.errors) {
      // Partial errors are common (deleted repos, renamed repos).
      for (const err of json.errors) {
        console.warn(`  GraphQL warning: ${err.message}`);
      }
    }

    const data = json.data ?? {};
    for (let idx = 0; idx < batch.length; idx++) {
      const key = `${batch[idx].owner}/${batch[idx].repo}`;
      const node = data[`r${idx}`];
      if (node) {
        results.set(key, {
          stargazerCount: node.stargazerCount,
          forkCount: node.forkCount,
          pushedAt: node.pushedAt,
          isArchived: node.isArchived,
          updatedAt: node.updatedAt,
          description: node.description,
        });
      }
    }

    // Small delay between batches
    if (i + BATCH_SIZE < repos.length) {
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  return results;
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
