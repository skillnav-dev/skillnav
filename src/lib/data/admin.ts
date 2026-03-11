/**
 * Data access layer for admin pages.
 * Uses service role key when available for unrestricted access,
 * falls back to anon key (RLS still applies).
 */

import { createClient } from "@supabase/supabase-js";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { Database } from "@/lib/supabase/types";
import type { Article } from "@/data/types";
import { mapArticleRow } from "@/lib/supabase/mappers";

type ArticleUpdate = Database["public"]["Tables"]["articles"]["Update"];

function getServiceRoleKey(): string | undefined {
  // In Cloudflare Workers, secrets are not enumerable via Object.entries()
  // so process.env won't have them. Access via getCloudflareContext() instead.
  try {
    const ctx = getCloudflareContext();
    const key = (ctx.env as Record<string, string>).SUPABASE_SERVICE_ROLE_KEY;
    if (key) return key;
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
  const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
  console.log(
    `[admin] updateArticleStatus: id=${id}, status=${status}, hasServiceKey=${hasServiceKey}`,
  );

  const supabase = createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from("articles") as any)
    .update({ status: status as "published" | "draft" | "hidden" })
    .eq("id", id)
    .select("id");

  if (error) {
    console.error(`[admin] Supabase error:`, error);
    throw error;
  }
  if (!data || data.length === 0) {
    throw new Error(
      `No rows updated (hasServiceKey=${hasServiceKey}) — check RLS policy or article ID`,
    );
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
