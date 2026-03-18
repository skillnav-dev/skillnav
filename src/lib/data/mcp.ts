import type { McpServer } from "@/data/types";
import type { MCPServer as StaticMCPServer } from "@/data/mcp-servers";

const isSupabaseConfigured = () =>
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Map static MCPServer (from mcp-servers.ts) to app McpServer interface.
 */
function mapStaticToMcpServer(s: StaticMCPServer): McpServer {
  return {
    id: s.slug,
    slug: s.slug,
    name: s.name,
    nameZh: s.nameZh,
    author: s.author,
    description: s.description,
    descriptionZh: s.descriptionZh,
    category: s.category,
    tags: [],
    githubUrl: s.githubUrl,
    installCommand: s.installCommand,
    toolsCount: 0,
    tools: undefined,
    stars: s.stars ?? 0,
    forksCount: 0,
    weeklyDownloads: 0,
    qualityTier: "B",
    status: "published",
    isVerified: false,
    isFeatured: s.isFeatured ?? false,
    isTrending: false,
    isArchived: false,
    weeklyStarsDelta: 0,
    freshness: "active",
    discoveredAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Filter and sort static MCP servers for fallback queries.
 */
function filterStatic(
  servers: McpServer[],
  options?: {
    category?: string;
    search?: string;
    sort?: string;
    tier?: string;
    limit?: number;
    offset?: number;
  },
): McpServer[] {
  let results = [...servers];

  if (options?.tier) {
    results = results.filter((s) => s.qualityTier === options.tier);
  }
  if (options?.category) {
    results = results.filter((s) => s.category === options.category);
  }
  if (options?.search) {
    const q = options.search.toLowerCase();
    results = results.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.nameZh?.includes(q) ||
        s.description?.toLowerCase().includes(q),
    );
  }

  // Sort
  if (options?.sort === "latest") {
    results.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  } else {
    results.sort((a, b) => b.stars - a.stars);
  }

  const start = options?.offset ?? 0;
  if (options?.limit) {
    results = results.slice(start, start + options.limit);
  }
  return results;
}

/**
 * Get MCP servers list, sorted by stars descending.
 */
export async function getMcpServers(options?: {
  limit?: number;
  offset?: number;
  category?: string;
  search?: string;
  sort?: string;
  tier?: string;
}): Promise<McpServer[]> {
  if (!isSupabaseConfigured()) {
    const { mcpServers } = await import("@/data/mcp-servers");
    const mapped = mcpServers.map(mapStaticToMcpServer);
    return filterStatic(mapped, options);
  }

  const { createServerClient } = await import("@/lib/supabase/server");
  const { mapMcpServerRow } = await import("@/lib/supabase/mappers");
  const supabase = await createServerClient();

  const sortField = options?.sort === "latest" ? "created_at" : "stars";
  let query = supabase
    .from("mcp_servers")
    .select("*")
    .eq("status", "published")
    .order(sortField, { ascending: false });

  if (options?.category) query = query.eq("category", options.category);
  if (options?.tier) query = query.eq("quality_tier", options.tier);
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
  return (data ?? []).map(mapMcpServerRow);
}

/**
 * Get MCP servers with total count (for paginated listing).
 */
export async function getMcpServersWithCount(options?: {
  limit?: number;
  offset?: number;
  category?: string;
  search?: string;
  sort?: string;
  tier?: string;
}): Promise<{ servers: McpServer[]; total: number }> {
  if (!isSupabaseConfigured()) {
    const { mcpServers } = await import("@/data/mcp-servers");
    const mapped = mcpServers.map(mapStaticToMcpServer);

    let results = [...mapped];
    if (options?.tier) {
      results = results.filter((s) => s.qualityTier === options.tier);
    }
    if (options?.category) {
      results = results.filter((s) => s.category === options.category);
    }
    if (options?.search) {
      const q = options.search.toLowerCase();
      results = results.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.nameZh?.includes(q) ||
          s.description?.toLowerCase().includes(q),
      );
    }
    const total = results.length;

    // Sort
    if (options?.sort === "latest") {
      results.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    } else {
      results.sort((a, b) => b.stars - a.stars);
    }

    const start = options?.offset ?? 0;
    if (options?.limit) {
      results = results.slice(start, start + options.limit);
    }
    return { servers: results, total };
  }

  const { createServerClient } = await import("@/lib/supabase/server");
  const { mapMcpServerRow } = await import("@/lib/supabase/mappers");
  const supabase = await createServerClient();

  const sortField = options?.sort === "latest" ? "created_at" : "stars";
  let query = supabase
    .from("mcp_servers")
    .select("*", { count: "exact" })
    .eq("status", "published")
    .order(sortField, { ascending: false });

  if (options?.category) query = query.eq("category", options.category);
  if (options?.tier) query = query.eq("quality_tier", options.tier);
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
    servers: (data ?? []).map(mapMcpServerRow),
    total: count ?? 0,
  };
}

