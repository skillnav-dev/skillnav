import type { SkillRow, ArticleRow, McpServerRow } from "./types";
import type {
  Skill,
  Article,
  ArticleStatus,
  McpServer,
  McpSource,
  McpStatus,
  FreshnessLevel,
} from "@/data/types";

/**
 * Map Supabase skill row (snake_case) to app Skill (camelCase).
 */
export function mapSkillRow(row: SkillRow): Skill {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    nameZh: row.name_zh ?? undefined,
    description: row.description ?? "",
    descriptionZh: row.description_zh ?? undefined,
    author: row.author ?? "",
    category: row.category ?? "",
    tags: row.tags,
    source: row.source,
    sourceUrl: row.source_url ?? undefined,
    githubUrl: row.github_url ?? undefined,
    stars: row.stars,
    downloads: row.downloads,
    weeklyDownloads: row.weekly_downloads,
    securityScore: row.security_score,
    isVerified: row.is_verified,
    isFeatured: row.is_featured,
    pricingType: row.pricing_type,
    platform: row.platform,
    version: row.version ?? undefined,
    screenshotUrls: row.screenshot_urls,
    similarSkills: row.similar_skills,
    content: row.content ?? undefined,
    contentZh: row.content_zh ?? undefined,
    installCommand: row.install_command ?? undefined,
    requiresEnv: row.requires_env,
    requiresBins: row.requires_bins,
    editorRating: row.editor_rating ?? undefined,
    editorReviewZh: row.editor_review_zh ?? undefined,
    editorCommentZh: row.editor_comment_zh ?? undefined,
    repoSource: row.repo_source ?? undefined,
    qualityTier: row.quality_tier ?? undefined,
    isHidden: row.is_hidden ?? undefined,
    lastVerifiedAt: row.last_verified_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Map Supabase mcp_servers row (snake_case) to app McpServer (camelCase).
 */
export function mapMcpServerRow(row: McpServerRow): McpServer {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    nameZh: row.name_zh ?? undefined,
    author: row.author ?? undefined,
    description: row.description ?? undefined,
    descriptionZh: row.description_zh ?? undefined,
    introZh: row.intro_zh ?? undefined,
    category: row.category ?? undefined,
    tags: row.tags,
    githubUrl: row.github_url ?? undefined,
    npmPackage: row.npm_package ?? undefined,
    installCommand: row.install_command ?? undefined,
    installConfig: row.install_config ?? undefined,
    toolsCount: row.tools_count,
    version: row.version ?? undefined,
    stars: row.stars,
    forksCount: row.forks_count,
    weeklyDownloads: row.weekly_downloads,
    qualityScore: row.quality_score ?? undefined,
    qualityTier: row.quality_tier,
    qualityReason: row.quality_reason ?? undefined,
    editorCommentZh: row.editor_comment_zh ?? undefined,
    editorRating: row.editor_rating ?? undefined,
    status: row.status as McpStatus,
    source: (row.source as McpSource) ?? undefined,
    sourceUrl: row.source_url ?? undefined,
    isVerified: row.is_verified,
    isFeatured: row.is_featured,
    isTrending: row.is_trending,
    isArchived: row.is_archived,
    weeklyStarsDelta: row.weekly_stars_delta,
    freshness: row.freshness as FreshnessLevel,
    pushedAt: row.pushed_at ?? undefined,
    discoveredAt: row.discovered_at,
    lastSyncedAt: row.last_synced_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Map Supabase article row (snake_case) to app Article (camelCase).
 */
export function mapArticleRow(row: ArticleRow): Article {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    titleZh: row.title_zh ?? undefined,
    summary: row.summary ?? "",
    summaryZh: row.summary_zh ?? undefined,
    content: row.content ?? "",
    contentZh: row.content_zh ?? undefined,
    introZh: row.intro_zh ?? undefined,
    source: (row.source as Article["source"]) ?? undefined,
    sourceUrl: row.source_url ?? undefined,
    coverImage: row.cover_image ?? undefined,
    readingTime: row.reading_time,
    category: row.article_type,
    status: (row.status as ArticleStatus) ?? "published",
    relevanceScore: row.relevance_score ?? undefined,
    contentTier: row.content_tier,
    series: row.series ?? undefined,
    seriesNumber: row.series_number ?? undefined,
    publishedAt: row.published_at ?? "",
    createdAt: row.created_at,
  };
}
