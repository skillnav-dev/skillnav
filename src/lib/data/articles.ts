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
    .order("published_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []).map(mapArticleRow);
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

  const { data, error } = (await supabase.from("articles").select("slug")) as {
    data: { slug: string }[] | null;
    error: unknown;
  };

  if (error) throw error;
  return (data ?? []).map((r) => r.slug);
}
