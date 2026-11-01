/**
 * Generate per-client MCP install snippets from a normalized ServerSpec.
 * Formats follow each client's official docs (checked 2026-11-01):
 * - Claude Code: `claude mcp add` (code.claude.com/docs/en/mcp)
 * - Cursor: mcp.json + install deeplink (cursor.com/docs/context/mcp/install-links)
 * - VS Code: `servers` mcp.json + `code --add-mcp`
 * - Codex: `[mcp_servers.<name>]` in ~/.codex/config.toml
 * - Trae CN: mcpServers JSON + `trae-cn://` import link
 * - 通义灵码 / CodeBuddy: mcpServers JSON pasted in the MCP settings panel
 */
import type { ServerSpec } from "@/lib/install-spec";

export type Runner = "npx" | "bunx" | "pnpm";

export interface Snippet {
  label: string;
  lang: "bash" | "json" | "toml";
  code: string;
}

export interface ClientInstall {
  id: string;
  label: string;
  hint: string;
  snippets: Snippet[];
  deeplink?: { label: string; href: string };
}

/** True when the spec launches through npx and can be switched to bunx/pnpm. */
export function supportsRunnerSwitch(spec: ServerSpec): boolean {
  return spec.kind === "stdio" && spec.command === "npx";
}

/** Rewrite an npx launch for the selected runner. */
export function applyRunner(spec: ServerSpec, runner: Runner): ServerSpec {
  if (!supportsRunnerSwitch(spec) || runner === "npx") return spec;
  if (spec.kind !== "stdio") return spec;
  const pkgArgs = spec.args.filter((a) => a !== "-y" && a !== "--yes");
  return runner === "bunx"
    ? { ...spec, command: "bunx", args: pkgArgs }
    : { ...spec, command: "pnpm", args: ["dlx", ...pkgArgs] };
}

function shellQuote(value: string): string {
  return /^[\w@%+=:,./-]+$/.test(value)
    ? value
    : `'${value.replace(/'/g, `'\\''`)}'`;
}

function tomlString(value: string): string {
  return JSON.stringify(value);
}

/** UTF-8 safe base64 that works in both browser and Node. */
function base64(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary);
}

/** The inner server entry shared by most `mcpServers` style configs. */
function entry(spec: ServerSpec, withType = false): Record<string, unknown> {
  if (spec.kind === "http") {
    return {
      ...(withType ? { type: "http" } : {}),
      url: spec.url,
      ...(Object.keys(spec.headers).length ? { headers: spec.headers } : {}),
    };
  }
  return {
    ...(withType ? { type: "stdio" } : {}),
    command: spec.command,
    args: spec.args,
    ...(Object.keys(spec.env).length ? { env: spec.env } : {}),
  };
}

function json(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

function claudeCode(spec: ServerSpec): ClientInstall {
  let cmd: string;
  if (spec.kind === "http") {
    const headers = Object.entries(spec.headers)
      .map(([k, v]) => ` --header ${shellQuote(`${k}: ${v}`)}`)
      .join("");
    cmd = `claude mcp add --transport http ${spec.name} ${spec.url}${headers}`;
  } else {
    const env = Object.entries(spec.env)
      .map(([k, v]) => `--env ${shellQuote(`${k}=${v}`)} `)
      .join("");
    const run = [spec.command, ...spec.args].map(shellQuote).join(" ");
    cmd = `claude mcp add ${env}--transport stdio ${spec.name} -- ${run}`;
  }
  return {
    id: "claude-code",
    label: "Claude Code",
    hint: "在终端运行。加 --scope project 可写入项目根目录的 .mcp.json，与团队共享。",
    snippets: [{ label: "终端命令", lang: "bash", code: cmd }],
  };
}

function cursor(spec: ServerSpec): ClientInstall {
  const inner = entry(spec);
  const href = `cursor://anysphere.cursor-deeplink/mcp/install?name=${encodeURIComponent(spec.name)}&config=${encodeURIComponent(base64(JSON.stringify(inner)))}`;
  return {
    id: "cursor",
    label: "Cursor",
    hint: "写入 ~/.cursor/mcp.json（全局）或项目内 .cursor/mcp.json；也可以点按钮直接在 Cursor 中安装。",
    snippets: [
      {
        label: "mcp.json",
        lang: "json",
        code: json({ mcpServers: { [spec.name]: inner } }),
      },
    ],
    deeplink: { label: "在 Cursor 中一键安装", href },
  };
}

