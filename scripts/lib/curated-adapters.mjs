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
  "ln-001-standards-researcher",
  "ln-002-best-practices-researcher",
  "ln-200-scope-decomposer",
  "ln-301-task-creator",
  "ln-401-task-executor",
  "ln-402-task-reviewer",
  "ln-511-code-quality-checker",
  "ln-512-tech-debt-cleaner",
  "ln-520-test-planner",
  "ln-610-docs-auditor",
  "ln-620-codebase-auditor",
  "ln-621-security-auditor",
  "ln-623-code-principles-auditor",
  "ln-624-code-quality-auditor",
  "ln-625-dependencies-auditor",
  "ln-626-dead-code-auditor",
  "ln-634-test-coverage-auditor",
  "ln-641-pattern-analyzer",
  "ln-643-api-contract-auditor",
  "ln-700-project-bootstrap",
  "ln-710-dependency-upgrader",
  "ln-721-frontend-restructure",
  "ln-731-docker-generator",
  "ln-732-cicd-generator",
  "ln-741-linter-configurator",
]);

const levnikolaevichAdapter = {
  owner: "levnikolaevich",
  repo: "claude-code-skills",
  ref: "master",
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

// ─── alirezarezvani/claude-skills ────────────────────────────────────
// Structure: <category>/<name>/SKILL.md (depth=3, only engineering dirs)
const ALIREZA_INCLUDE_DIRS = new Set(["engineering", "engineering-team"]);

const alirezarezvaniAdapter = {
  owner: "alirezarezvani",
  repo: "claude-skills",
  ref: "main",
  platform: ["claude"],

  findSkillPaths(entries) {
    return entries
      .filter(
        (e) =>
          e.type === "blob" &&
          e.path.endsWith("/SKILL.md") &&
          e.path.split("/").length === 3
      )
      .map((e) => e.path);
  },

  makeSlug(path) {
    // <category>/<name>/SKILL.md → alireza--<name>
    const parts = path.split("/");
    const name = parts[parts.length - 2];
    return `alireza--${slugify(name)}`;
  },

  shouldInclude(path) {
    const topDir = path.split("/")[0];
    if (!ALIREZA_INCLUDE_DIRS.has(topDir)) return false;
    // Exclude sample skill
    if (path.includes("/assets/sample-skill/")) return false;
    return true;
  },
};

// ─── giuseppe-trisciuoglio/developer-kit ─────────────────────────────
// Structure: plugins/<group>/skills/<name>/SKILL.md
const DEVKIT_INCLUDE_GROUPS = new Set([
  "developer-kit-ai",
  "developer-kit-core",
  "developer-kit-typescript",
  "developer-kit-tools",
]);

const developerKitAdapter = {
  owner: "giuseppe-trisciuoglio",
  repo: "developer-kit",
  ref: "main",
  platform: ["claude"],

  findSkillPaths(entries) {
    return entries
      .filter(
        (e) =>
          e.type === "blob" &&
          e.path.startsWith("plugins/") &&
          e.path.endsWith("/SKILL.md") &&
          e.path.split("/").length === 5
      )
      .map((e) => e.path);
  },

  makeSlug(path) {
    // plugins/<group>/skills/<name>/SKILL.md → devkit--<name>
    const parts = path.split("/");
    const name = parts[parts.length - 2];
    return `devkit--${slugify(name)}`;
  },

  shouldInclude(path) {
    // plugins/<group>/skills/...
    const group = path.split("/")[1];
    return DEVKIT_INCLUDE_GROUPS.has(group);
  },
};

// ─── neondatabase/agent-skills ──────────────────────────────────────
// Structure: skills/<name>/SKILL.md
const neonAdapter = {
  owner: "neondatabase",
  repo: "agent-skills",
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
    // skills/<name>/SKILL.md → neon--<name>
    const parts = path.split("/");
    const name = parts[parts.length - 2];
    return `neon--${slugify(name)}`;
  },
};

// ─── Export all adapters ─────────────────────────────────────────────
export const CURATED_ADAPTERS = [
  anthropicsAdapter,
  openaiCodexAdapter,
  daymadeAdapter,
  levnikolaevichAdapter,
  alirezarezvaniAdapter,
  developerKitAdapter,
  neonAdapter,
];

/**
 * Find an adapter by owner/repo string (e.g. "anthropics/skills").
 */
export function findAdapter(ownerRepo) {
  const [owner, repo] = ownerRepo.split("/");
  return CURATED_ADAPTERS.find((a) => a.owner === owner && a.repo === repo);
}
