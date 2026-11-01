/**
 * Normalize the install data we hold for an MCP server (install_config,
 * install_command, npm_package) into one client-agnostic server spec.
 * Client-specific snippets are generated from this spec in install-snippets.ts.
 */

export type ServerSpec =
  | {
      kind: "stdio";
      name: string;
      command: string;
      args: string[];
      env: Record<string, string>;
    }
  | {
      kind: "http";
      name: string;
      url: string;
      headers: Record<string, string>;
    };

export interface InstallSource {
  slug: string;
  installCommand?: string;
  installConfig?: Record<string, unknown>;
  npmPackage?: string;
}

/** Placeholder shown when an env var has no usable value. */
export const ENV_PLACEHOLDER = "<请填写>";

/** Commands that start an MCP server process directly. */
const RUNNERS = new Set([
  "npx",
  "bunx",
  "pnpm",
  "uvx",
  "uv",
  "docker",
  "node",
  "python",
  "python3",
  "deno",
]);

/** Make a config-safe server key from a slug. */
export function serverKey(slug: string): string {
  const key = slug
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return key || "mcp-server";
}

/** Split a shell-like command string, honoring single and double quotes. */
export function tokenize(input: string): string[] {
  const tokens: string[] = [];
  const re = /"([^"]*)"|'([^']*)'|(\S+)/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(input)) !== null) {
    tokens.push(match[1] ?? match[2] ?? match[3]);
  }
  return tokens;
}

function stringRecord(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(value)) {
    const s = v === null || v === undefined ? "" : String(v);
    out[k] = s.trim() ? s : ENV_PLACEHOLDER;
  }
  return out;
}

function parseEnvPair(pair: string, env: Record<string, string>) {
  const idx = pair.indexOf("=");
  if (idx <= 0) return;
  const value = pair.slice(idx + 1);
  env[pair.slice(0, idx)] = value.trim() ? value : ENV_PLACEHOLDER;
}

/** Read an install_config JSON blob (mcpServers / servers wrapper or bare entry). */
function fromConfig(
  config: Record<string, unknown>,
  name: string,
): ServerSpec | null {
  let entry: unknown = config;
  for (const wrapper of ["mcpServers", "servers"]) {
    const inner = config[wrapper];
    if (inner && typeof inner === "object" && !Array.isArray(inner)) {
      entry = Object.values(inner)[0];
      break;
    }
  }
  if (!entry || typeof entry !== "object") return null;
  const e = entry as Record<string, unknown>;

  const url = e.url ?? e.serverUrl;
  if (typeof url === "string" && /^https?:\/\//.test(url)) {
    return { kind: "http", name, url, headers: stringRecord(e.headers) };
  }
  if (typeof e.command === "string" && e.command.trim()) {
    const args = Array.isArray(e.args) ? e.args.map(String) : [];
    return {
      kind: "stdio",
      name,
      command: e.command.trim(),
      args,
      env: stringRecord(e.env),
    };
  }
  return null;
}

/** Parse `claude mcp add ...` into a spec. */
function fromClaudeAdd(tokens: string[], name: string): ServerSpec | null {
  const env: Record<string, string> = {};
  const headers: Record<string, string> = {};
  const positional: string[] = [];
  let transport = "stdio";
  let i = 3; // skip "claude mcp add"
  for (; i < tokens.length; i++) {
    const t = tokens[i];
    if (t === "--") {
      i++;
      break;
    }
    if (t === "-e" || t === "--env") {
      parseEnvPair(tokens[++i] ?? "", env);
    } else if (t === "-t" || t === "--transport") {
      transport = tokens[++i] ?? "stdio";
    } else if (t === "-H" || t === "--header") {
      const h = tokens[++i] ?? "";
      const idx = h.indexOf(":");
      if (idx > 0) headers[h.slice(0, idx).trim()] = h.slice(idx + 1).trim();
    } else if (t === "-s" || t === "--scope") {
      i++;
    } else if (!t.startsWith("-")) {
      positional.push(t);
    }
  }
  if (transport === "http" || transport === "sse") {
    const url = positional.find((p) => /^https?:\/\//.test(p));
    return url ? { kind: "http", name, url, headers } : null;
  }
  const rest = tokens.slice(i);
  if (rest.length === 0) return null;
  return { kind: "stdio", name, command: rest[0], args: rest.slice(1), env };
}

/** Parse a plain command line (e.g. `npx -y @scope/pkg`) into a spec. */
function fromCommand(command: string, name: string): ServerSpec | null {
  const tokens = tokenize(command.trim());
  if (tokens.length === 0) return null;

  if (tokens[0] === "claude" && tokens[1] === "mcp" && tokens[2] === "add") {
    return fromClaudeAdd(tokens, name);
  }

  // Leading KEY=value assignments become env vars.
  const env: Record<string, string> = {};
  while (tokens.length > 0 && /^[A-Z_][A-Z0-9_]*=/.test(tokens[0])) {
    parseEnvPair(tokens.shift()!, env);
  }

  // `npm install -g pkg` is an install step, not a server launch: run via npx.
  if (tokens[0] === "npm" && ["install", "i"].includes(tokens[1] ?? "")) {
    const pkg = tokens.slice(2).find((t) => !t.startsWith("-"));
    return pkg
      ? { kind: "stdio", name, command: "npx", args: ["-y", pkg], env }
      : null;
  }

  if (!RUNNERS.has(tokens[0])) return null;
  return {
    kind: "stdio",
    name,
    command: tokens[0],
    args: tokens.slice(1),
    env,
  };
}

/** Derive a server spec, preferring structured config over command strings. */
export function deriveServerSpec(source: InstallSource): ServerSpec | null {
  const name = serverKey(source.slug);
  if (source.installConfig) {
    const spec = fromConfig(source.installConfig, name);
    if (spec) return spec;
  }
  if (source.installCommand) {
    const spec = fromCommand(source.installCommand, name);
    if (spec) return spec;
  }
  if (source.npmPackage) {
    return {
      kind: "stdio",
      name,
      command: "npx",
      args: ["-y", source.npmPackage],
      env: {},
    };
  }
  return null;
}
