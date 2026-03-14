/**
 * Data access layer for admin pages.
 * Uses service role key when available for unrestricted access,
 * falls back to anon key (RLS still applies).
 */

import { createClient } from "@supabase/supabase-js";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { Database } from "@/lib/supabase/types";
import type { Article, Skill, McpServer } from "@/data/types";
import {
  mapArticleRow,
  mapSkillRow,
  mapMcpServerRow,
} from "@/lib/supabase/mappers";

type ArticleUpdate = Database["public"]["Tables"]["articles"]["Update"];
type SkillUpdate = Database["public"]["Tables"]["skills"]["Update"];

function getServiceRoleKey(): string | undefined {
  // In Cloudflare Workers, secrets are not enumerable via Object.entries()
  // so process.env won't have them. Access via getCloudflareContext() instead.
  try {
    const ctx = getCloudflareContext();
    const key = (ctx.env as Record<string, unknown>).SUPABASE_SERVICE_ROLE_KEY;
    if (typeof key === "string" && key) return key;
  } catch {
    // Not in Cloudflare runtime (local dev), fall through
  }
  return process.env.SUPABASE_SERVICE_ROLE_KEY;
}

function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    getServiceRoleKey() || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

export interface ArticleStats {
  total: number;
  published: number;
  draft: number;
  hidden: number;
}

/**
 * Get article counts grouped by status.
 */
export async function getArticleStats(): Promise<ArticleStats> {
  const supabase = createAdminClient();

  const [publishedRes, draftRes, hiddenRes] = await Promise.all([
    supabase
      .from("articles")
      .select("*", { count: "exact", head: true })
      .eq("status", "published"),
    supabase
      .from("articles")
      .select("*", { count: "exact", head: true })
      .eq("status", "draft"),
    supabase
      .from("articles")
      .select("*", { count: "exact", head: true })
      .eq("status", "hidden"),
  ]);

  const published = publishedRes.count ?? 0;
  const draft = draftRes.count ?? 0;
  const hidden = hiddenRes.count ?? 0;

  return {
    total: published + draft + hidden,
    published,
    draft,
    hidden,
  };
}

export const ADMIN_PAGE_SIZE = 20;

/**
 * Get articles for admin listing (no status filter by default).
 */
export async function getAdminArticles(params: {
  status?: string;
  source?: string;
  contentTier?: string;
  articleType?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}): Promise<{ articles: Article[]; total: number }> {
  const supabase = createAdminClient();
  const pageSize = params.pageSize ?? ADMIN_PAGE_SIZE;
  const page = params.page ?? 1;
  const offset = (Math.max(1, page) - 1) * pageSize;

  let query = supabase
    .from("articles")
    .select("*", { count: "exact" })
    .order("published_at", { ascending: false });

  if (params.status) {
    query = query.eq("status", params.status);
  }
  if (params.source) {
    query = query.eq("source", params.source);
  }
  if (params.contentTier) {
    query = query.eq("content_tier", params.contentTier);
  }
  if (params.articleType) {
    query = query.eq("article_type", params.articleType);
  }
  if (params.search) {
    query = query.or(
      `title.ilike.%${params.search}%,title_zh.ilike.%${params.search}%`,
    );
  }

  query = query.range(offset, offset + pageSize - 1);

  const { data, count, error } = await query;
  if (error) throw error;

  return {
    articles: (data ?? []).map(mapArticleRow),
    total: count ?? 0,
  };
}

/**
 * Get distinct article sources (all statuses, for admin filter).
 */
export async function getAdminArticleSources(): Promise<string[]> {
  const supabase = createAdminClient();

  const { data, error } = (await supabase
    .from("articles")
    .select("source")) as {
    data: { source: string }[] | null;
    error: unknown;
  };
  if (error) throw error;

  return [...new Set((data ?? []).map((r) => r.source).filter(Boolean))].sort();
}

/**
 * Update article status.
 */
export async function updateArticleStatus(
  id: string,
  status: string,
): Promise<void> {
  const supabase = createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from("articles") as any)
    .update({ status: status as "published" | "draft" | "hidden" })
    .eq("id", id)
    .select("id");

  if (error) throw error;
  if (!data || data.length === 0) {
    throw new Error("No rows updated — check RLS policy or article ID");
  }
}

/**
 * Get a single article by ID (no status filter, for admin editing).
 */
export async function getAdminArticleById(id: string): Promise<Article | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("articles")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return null;
  return mapArticleRow(data);
}

