/**
 * Combined install snippets for a starter pack (#27): every Skill and MCP
 * server in one copy, for Claude Code (shell commands) and Cursor
 * (one merged mcp.json + skills commands).
 */
import type { ResolvedTool } from "@/lib/data/collections";
import { ENV_PLACEHOLDER, deriveServerSpec } from "@/lib/install-spec";
import { buildClientInstalls } from "@/lib/install-snippets";
import { buildSkillInstallTabs } from "@/lib/skill-install";

export interface PackInstall {
  claudeCode: string;
  cursorSkills: string;
  cursorMcpJson: string;
  /** Names of items we have no install data for. */
  manual: string[];
  needsEnv: boolean;
}

function skillCommand(tool: ResolvedTool, agent: string): string | undefined {
  if (tool.type !== "skill") return undefined;
  const tabs = buildSkillInstallTabs(
    tool.item.githubUrl,
    tool.item.installCommand,
  );
  return (tabs.find((t) => t.id === agent) ?? tabs[0])?.command;
}

export function buildPackInstall(tools: ResolvedTool[]): PackInstall {
  const claude: string[] = [];
  const cursorSkills: string[] = [];
  const cursorServers: Record<string, unknown> = {};
  const manual: string[] = [];

  for (const tool of tools) {
    const label = `# ${tool.item.nameZh ?? tool.item.name}`;
    if (tool.type === "skill") {
      const cc = skillCommand(tool, "claude-code");
      const cu = skillCommand(tool, "cursor");
      if (!cc) {
        manual.push(tool.item.name);
        continue;
      }
      claude.push(label, cc);
      if (cu) cursorSkills.push(label, cu);
      continue;
    }

    const spec = deriveServerSpec(tool.item);
    if (!spec) {
      manual.push(tool.item.name);
      continue;
    }
    const clients = buildClientInstalls(spec);
    const cc = clients.find((c) => c.id === "claude-code")?.snippets[0]?.code;
    const cu = clients.find((c) => c.id === "cursor")?.snippets[0]?.code;
    if (cc) claude.push(label, cc);
    if (cu) Object.assign(cursorServers, JSON.parse(cu).mcpServers);
  }

  const claudeCode = claude.join("\n");
  const cursorMcpJson = Object.keys(cursorServers).length
    ? JSON.stringify({ mcpServers: cursorServers }, null, 2)
    : "";
  return {
    claudeCode,
    cursorSkills: cursorSkills.join("\n"),
    cursorMcpJson,
    manual,
    needsEnv: claudeCode.includes(ENV_PLACEHOLDER),
  };
}
