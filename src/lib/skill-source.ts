/**
 * Registry source URLs that no longer resolve.
 *
 * The `openclaw/skills` GitHub repo (which backed ~9.2k ClawHub listings synced
 * before 2026-03-25) was deleted, and the legacy `clawhub.com/skills/{author}/{name}`
 * paths now 404 as well. Current ClawHub listings live at `clawhub.ai/skills/{slug}`.
 *
 * Rendering these URLs hands users install commands and links that are guaranteed
 * to fail, so callers should suppress them until the affected rows are resynced.
 */
const DEAD_SOURCE_PATTERNS = [
  "github.com/openclaw/skills",
  "clawhub.com/skills/",
];

export function isDeadSourceUrl(url?: string | null): boolean {
  if (!url) return false;
  return DEAD_SOURCE_PATTERNS.some((pattern) => url.includes(pattern));
}

/** Return the URL only when it still resolves, otherwise undefined. */
export function liveSourceUrl(url?: string | null): string | undefined {
  return url && !isDeadSourceUrl(url) ? url : undefined;
}
