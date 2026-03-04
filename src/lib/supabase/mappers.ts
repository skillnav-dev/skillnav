import type { SkillRow, ArticleRow } from "./types";
import type { Skill, Article } from "@/data/types";

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
    lastVerifiedAt: row.last_verified_at ?? undefined,
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
    sourceUrl: row.source_url ?? undefined,
    coverImage: row.cover_image ?? undefined,
    readingTime: row.reading_time,
    category: row.article_type,
    publishedAt: row.published_at ?? "",
    createdAt: row.created_at,
  };
}
