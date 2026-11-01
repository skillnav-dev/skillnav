/**
 * Build install commands for an Agent Skill.
 *
 * Uses the cross-agent `skills` CLI (github.com/vercel-labs/skills):
 *   npx skills add <owner/repo> [--skill <name>] -a <agent>
 * Agent ids per its docs/agents.md (checked 2026-11-01).
 *
 * Note: Claude Code has no `claude skill add` subcommand; skills are folders in
 * ~/.claude/skills/ or ship inside plugins. Legacy rows still store such
 * commands, so they are ignored here.
 */
import { isDeadSourceUrl } from "@/lib/skill-source";

export interface SkillInstallTab {
  id: string;
  label: string;
  command: string;
}

export interface SkillSourceRef {
  repo: string; // owner/repo
  folder?: string; // skill folder inside the repo, if any
  path?: string; // path inside the repo, if any
}

const AGENTS: { id: string; label: string }[] = [
  { id: "claude-code", label: "Claude Code" },
  { id: "codex", label: "Codex" },
  { id: "cursor", label: "Cursor" },
  { id: "gemini-cli", label: "Gemini CLI" },
  { id: "trae", label: "Trae" },
];

const LEGACY_COMMAND = /^claude\s+skill\s+(add|install)\b/;

/** Parse https://github.com/owner/repo[/tree/<ref>/<path>] into a source ref. */
export function parseSkillSource(url?: string): SkillSourceRef | null {
  if (!url || isDeadSourceUrl(url)) return null;
  try {
    const { hostname, pathname } = new URL(url);
    if (hostname !== "github.com") return null;
    const parts = pathname
      .replace(/^\/|\/$/g, "")
      .replace(/\.git$/, "")
      .split("/");
    if (parts.length < 2 || !parts[0] || !parts[1]) return null;
    const repo = `${parts[0]}/${parts[1]}`;
    // parts[2] = "tree" | "blob", parts[3] = ref, rest = path
    if ((parts[2] === "tree" || parts[2] === "blob") && parts.length > 4) {
      const pathParts = parts.slice(4).filter((p) => p !== "SKILL.md");
      if (pathParts.length > 0) {
        return {
          repo,
          folder: pathParts[pathParts.length - 1],
          path: pathParts.join("/"),
        };
      }
    }
    return { repo };
  } catch {
    return null;
  }
}

/** Per-agent install commands; empty when no usable source exists. */
export function buildSkillInstallTabs(
  githubUrl?: string,
  installCommand?: string,
): SkillInstallTab[] {
  const source = parseSkillSource(githubUrl);
  if (source) {
    const skillFlag = source.folder ? ` --skill ${source.folder}` : "";
    return AGENTS.map((agent) => ({
      id: agent.id,
      label: agent.label,
      command: `npx skills add ${source.repo}${skillFlag} -a ${agent.id}`,
    }));
  }
  if (installCommand && !LEGACY_COMMAND.test(installCommand.trim())) {
    return [{ id: "default", label: "安装命令", command: installCommand }];
  }
  return [];
}
