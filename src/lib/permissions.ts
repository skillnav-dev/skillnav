/**
 * Permission boundary of a Skill / MCP server (table tool_permissions).
 * LLM writes a draft; only editor-reviewed content is shown publicly.
 */

export type PermissionItemType = "skill" | "mcp";
export type FileAccess = "none" | "read" | "write";

export interface Permissions {
  files: FileAccess;
  files_note: string;
  exec: boolean;
  exec_note: string;
  network: boolean;
  network_note: string;
  /** Env vars / API keys the user must provide. */
  secrets: string[];
  /** One or two sentences of risk advice, in Chinese. */
  risk_zh: string;
}

export const FILE_ACCESS_LABELS: Record<FileAccess, string> = {
  none: "不读写",
  read: "只读",
  write: "可读写",
};

/** Coerce untrusted JSON (LLM output or form data) into Permissions. */
export function normalizePermissions(value: unknown): Permissions | null {
  if (!value || typeof value !== "object") return null;
  const v = value as Record<string, unknown>;
  const str = (x: unknown) => (typeof x === "string" ? x.trim() : "");
  const files = ["none", "read", "write"].includes(v.files as string)
    ? (v.files as FileAccess)
    : "read";
  const secrets = Array.isArray(v.secrets)
    ? v.secrets.map(str).filter(Boolean).slice(0, 12)
    : [];
  return {
    files,
    files_note: str(v.files_note),
    exec: v.exec === true,
    exec_note: str(v.exec_note),
    network: v.network === true,
    network_note: str(v.network_note),
    secrets,
    risk_zh: str(v.risk_zh),
  };
}
