import type { ResolvedTool } from "@/lib/data/collections";

/**
 * Readable name for a listing. Registry rows without a Chinese name often
 * carry ids like "io.github.owner/server-name"; show the last segment instead.
 */
export function toolDisplayName(tool: ResolvedTool): string {
  const { nameZh, name } = tool.item;
  if (nameZh) return nameZh;
  return name.includes("/") ? name.split("/").pop() || name : name;
}

export function toolHref(tool: {
  type: "skill" | "mcp";
  slug: string;
}): string {
  return `/${tool.type === "skill" ? "skills" : "mcp"}/${tool.slug}`;
}
