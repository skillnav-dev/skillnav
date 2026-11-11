import type { McpServer, Skill } from "@/data/types";
import { createStaticClient } from "@/lib/supabase/static";
import { mapMcpServerRow, mapSkillRow } from "@/lib/supabase/mappers";

/** A reference to a curated listing in a static collection (packs, roles). */
export interface ToolRef {
  type: "skill" | "mcp";
  slug: string;
}

export type ResolvedTool =
  | { type: "skill"; slug: string; item: Skill }
  | { type: "mcp"; slug: string; item: McpServer };

/**
 * Resolve refs to published listings, keeping the given order. Refs whose
 * listing is unpublished or missing are dropped, so collections never link
 * to a 404. Uses the cookie-less client so ISR pages can call it.
 */
export async function resolvePublishedTools(
  refs: ToolRef[],
): Promise<ResolvedTool[]> {
  if (refs.length === 0 || !process.env.NEXT_PUBLIC_SUPABASE_URL) return [];
  const supabase = createStaticClient();
  const skillSlugs = refs.filter((r) => r.type === "skill").map((r) => r.slug);
  const mcpSlugs = refs.filter((r) => r.type === "mcp").map((r) => r.slug);

  const [skills, mcp] = await Promise.all([
    skillSlugs.length
      ? supabase
          .from("skills")
          .select("*")
          .in("slug", skillSlugs)
          .eq("status", "published")
      : Promise.resolve({ data: [] }),
    mcpSlugs.length
      ? supabase
          .from("mcp_servers")
          .select("*")
          .in("slug", mcpSlugs)
          .eq("status", "published")
      : Promise.resolve({ data: [] }),
  ]);

  type SkillRow = Parameters<typeof mapSkillRow>[0];
  type McpRow = Parameters<typeof mapMcpServerRow>[0];
  const skillMap = new Map(
    ((skills.data ?? []) as SkillRow[]).map((row) => [
      row.slug,
      mapSkillRow(row),
    ]),
  );
  const mcpMap = new Map(
    ((mcp.data ?? []) as McpRow[]).map((row) => [
      row.slug,
      mapMcpServerRow(row),
    ]),
  );

  return refs.flatMap((ref): ResolvedTool[] => {
    if (ref.type === "skill") {
      const item = skillMap.get(ref.slug);
      return item ? [{ type: "skill", slug: ref.slug, item }] : [];
    }
    const item = mcpMap.get(ref.slug);
    return item ? [{ type: "mcp", slug: ref.slug, item }] : [];
  });
}
