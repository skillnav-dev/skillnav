import type { Skill } from "@/data/types";

const isSupabaseConfigured = () =>
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Get all skills, sorted by stars descending.
 */
export async function getSkills(options?: {
  limit?: number;
  offset?: number;
  category?: string;
  source?: string;
  search?: string;
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

  let query = supabase
    .from("skills")
    .select("*")
    .order("stars", { ascending: false });

  if (options?.category) query = query.eq("category", options.category);
  if (options?.source) query = query.eq("source", options.source);
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

  const { data, error } = await supabase
    .from("skills")
    .select("*")
    .eq("is_featured", true)
    .order("stars", { ascending: false })
    .limit(limit);

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

  const { count, error } = await supabase
    .from("skills")
    .select("*", { count: "exact", head: true });

  if (error) throw error;
  return count ?? 0;
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

  const { data, error } = (await supabase.from("skills").select("slug")) as {
    data: { slug: string }[] | null;
    error: unknown;
  };

  if (error) throw error;
  return (data ?? []).map((r) => r.slug);
}