function vscode(spec: ServerSpec): ClientInstall {
  const inner = entry(spec, true);
  return {
    id: "vscode",
    label: "VS Code",
    hint: "写入项目内 .vscode/mcp.json（注意顶层键是 servers），或在终端用 code --add-mcp 加到用户配置。",
    snippets: [
      {
        label: ".vscode/mcp.json",
        lang: "json",
        code: json({ servers: { [spec.name]: inner } }),
      },
      {
        label: "终端命令",
        lang: "bash",
        code: `code --add-mcp ${shellQuote(JSON.stringify({ name: spec.name, ...inner }))}`,
      },
    ],
  };
}

function codex(spec: ServerSpec): ClientInstall {
  const lines = [`[mcp_servers.${spec.name}]`];
  if (spec.kind === "http") {
    lines.push(`url = ${tomlString(spec.url)}`);
  } else {
    lines.push(`command = ${tomlString(spec.command)}`);
    lines.push(`args = [${spec.args.map(tomlString).join(", ")}]`);
    const env = Object.entries(spec.env);
    if (env.length) {
      lines.push("", `[mcp_servers.${spec.name}.env]`);
      env.forEach(([k, v]) => lines.push(`${k} = ${tomlString(v)}`));
    }
  }
  return {
    id: "codex",
    label: "Codex",
    hint: "追加到 ~/.codex/config.toml；仅对受信任项目可写在项目内 .codex/config.toml。",
    snippets: [{ label: "config.toml", lang: "toml", code: lines.join("\n") }],
  };
}

function trae(spec: ServerSpec): ClientInstall {
  const inner = entry(spec);
  const type = spec.kind === "http" ? "http" : "stdio";
  const href = `trae-cn://trae.ai-ide/mcp-import?type=${type}&name=${encodeURIComponent(spec.name)}&config=${encodeURIComponent(base64(JSON.stringify(inner)))}`;
  return {
    id: "trae",
    label: "Trae",
    hint: "在 Trae 的 MCP 设置中选择手动添加，粘贴下面的 JSON；国内版也可以点按钮直接导入。",
    snippets: [
      {
        label: "JSON",
        lang: "json",
        code: json({ mcpServers: { [spec.name]: inner } }),
      },
    ],
    deeplink: { label: "在 Trae 国内版中导入", href },
  };
}

function lingma(spec: ServerSpec): ClientInstall | null {
  if (spec.kind !== "stdio") return null;
  return {
    id: "lingma",
    label: "通义灵码",
    hint: "个人设置 → MCP 服务 → 右上角“+” → 通过配置文件添加。需在智能体模式下使用，插件版本 v2.5.0 及以上。",
    snippets: [
      {
        label: "JSON",
        lang: "json",
        code: json({ mcpServers: { [spec.name]: entry(spec) } }),
      },
    ],
  };
}

function codebuddy(spec: ServerSpec): ClientInstall | null {
  if (spec.kind !== "stdio") return null;
  return {
    id: "codebuddy",
    label: "CodeBuddy",
    hint: "CodeBuddy 设置 → MCP → Add MCP，粘贴 JSON。安装后状态变绿即可用。",
    snippets: [
      {
        label: "JSON",
        lang: "json",
        code: json({ mcpServers: { [spec.name]: entry(spec, true) } }),
      },
    ],
  };
}

/** Build install instructions for every supported client. */
export function buildClientInstalls(spec: ServerSpec): ClientInstall[] {
  return [
    claudeCode(spec),
    cursor(spec),
    vscode(spec),
    codex(spec),
    trae(spec),
    lingma(spec),
    codebuddy(spec),
  ].filter((c): c is ClientInstall => c !== null);
}