/**
 * Update article fields (admin editor).
 */
export async function updateArticle(
  id: string,
  data: {
    title_zh?: string;
    summary_zh?: string;
    content_zh?: string;
    status?: string;
    relevance_score?: number;
  },
): Promise<void> {
  const supabase = createAdminClient();

  const updateData: ArticleUpdate = {};
  if (data.title_zh !== undefined) updateData.title_zh = data.title_zh;
  if (data.summary_zh !== undefined) updateData.summary_zh = data.summary_zh;
  if (data.content_zh !== undefined) updateData.content_zh = data.content_zh;
  if (data.status !== undefined)
    updateData.status = data.status as "published" | "draft" | "hidden";
  if (data.relevance_score !== undefined)
    updateData.relevance_score = data.relevance_score;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("articles") as any)
    .update(updateData)
    .eq("id", id);

  if (error) throw error;
}

/**
 * Delete an article by id.
 */
export async function deleteArticle(id: string): Promise<void> {
  const supabase = createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("articles") as any)
    .delete()
    .eq("id", id);

  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Skills admin
// ---------------------------------------------------------------------------

export interface SkillStats {
  total: number;
  published: number;
  draft: number;
  hidden: number;
}

/**
 * Get skill counts grouped by status.
 */
export async function getSkillStats(): Promise<SkillStats> {
  const supabase = createAdminClient();

  const [publishedRes, draftRes, hiddenRes] = await Promise.all([
    supabase
      .from("skills")
      .select("*", { count: "exact", head: true })
      .eq("status", "published"),
    supabase
      .from("skills")
      .select("*", { count: "exact", head: true })
      .eq("status", "draft"),
    supabase
      .from("skills")
      .select("*", { count: "exact", head: true })
      .eq("status", "hidden"),
  ]);

  const published = publishedRes.count ?? 0;
  const draft = draftRes.count ?? 0;
  const hidden = hiddenRes.count ?? 0;

  return {
    total: published + draft + hidden,
    published,
    draft,
    hidden,
  };
}

/**
 * Get skills for admin listing with filters and pagination.
 */
export async function getAdminSkills(params: {
  status?: string;
  source?: string;
  category?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}): Promise<{ skills: Skill[]; total: number }> {
  const supabase = createAdminClient();
  const pageSize = params.pageSize ?? ADMIN_PAGE_SIZE;
  const page = params.page ?? 1;
  const offset = (Math.max(1, page) - 1) * pageSize;

  let query = supabase
    .from("skills")
    .select("*", { count: "exact" })
    .order("stars", { ascending: false });

  if (params.status) {
    query = query.eq("status", params.status);
  }
  if (params.source) {
    query = query.eq("source", params.source);
  }
  if (params.category) {
    query = query.eq("category", params.category);
  }
  if (params.search) {
    query = query.or(
      `name.ilike.%${params.search}%,name_zh.ilike.%${params.search}%,author.ilike.%${params.search}%`,
    );
  }

  query = query.range(offset, offset + pageSize - 1);

  const { data, count, error } = await query;
  if (error) throw error;

  return {
    skills: (data ?? []).map(mapSkillRow),
    total: count ?? 0,
  };
}

/**
 * Get distinct skill sources for admin filter.
 */
export async function getAdminSkillSources(): Promise<string[]> {
  const supabase = createAdminClient();

  const { data, error } = (await supabase.from("skills").select("source")) as {
    data: { source: string }[] | null;
    error: unknown;
  };
  if (error) throw error;

  return [...new Set((data ?? []).map((r) => r.source).filter(Boolean))].sort();
}

/**
 * Get distinct skill categories for admin filter.
 */
export async function getAdminSkillCategories(): Promise<string[]> {
  const supabase = createAdminClient();

  const { data, error } = (await supabase
    .from("skills")
    .select("category")) as {
    data: { category: string | null }[] | null;
    error: unknown;
  };
  if (error) throw error;

  return [
    ...new Set(
      (data ?? []).map((r) => r.category).filter((c): c is string => !!c),
    ),
  ].sort();
}

/**
 * Get a single skill by ID (no status filter, for admin editing).
 */
export async function getAdminSkillById(id: string): Promise<Skill | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("skills")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return null;
  return mapSkillRow(data);
}

/**
 * Update skill fields (admin editor).
 */