/**
 * Get a single MCP server by slug (no status filter).
 */
export async function getMcpServerBySlug(
  slug: string,
): Promise<McpServer | null> {
  if (!isSupabaseConfigured()) {
    const { mcpServers } = await import("@/data/mcp-servers");
    const found = mcpServers.find((s) => s.slug === slug);
    return found ? mapStaticToMcpServer(found) : null;
  }

  const { createServerClient } = await import("@/lib/supabase/server");
  const { mapMcpServerRow } = await import("@/lib/supabase/mappers");
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from("mcp_servers")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error) return null;
  return mapMcpServerRow(data);
}

/**
 * Get featured MCP servers for homepage.
 */
export async function getFeaturedMcpServers(limit = 6): Promise<McpServer[]> {
  if (!isSupabaseConfigured()) {
    const { mcpServers } = await import("@/data/mcp-servers");
    const mapped = mcpServers.map(mapStaticToMcpServer);
    return mapped
      .filter((s) => s.isFeatured)
      .sort((a, b) => b.stars - a.stars)
      .slice(0, limit);
  }

  const { createServerClient } = await import("@/lib/supabase/server");
  const { mapMcpServerRow } = await import("@/lib/supabase/mappers");
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from("mcp_servers")
    .select("*")
    .eq("is_featured", true)
    .eq("status", "published")
    .order("stars", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []).map(mapMcpServerRow);
}

/**
 * Get total published MCP servers count.
 */
export async function getMcpServersCount(): Promise<number> {
  if (!isSupabaseConfigured()) {
    const { mcpServers } = await import("@/data/mcp-servers");
    return mcpServers.length;
  }

  const { createServerClient } = await import("@/lib/supabase/server");
  const supabase = await createServerClient();

  const { count, error } = await supabase
    .from("mcp_servers")
    .select("*", { count: "exact", head: true })
    .eq("status", "published");

  if (error) throw error;
  return count ?? 0;
}

/**
 * Get distinct category values from published MCP servers.
 */
export async function getMcpCategories(): Promise<string[]> {
  if (!isSupabaseConfigured()) {
    const { mcpServers } = await import("@/data/mcp-servers");
    return [...new Set(mcpServers.map((s) => s.category))].sort();
  }

  const { createServerClient } = await import("@/lib/supabase/server");
  const supabase = await createServerClient();

  const { data, error } = (await supabase
    .from("mcp_servers")
    .select("category")
    .eq("status", "published")) as {
    data: { category: string }[] | null;
    error: unknown;
  };
  if (error) throw error;
  return [
    ...new Set((data ?? []).map((r) => r.category).filter(Boolean)),
  ].sort();
}

/**
 * Get all published MCP server slugs (for generateStaticParams).
 */
export async function getAllMcpSlugs(options?: {
  limit?: number;
}): Promise<string[]> {
  if (!isSupabaseConfigured()) {
    const { mcpServers } = await import("@/data/mcp-servers");
    const slugs = mcpServers.map((s) => s.slug);
    return options?.limit ? slugs.slice(0, options.limit) : slugs;
  }

  const { createStaticClient } = await import("@/lib/supabase/static");
  const supabase = createStaticClient();

  let query = supabase
    .from("mcp_servers")
    .select("slug")
    .eq("status", "published")
    .order("stars", { ascending: false });

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = (await query) as {
    data: { slug: string }[] | null;
    error: unknown;
  };

  if (error) throw error;
  return (data ?? []).map((r) => r.slug);
}

/**
 * Get published MCP server slugs with updated_at for sitemap.
 */
export async function getSitemapMcpServers(): Promise<
  { slug: string; updatedAt: string }[]
> {
  if (!isSupabaseConfigured()) {
    const { mcpServers } = await import("@/data/mcp-servers");
    const now = new Date().toISOString();
    return mcpServers.map((s) => ({ slug: s.slug, updatedAt: now }));
  }

  const { createStaticClient } = await import("@/lib/supabase/static");
  const supabase = createStaticClient();

  // Supabase default limit is 1000 rows — paginate to get all published servers
  const PAGE_SIZE = 1000;
  const all: { slug: string; updated_at: string }[] = [];
  let offset = 0;

  while (true) {
    const { data, error } = (await supabase
      .from("mcp_servers")
      .select("slug, updated_at")
      .eq("status", "published")
      .range(offset, offset + PAGE_SIZE - 1)) as {
      data: { slug: string; updated_at: string }[] | null;
      error: unknown;
    };

    if (error) throw error;
    const rows = data ?? [];
    all.push(...rows);
    if (rows.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }

  return all.map((r) => ({
    slug: r.slug,
    updatedAt: r.updated_at,
  }));
}
