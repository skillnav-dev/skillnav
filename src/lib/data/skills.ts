import type { Skill } from "@/data/types";

const isSupabaseConfigured = () =>
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Exclude hidden skills from a Supabase query.
 * Handles NULL (legacy rows without is_hidden) and explicit false.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function excludeHidden<T extends { or: (...args: any[]) => any }>(query: T): T {
  return query.or("is_hidden.is.null,is_hidden.eq.false");
}

/**
 * Get all skills, sorted by stars descending.
 */
export async function getSkills(options?: {
  limit?: number;
  offset?: number;
  category?: string;
  source?: string;
  search?: string;
  platform?: string;
  tab?: string;
  sort?: string;
}): Promise<Skill[]> {
  if (!isSupabaseConfigured()) {
    const { mockSkills } = await import("@/data/mock-skills");
    let results = [...mockSkills];
    if (options?.category) {
      results = results.filter((s) => s.category === options.category);
    }
    if (options?.search) {
      const q = options.search.toLowerCase();
      results = results.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.nameZh?.includes(q) ||
          s.description.toLowerCase().includes(q),
      );
    }
    const start = options?.offset ?? 0;
    if (options?.limit) {
      results = results.slice(start, start + options.limit);
    }
    return results;
  }

  const { createServerClient } = await import("@/lib/supabase/server");
  const { mapSkillRow } = await import("@/lib/supabase/mappers");
  const supabase = await createServerClient();

  const sortField = options?.sort === "latest" ? "created_at" : "stars";
  let query = supabase
    .from("skills")
    .select("*")
    .order(sortField, { ascending: false });

  query = excludeHidden(query);

  if (options?.category) query = query.eq("category", options.category);
  if (options?.source) query = query.eq("source", options.source);
  if (options?.platform) query = query.contains("platform", [options.platform]);
  if (options?.tab === "featured") {
    query = query.eq("is_featured", true).in("quality_tier", ["A", "B"]);
  }
  if (options?.search) {
    query = query.or(
      `name.ilike.%${options.search}%,name_zh.ilike.%${options.search}%`,
    );
  }
  if (options?.limit) {
    const start = options.offset ?? 0;
    query = query.range(start, start + options.limit - 1);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map(mapSkillRow);
}

/**
 * Get a single skill by slug.
 */
export async function getSkillBySlug(slug: string): Promise<Skill | null> {
  if (!isSupabaseConfigured()) {
    const { mockSkills } = await import("@/data/mock-skills");
    return mockSkills.find((s) => s.slug === slug) ?? null;
  }

  const { createServerClient } = await import("@/lib/supabase/server");
  const { mapSkillRow } = await import("@/lib/supabase/mappers");
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from("skills")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error) return null;
  return mapSkillRow(data);
}

/**
 * Get featured skills for homepage.
 */
export async function getFeaturedSkills(limit = 6): Promise<Skill[]> {
  if (!isSupabaseConfigured()) {
    const { mockSkills } = await import("@/data/mock-skills");
    return mockSkills.slice(0, limit);
  }

  const { createServerClient } = await import("@/lib/supabase/server");
  const { mapSkillRow } = await import("@/lib/supabase/mappers");
  const supabase = await createServerClient();

  let query = supabase
    .from("skills")
    .select("*")
    .eq("source", "curated")
    .order("stars", { ascending: false })
    .order("name", { ascending: true })
    .limit(limit);

  query = excludeHidden(query);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map(mapSkillRow);
}

/**
 * Get total skills count.
 */
export async function getSkillsCount(): Promise<number> {
  if (!isSupabaseConfigured()) {
    const { mockSkills } = await import("@/data/mock-skills");
    return mockSkills.length;
  }

  const { createServerClient } = await import("@/lib/supabase/server");
  const supabase = await createServerClient();

  let query = supabase
    .from("skills")
    .select("*", { count: "exact", head: true });

  query = excludeHidden(query);

  const { count, error } = await query;
  if (error) throw error;
  return count ?? 0;
}

/**
 * Get skills with total count (for paginated listing).
 */