export async function updateSkill(
  id: string,
  data: {
    name_zh?: string;
    description_zh?: string;
    editor_comment_zh?: string;
    status?: string;
    category?: string;
  },
): Promise<void> {
  const supabase = createAdminClient();

  const updateData: SkillUpdate = {};
  if (data.name_zh !== undefined) updateData.name_zh = data.name_zh;
  if (data.description_zh !== undefined)
    updateData.description_zh = data.description_zh;
  if (data.editor_comment_zh !== undefined)
    updateData.editor_comment_zh = data.editor_comment_zh;
  if (data.status !== undefined)
    updateData.status = data.status as "published" | "draft" | "hidden";
  if (data.category !== undefined) updateData.category = data.category;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("skills") as any)
    .update(updateData)
    .eq("id", id);

  if (error) throw error;
}

/**
 * Update skill status (for status toggle).
 */
export async function updateSkillStatus(
  id: string,
  status: string,
): Promise<void> {
  const supabase = createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from("skills") as any)
    .update({ status: status as "published" | "draft" | "hidden" })
    .eq("id", id)
    .select("id");

  if (error) throw error;
  if (!data || data.length === 0) {
    throw new Error("No rows updated — check RLS policy or skill ID");
  }
}

/**
 * Batch update skill status.
 */
export async function batchUpdateSkillStatus(
  ids: string[],
  status: string,
): Promise<number> {
  const supabase = createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from("skills") as any)
    .update({ status: status as "published" | "draft" | "hidden" })
    .in("id", ids)
    .select("id");

  if (error) throw error;
  return data?.length ?? 0;
}

/**
 * Batch delete skills.
 */
export async function batchDeleteSkills(ids: string[]): Promise<number> {
  const supabase = createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from("skills") as any)
    .delete()
    .in("id", ids)
    .select("id");

  if (error) throw error;
  return data?.length ?? 0;
}

/**
 * Batch update article status.
 */
export async function batchUpdateArticleStatus(
  ids: string[],
  status: string,
): Promise<number> {
  const supabase = createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from("articles") as any)
    .update({ status: status as "published" | "draft" | "hidden" })
    .in("id", ids)
    .select("id");

  if (error) throw error;
  return data?.length ?? 0;
}

/**
 * Batch delete articles.
 */
export async function batchDeleteArticles(ids: string[]): Promise<number> {
  const supabase = createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from("articles") as any)
    .delete()
    .in("id", ids)
    .select("id");

  if (error) throw error;
  return data?.length ?? 0;
}

// ---------------------------------------------------------------------------
// MCP Servers admin
// ---------------------------------------------------------------------------

type McpServerUpdate = Database["public"]["Tables"]["mcp_servers"]["Update"];

export interface McpStats {
  total: number;
  published: number;
  draft: number;
  hidden: number;
}

/**
 * Get MCP server counts grouped by status.
 */
export async function getMcpStats(): Promise<McpStats> {
  const supabase = createAdminClient();

  const [publishedRes, draftRes, hiddenRes] = await Promise.all([
    supabase
      .from("mcp_servers")
      .select("*", { count: "exact", head: true })
      .eq("status", "published"),
    supabase
      .from("mcp_servers")
      .select("*", { count: "exact", head: true })
      .eq("status", "draft"),
    supabase
      .from("mcp_servers")
      .select("*", { count: "exact", head: true })
      .eq("status", "hidden"),
  ]);

  const published = publishedRes.count ?? 0;
  const draft = draftRes.count ?? 0;
  const hidden = hiddenRes.count ?? 0;

  return {
    total: published + draft + hidden,
    published,
    draft,
    hidden,
  };
}

/**
 * Get MCP servers for admin listing with filters and pagination.
 */
export async function getAdminMcpServers(params: {
  status?: string;
  qualityTier?: string;
  category?: string;
  source?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}): Promise<{ servers: McpServer[]; total: number }> {
  const supabase = createAdminClient();
  const pageSize = params.pageSize ?? ADMIN_PAGE_SIZE;
  const page = params.page ?? 1;
  const offset = (Math.max(1, page) - 1) * pageSize;

  let query = supabase
    .from("mcp_servers")
    .select("*", { count: "exact" })
    .order("stars", { ascending: false });

  if (params.status) {
    query = query.eq("status", params.status);
  }
  if (params.qualityTier) {
    query = query.eq("quality_tier", params.qualityTier);
  }
  if (params.category) {
    query = query.eq("category", params.category);
  }
  if (params.source) {
    query = query.eq("source", params.source);
  }
  if (params.search) {
    query = query.or(
      `name.ilike.%${params.search}%,name_zh.ilike.%${params.search}%,author.ilike.%${params.search}%`,
    );
  }

  query = query.range(offset, offset + pageSize - 1);

  const { data, count, error } = await query;
  if (error) throw error;

  return {
    servers: (data ?? []).map(mapMcpServerRow),
    total: count ?? 0,
  };
}

