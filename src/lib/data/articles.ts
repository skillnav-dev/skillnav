import type { Article } from "@/data/types";

const isSupabaseConfigured = () =>
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Get all articles, sorted by published date descending.
 */
export async function getArticles(options?: {
  limit?: number;
  offset?: number;
  category?: string;
}): Promise<Article[]> {
  if (!isSupabaseConfigured()) {
    const { mockArticles } = await import("@/data/mock-articles");
    let results = [...mockArticles];
    if (options?.category) {
      results = results.filter((a) => a.category === options.category);
    }
    const start = options?.offset ?? 0;
    if (options?.limit) {
      results = results.slice(start, start + options.limit);
    }
    return results;
  }

  const { createServerClient } = await import("@/lib/supabase/server");
  const { mapArticleRow } = await import("@/lib/supabase/mappers");
  const supabase = await createServerClient();

  let query = supabase
    .from("articles")
    .select("*")
    .eq("status", "published")
    .order("published_at", { ascending: false });

  if (options?.category) query = query.eq("article_type", options.category);
  if (options?.limit) {
    const start = options.offset ?? 0;
    query = query.range(start, start + options.limit - 1);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map(mapArticleRow);
}

/**
 * Get a single article by slug.
 */
export async function getArticleBySlug(slug: string): Promise<Article | null> {
  if (!isSupabaseConfigured()) {
    const { mockArticles } = await import("@/data/mock-articles");
    return mockArticles.find((a) => a.slug === slug) ?? null;
  }

  const { createServerClient } = await import("@/lib/supabase/server");
  const { mapArticleRow } = await import("@/lib/supabase/mappers");
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from("articles")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error) return null;
  return mapArticleRow(data);
}

/**
 * Get latest articles for homepage.
 */
export async function getLatestArticles(limit = 4): Promise<Article[]> {
  if (!isSupabaseConfigured()) {
    const { mockArticles } = await import("@/data/mock-articles");
    return mockArticles.slice(0, limit);
  }

  const { createServerClient } = await import("@/lib/supabase/server");
  const { mapArticleRow } = await import("@/lib/supabase/mappers");
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from("articles")
    .select("*")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []).map(mapArticleRow);
}

/**
 * Get articles with total count (for paginated listing).
 */
export async function getArticlesWithCount(options?: {
  limit?: number;
  offset?: number;
  category?: string;
  source?: string;
  search?: string;
}): Promise<{ articles: Article[]; total: number }> {
  if (!isSupabaseConfigured()) {
    const { mockArticles } = await import("@/data/mock-articles");
    let results = [...mockArticles];
    if (options?.category) {
      results = results.filter((a) => a.category === options.category);
    }
    if (options?.source) {
      results = results.filter((a) => a.source === options.source);
    }
    if (options?.search) {
      const q = options.search.toLowerCase();
      results = results.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.titleZh?.includes(q) ||
          a.summary.toLowerCase().includes(q) ||
          a.summaryZh?.includes(q),
      );
    }
    const total = results.length;
    const start = options?.offset ?? 0;
    if (options?.limit) {
      results = results.slice(start, start + options.limit);
    }
    return { articles: results, total };
  }

  const { createServerClient } = await import("@/lib/supabase/server");
  const { mapArticleRow } = await import("@/lib/supabase/mappers");
  const supabase = await createServerClient();

  let query = supabase
    .from("articles")
    .select("*", { count: "exact" })
    .eq("status", "published")
    .order("published_at", { ascending: false });

  if (options?.category) query = query.eq("article_type", options.category);
  if (options?.source) query = query.eq("source", options.source);
  if (options?.search) {
    query = query.or(
      `title.ilike.%${options.search}%,title_zh.ilike.%${options.search}%`,
    );
  }
  if (options?.limit) {
    const start = options.offset ?? 0;
    query = query.range(start, start + options.limit - 1);
  }

  const { data, count, error } = await query;
  if (error) throw error;
  return {
    articles: (data ?? []).map(mapArticleRow),
    total: count ?? 0,
  };
}

/**
 * Get distinct article sources for filter UI.
 */
export async function getArticleSources(): Promise<string[]> {
  if (!isSupabaseConfigured()) {
    const { mockArticles } = await import("@/data/mock-articles");
    return [
      ...new Set(mockArticles.map((a) => a.source).filter(Boolean) as string[]),
    ].sort();
  }

  const { createServerClient } = await import("@/lib/supabase/server");
  const supabase = await createServerClient();

  const { data, error } = (await supabase
    .from("articles")
    .select("source")
    .eq("status", "published")) as {
    data: { source: string }[] | null;
    error: unknown;
  };
  if (error) throw error;
  return [...new Set((data ?? []).map((r) => r.source).filter(Boolean))].sort();
}

/**
 * Get distinct article categories.
 */
export async function getArticleCategories(): Promise<string[]> {
  if (!isSupabaseConfigured()) {
    const { mockArticles } = await import("@/data/mock-articles");
    return [...new Set(mockArticles.map((a) => a.category))].sort();
  }

  const { createServerClient } = await import("@/lib/supabase/server");
  const supabase = await createServerClient();

  const { data, error } = (await supabase
    .from("articles")
    .select("article_type")
    .eq("status", "published")) as {
    data: { article_type: string }[] | null;
    error: unknown;
  };
  if (error) throw error;
  return [
    ...new Set((data ?? []).map((r) => r.article_type).filter(Boolean)),
  ].sort();
}

/**
 * Get all article slugs (for generateStaticParams).
 */
export async function getAllArticleSlugs(): Promise<string[]> {
  if (!isSupabaseConfigured()) {
    const { mockArticles } = await import("@/data/mock-articles");
    return mockArticles.map((a) => a.slug);
  }

  const { createStaticClient } = await import("@/lib/supabase/static");
  const supabase = createStaticClient();

  const { data, error } = (await supabase
    .from("articles")
    .select("slug")
    .eq("status", "published")) as {
    data: { slug: string }[] | null;
    error: unknown;
  };

  if (error) throw error;
  return (data ?? []).map((r) => r.slug);
}
