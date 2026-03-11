import { unstable_cache } from "next/cache";

/**
 * Parse owner/repo from a GitHub URL.
 * Handles: https://github.com/owner/repo, https://github.com/owner/repo/tree/...
 */
function parseGithubUrl(url: string): { owner: string; repo: string } | null {
  try {
    const u = new URL(url);
    if (u.hostname !== "github.com") return null;
    const parts = u.pathname.split("/").filter(Boolean);
    if (parts.length < 2) return null;
    return { owner: parts[0], repo: parts[1] };
  } catch {
    return null;
  }
}

/**
 * Fetch raw README content from GitHub REST API.
 * Returns null if not found or request fails.
 */
async function fetchReadmeRaw(githubUrl: string): Promise<string | null> {
  const parsed = parseGithubUrl(githubUrl);
  if (!parsed) return null;

  const { owner, repo } = parsed;
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/readme`;

  try {
    const res = await fetch(apiUrl, {
      headers: {
        Accept: "application/vnd.github.raw+json",
        "User-Agent": "SkillNav/1.0",
        // Use GitHub token if available to avoid rate limits
        ...(process.env.GITHUB_TOKEN
          ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }
          : {}),
      },
      next: { revalidate: 86400 }, // ISR: revalidate every 24 hours
    });

    if (!res.ok) return null;
    const text = await res.text();
    // Skip trivially small READMEs
    if (text.trim().length < 30) return null;
    return text;
  } catch {
    return null;
  }
}

/**
 * Cached README fetcher. Caches for 24 hours via unstable_cache.
 */
export const fetchReadme = unstable_cache(
  fetchReadmeRaw,
  ["github-readme"],
  { revalidate: 86400 }, // 24 hours
);