export async function getSkillsWithCount(options?: {
  limit?: number;
  offset?: number;
  category?: string;
  source?: string;
  search?: string;
  platform?: string;
  tab?: string;
  sort?: string;
}): Promise<{ skills: Skill[]; total: number }> {
  if (!isSupabaseConfigured()) {
    const { mockSkills } = await import("@/data/mock-skills");
    let results = [...mockSkills];
    if (options?.category) {
      results = results.filter((s) => s.category === options.category);
    }
    if (options?.search) {
      const q = options.search.toLowerCase();
      results = results.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.nameZh?.includes(q) ||
          s.description.toLowerCase().includes(q),
      );
    }
    const total = results.length;
    const start = options?.offset ?? 0;
    if (options?.limit) {
      results = results.slice(start, start + options.limit);
    }
    return { skills: results, total };
  }

  const { createServerClient } = await import("@/lib/supabase/server");
  const { mapSkillRow } = await import("@/lib/supabase/mappers");
  const supabase = await createServerClient();

  const sortField = options?.sort === "latest" ? "created_at" : "stars";
  let query = supabase
    .from("skills")
    .select("*", { count: "exact" })
    .order(sortField, { ascending: false });

  query = excludeHidden(query);

  if (options?.category) query = query.eq("category", options.category);
  if (options?.source) query = query.eq("source", options.source);
  if (options?.platform) query = query.contains("platform", [options.platform]);
  if (options?.tab === "featured") {
    query = query.eq("is_featured", true).in("quality_tier", ["A", "B"]);
  }
  if (options?.search) {
    query = query.or(
      `name.ilike.%${options.search}%,name_zh.ilike.%${options.search}%`,
    );
  }
  if (options?.limit) {
    const start = options.offset ?? 0;
    query = query.range(start, start + options.limit - 1);
  }

  const { data, count, error } = await query;
  if (error) throw error;
  return {
    skills: (data ?? []).map(mapSkillRow),
    total: count ?? 0,
  };
}

/**
 * Get distinct skill categories.
 */
export async function getSkillCategories(): Promise<string[]> {
  if (!isSupabaseConfigured()) {
    const { mockSkills } = await import("@/data/mock-skills");
    return [...new Set(mockSkills.map((s) => s.category))].sort();
  }

  const { createServerClient } = await import("@/lib/supabase/server");
  const supabase = await createServerClient();

  let query = supabase.from("skills").select("category");

  query = excludeHidden(query);

  const { data, error } = (await query) as {
    data: { category: string }[] | null;
    error: unknown;
  };
  if (error) throw error;
  return [
    ...new Set((data ?? []).map((r) => r.category).filter(Boolean)),
  ].sort();
}

/**
 * Get distinct platform values from visible skills.
 */
export async function getSkillPlatforms(): Promise<string[]> {
  if (!isSupabaseConfigured()) return ["claude"];

  const { createServerClient } = await import("@/lib/supabase/server");
  const supabase = await createServerClient();

  let query = supabase.from("skills").select("platform");
  query = excludeHidden(query);

  const { data, error } = (await query) as {
    data: { platform: string[] }[] | null;
    error: unknown;
  };
  if (error) throw error;

  const platforms = new Set<string>();
  for (const row of data ?? []) {
    for (const p of row.platform ?? []) {
      if (p) platforms.add(p);
    }
  }
  return [...platforms].sort();
}

/**
 * Get distinct repo_source values from visible skills.
 */
export async function getSkillRepoSources(): Promise<string[]> {
  if (!isSupabaseConfigured()) return [];

  const { createServerClient } = await import("@/lib/supabase/server");
  const supabase = await createServerClient();

  let query = supabase.from("skills").select("repo_source");
  query = excludeHidden(query);

  const { data, error } = (await query) as {
    data: { repo_source: string | null }[] | null;
    error: unknown;
  };
  if (error) throw error;

  return [
    ...new Set(
      (data ?? []).map((r) => r.repo_source).filter(Boolean) as string[],
    ),
  ].sort();
}

/**
 * Get all skill slugs (for generateStaticParams).
 */
export async function getAllSkillSlugs(): Promise<string[]> {
  if (!isSupabaseConfigured()) {
    const { mockSkills } = await import("@/data/mock-skills");
    return mockSkills.map((s) => s.slug);
  }

  const { createStaticClient } = await import("@/lib/supabase/static");
  const supabase = createStaticClient();

  let query = supabase.from("skills").select("slug");

  query = excludeHidden(query);

  const { data, error } = (await query) as {
    data: { slug: string }[] | null;
    error: unknown;
  };

  if (error) throw error;
  return (data ?? []).map((r) => r.slug);
}
