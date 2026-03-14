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
    .eq("status", "published")
    .single();

  if (error) return null;
  return mapArticleRow(data);
}

/**
 * Get latest articles for homepage.
 */
export async function getLatestArticles(limit = 3): Promise<Article[]> {
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
 * Get total published articles count.
 */
export async function getArticlesCount(): Promise<number> {
  if (!isSupabaseConfigured()) {
    const { mockArticles } = await import("@/data/mock-articles");
    return mockArticles.length;
  }

  const { createServerClient } = await import("@/lib/supabase/server");
  const supabase = await createServerClient();

  const { count, error } = await supabase
    .from("articles")
    .select("*", { count: "exact", head: true })
    .eq("status", "published");

  if (error) throw error;
  return count ?? 0;
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
  sort?: string;
  contentTier?: string;
}): Promise<{ articles: Article[]; total: number }> {
  const ascending = options?.sort === "oldest";

  if (!isSupabaseConfigured()) {
    const { mockArticles } = await import("@/data/mock-articles");
    let results = [...mockArticles];
    if (options?.category) {
      results = results.filter((a) => a.category === options.category);
    }
    if (options?.source) {
      results = results.filter((a) => a.source === options.source);
    }
    if (options?.contentTier) {
      results = results.filter((a) => a.contentTier === options.contentTier);
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
    if (ascending) results.reverse();
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
    .order("published_at", { ascending });

  if (options?.category) query = query.eq("article_type", options.category);
  if (options?.source) query = query.eq("source", options.source);
  if (options?.contentTier)
    query = query.eq("content_tier", options.contentTier);
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
 * Get editorial (non-translated) articles.
 */
export async function getEditorialArticles(limit = 10): Promise<Article[]> {
  if (!isSupabaseConfigured()) {
    const { mockArticles } = await import("@/data/mock-articles");
    return mockArticles
      .filter((a) => a.contentTier === "editorial")
      .slice(0, limit);
  }

  const { createServerClient } = await import("@/lib/supabase/server");
  const { mapArticleRow } = await import("@/lib/supabase/mappers");
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from("articles")
    .select("*")
    .eq("status", "published")
    .eq("content_tier", "editorial")
    .order("published_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []).map(mapArticleRow);
}

/**
 * Get weekly newsletter articles, ordered by series number.
 */
export async function getWeeklyArticles(limit = 10): Promise<Article[]> {
  if (!isSupabaseConfigured()) {
    const { mockArticles } = await import("@/data/mock-articles");
    return mockArticles
      .filter((a) => a.series === "weekly")
      .sort((a, b) => (b.seriesNumber ?? 0) - (a.seriesNumber ?? 0))
      .slice(0, limit);
  }

  const { createServerClient } = await import("@/lib/supabase/server");
  const { mapArticleRow } = await import("@/lib/supabase/mappers");
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from("articles")
    .select("*")
    .eq("status", "published")
    .eq("series", "weekly")
    .order("series_number", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []).map(mapArticleRow);
}

/**
 * Get a single weekly article by slug.
 */
export async function getWeeklyBySlug(slug: string): Promise<Article | null> {
  if (!isSupabaseConfigured()) {
    const { mockArticles } = await import("@/data/mock-articles");
    return (
      mockArticles.find((a) => a.slug === slug && a.series === "weekly") ?? null
    );
  }

  const { createServerClient } = await import("@/lib/supabase/server");
  const { mapArticleRow } = await import("@/lib/supabase/mappers");
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from("articles")
    .select("*")
    .eq("slug", slug)
    .eq("series", "weekly")
    .eq("status", "published")
    .single();

  if (error) return null;
  return mapArticleRow(data);
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

/**
 * Get published article slugs with updated_at for sitemap.
 */
export async function getSitemapArticles(): Promise<
  { slug: string; updatedAt: string }[]
> {
  if (!isSupabaseConfigured()) {
    const { mockArticles } = await import("@/data/mock-articles");
    return mockArticles.map((a) => ({
      slug: a.slug,
      updatedAt: a.publishedAt,
    }));
  }

  const { createStaticClient } = await import("@/lib/supabase/static");
  const supabase = createStaticClient();

  const { data, error } = (await supabase
    .from("articles")
    .select("slug, published_at")
    .eq("status", "published")) as {
    data: { slug: string; published_at: string }[] | null;
    error: unknown;
  };

  if (error) throw error;
  return (data ?? []).map((r) => ({
    slug: r.slug,
    updatedAt: r.published_at,
  }));
}
