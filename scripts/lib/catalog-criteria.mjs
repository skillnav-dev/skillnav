/**
 * Shared inclusion criteria for the strict-quality catalog (ADR-009).
 * Used by the one-off candidate report and the weekly MCP candidate scan.
 */

export const MAX_AGE_DAYS = 180;

/** Orgs whose repos count as official / vendor-maintained (lowercase). */
export const OFFICIAL_ORGS = new Set([
  "anthropics", "modelcontextprotocol", "openai", "google", "google-gemini",
  "googleapis", "microsoft", "github", "vercel", "vercel-labs", "cloudflare",
  "supabase", "neondatabase", "stripe", "getsentry", "huggingface", "aws",
  "awslabs", "upstash", "notionhq", "linear", "figma", "atlassian", "mongodb",
  "redis", "elastic", "grafana", "hashicorp", "docker", "jetbrains", "brave",
  "exa-labs", "firecrawl", "browserbase", "context7", "zapier", "shopify",
]);

/** "https://github.com/Owner/Repo.git" → { owner, repo } or null. */
export function parseGithubUrl(url) {
  if (!url) return null;
  const m = url.match(/github\.com\/([^/]+)\/([^/#?]+)/i);
  if (!m) return null;
  return { owner: m[1], repo: m[2].replace(/\.git$/, "") };
}

/**
 * Judge one repo against the criteria: official org or >= minStars stars,
 * pushed within MAX_AGE_DAYS, not archived.
 * @param {string} owner
 * @param {{ stargazerCount: number, pushedAt: string, isArchived: boolean } | undefined} gh
 * @param {number} minStars
 * @returns {{ pass: boolean, reasons: string[] }}
 */
export function judgeRepo(owner, gh, minStars) {
  if (!gh) return { pass: false, reasons: ["repo not found"] };
  const reasons = [];
  const official = OFFICIAL_ORGS.has(owner.toLowerCase());
  const ageDays = gh.pushedAt ? (Date.now() - Date.parse(gh.pushedAt)) / 86400000 : Infinity;

  if (gh.isArchived) reasons.push("archived");
  if (ageDays > MAX_AGE_DAYS) reasons.push(`no push in ${Math.round(ageDays)}d`);
  if (!official && gh.stargazerCount < minStars) reasons.push(`stars ${gh.stargazerCount} < ${minStars}`);

  return { pass: reasons.length === 0, reasons: official ? ["official", ...reasons] : reasons };
}