/**
 * Get distinct MCP server categories for admin filter.
 */
export async function getAdminMcpCategories(): Promise<string[]> {
  const supabase = createAdminClient();

  const { data, error } = (await supabase
    .from("mcp_servers")
    .select("category")) as {
    data: { category: string | null }[] | null;
    error: unknown;
  };
  if (error) throw error;

  return [
    ...new Set(
      (data ?? []).map((r) => r.category).filter((c): c is string => !!c),
    ),
  ].sort();
}

/**
 * Get distinct MCP server sources for admin filter.
 */
export async function getAdminMcpSources(): Promise<string[]> {
  const supabase = createAdminClient();

  const { data, error } = (await supabase
    .from("mcp_servers")
    .select("source")) as {
    data: { source: string }[] | null;
    error: unknown;
  };
  if (error) throw error;

  return [...new Set((data ?? []).map((r) => r.source).filter(Boolean))].sort();
}

/**
 * Get a single MCP server by ID (no status filter, for admin editing).
 */
export async function getAdminMcpById(id: string): Promise<McpServer | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("mcp_servers")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return null;
  return mapMcpServerRow(data);
}

/**
 * Update MCP server fields (admin editor).
 */
export async function updateMcpServer(
  id: string,
  data: {
    name_zh?: string;
    description_zh?: string;
    editor_comment_zh?: string;
    status?: string;
    category?: string;
    quality_tier?: string;
  },
): Promise<void> {
  const supabase = createAdminClient();

  const updateData: McpServerUpdate = {};
  if (data.name_zh !== undefined) updateData.name_zh = data.name_zh;
  if (data.description_zh !== undefined)
    updateData.description_zh = data.description_zh;
  if (data.editor_comment_zh !== undefined)
    updateData.editor_comment_zh = data.editor_comment_zh;
  if (data.status !== undefined)
    updateData.status = data.status as "published" | "draft" | "hidden";
  if (data.category !== undefined) updateData.category = data.category;
  if (data.quality_tier !== undefined)
    updateData.quality_tier = data.quality_tier as "S" | "A" | "B" | "C";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("mcp_servers") as any)
    .update(updateData)
    .eq("id", id);

  if (error) throw error;
}

/**
 * Update MCP server status (for status toggle).
 */
export async function updateMcpStatus(
  id: string,
  status: string,
): Promise<void> {
  const supabase = createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from("mcp_servers") as any)
    .update({ status: status as "published" | "draft" | "hidden" })
    .eq("id", id)
    .select("id");

  if (error) throw error;
  if (!data || data.length === 0) {
    throw new Error("No rows updated — check RLS policy or MCP server ID");
  }
}

/**
 * Batch update MCP server status.
 */
export async function batchUpdateMcpStatus(
  ids: string[],
  status: string,
): Promise<number> {
  const supabase = createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from("mcp_servers") as any)
    .update({ status: status as "published" | "draft" | "hidden" })
    .in("id", ids)
    .select("id");

  if (error) throw error;
  return data?.length ?? 0;
}

/**
 * Batch delete MCP servers.
 */
export async function batchDeleteMcpServers(ids: string[]): Promise<number> {
  const supabase = createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from("mcp_servers") as any)
    .delete()
    .in("id", ids)
    .select("id");

  if (error) throw error;
  return data?.length ?? 0;
}

/**
 * Batch update MCP server quality tier.
 */
export async function batchUpdateMcpTier(
  ids: string[],
  tier: string,
): Promise<number> {
  const supabase = createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from("mcp_servers") as any)
    .update({ quality_tier: tier as "S" | "A" | "B" | "C" })
    .in("id", ids)
    .select("id");

  if (error) throw error;
  return data?.length ?? 0;
}

/**
 * Delete a single MCP server.
 */
export async function deleteMcpServer(id: string): Promise<void> {
  const supabase = createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("mcp_servers") as any)
    .delete()
    .eq("id", id);

  if (error) throw error;
}
