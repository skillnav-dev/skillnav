/**
 * Curated skill repo adapters.
 * Each adapter knows how to find and parse SKILL.md files from a specific repo.
 *
 * Adapter contract (duck typing):
 *   owner:    string          - GitHub org/user
 *   repo:     string          - GitHub repo name
 *   ref:      string          - Branch name (default "main")
 *   platform: string[]        - Platforms supported
 *   findSkillPaths(treeEntries) → string[]
 *   makeSlug(path) → string
 *   shouldInclude(path) → boolean  (optional filter, default true)
 */

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// ─── anthropics/skills ───────────────────────────────────────────────
// Structure: skills/<category>/<name>/SKILL.md
const anthropicsAdapter = {
  owner: "anthropics",
  repo: "skills",
  ref: "main",
  platform: ["claude"],

  findSkillPaths(entries) {
    return entries
      .filter(
        (e) =>
          e.type === "blob" &&
          e.path.startsWith("skills/") &&
          e.path.endsWith("/SKILL.md")
      )
      .map((e) => e.path);
  },

  makeSlug(path) {
    // skills/<category>/<name>/SKILL.md → anthropic--<name>
    const parts = path.split("/");
    const name = parts[parts.length - 2];
    return `anthropic--${slugify(name)}`;
  },
};

// ─── openai/codex ────────────────────────────────────────────────────
// Structure: .codex/skills/<name>/SKILL.md
const openaiCodexAdapter = {
  owner: "openai",
  repo: "codex",
  ref: "main",
  platform: ["codex"],

  findSkillPaths(entries) {
    return entries
      .filter(
        (e) =>
          e.type === "blob" &&
          e.path.startsWith(".codex/skills/") &&
          e.path.endsWith("/SKILL.md")
      )
      .map((e) => e.path);
  },

  makeSlug(path) {
    // .codex/skills/<name>/SKILL.md → codex--<name>
    const parts = path.split("/");
    const name = parts[parts.length - 2];
    return `codex--${slugify(name)}`;
  },
};

// ─── daymade/claude-code-skills ──────────────────────────────────────
// Structure: <name>/SKILL.md (flat, exclude .github, docs, demos, etc.)
const DAYMADE_EXCLUDE = new Set([
  ".github",
  "docs",
  "demos",
  "scripts",
  "images",
  "assets",
  "node_modules",
]);

const daymadeAdapter = {
  owner: "daymade",
  repo: "claude-code-skills",
  ref: "main",
  platform: ["claude"],

  findSkillPaths(entries) {
    return entries
      .filter((e) => {
        if (e.type !== "blob" || !e.path.endsWith("/SKILL.md")) return false;
        const topDir = e.path.split("/")[0];
        // Only include top-level dirs (depth = 2: dir/SKILL.md)
        return e.path.split("/").length === 2 && !DAYMADE_EXCLUDE.has(topDir);
      })
      .map((e) => e.path);
  },

  makeSlug(path) {
    // <name>/SKILL.md → daymade--<name>
    const name = path.split("/")[0];
    return `daymade--${slugify(name)}`;
  },
};

// ─── levnikolaevich/claude-code-skills ───────────────────────────────
// Structure: ln-XXX-<name>/SKILL.md
// Only pick ~25 best skills from the 109 total
const LEVN_PICKS = new Set([
  "ln-001-advanced-debugger",
  "ln-002-api-designer",
  "ln-003-architect",
  "ln-005-code-reviewer",
  "ln-007-database-expert",
  "ln-010-devops-engineer",
  "ln-011-documentation-writer",
  "ln-015-git-expert",
  "ln-019-migration-specialist",
  "ln-021-performance-optimizer",
  "ln-023-refactoring-guru",
  "ln-025-security-auditor",
  "ln-027-test-engineer",
  "ln-029-ui-developer",
  "ln-033-typescript-expert",
  "ln-035-react-specialist",
  "ln-037-nextjs-developer",
  "ln-041-python-expert",
  "ln-045-rust-developer",
  "ln-051-data-engineer",
  "ln-055-ml-engineer",
  "ln-061-fullstack-developer",
  "ln-071-monorepo-manager",
  "ln-081-accessibility-expert",
  "ln-091-technical-writer",
]);

const levnikolaevichAdapter = {
  owner: "levnikolaevich",
  repo: "claude-code-skills",
  ref: "main",
  platform: ["claude"],

  findSkillPaths(entries) {
    return entries
      .filter(
        (e) =>
          e.type === "blob" &&
          e.path.startsWith("ln-") &&
          e.path.endsWith("/SKILL.md")
      )
      .map((e) => e.path);
  },

  makeSlug(path) {
    // ln-XXX-<name>/SKILL.md → levn--<name-without-number>
    const dirName = path.split("/")[0];
    // Remove the ln-XXX- prefix to get a clean name
    const cleanName = dirName.replace(/^ln-\d+-/, "");
    return `levn--${slugify(cleanName)}`;
  },

  shouldInclude(path) {
    const dirName = path.split("/")[0];
    return LEVN_PICKS.has(dirName);
  },
};

// ─── Export all adapters ─────────────────────────────────────────────
export const CURATED_ADAPTERS = [
  anthropicsAdapter,
  openaiCodexAdapter,
  daymadeAdapter,
  levnikolaevichAdapter,
];

/**
 * Find an adapter by owner/repo string (e.g. "anthropics/skills").
 */
export function findAdapter(ownerRepo) {
  const [owner, repo] = ownerRepo.split("/");
  return CURATED_ADAPTERS.find((a) => a.owner === owner && a.repo === repo);
}
