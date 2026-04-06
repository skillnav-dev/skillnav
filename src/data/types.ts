export type SecurityScore = "safe" | "warning" | "danger" | "unscanned";
export type SkillSource =
  | "clawhub"
  | "skills_sh"
  | "anthropic"
  | "skillsmp"
  | "agentskill"
  | "manual"
  | "curated";
export type PricingType = "free" | "freemium" | "paid";
export type ArticleType = "tutorial" | "analysis" | "guide";

export type McpSource = "official-registry" | "smithery" | "glama" | "manual";
export type McpStatus = "draft" | "published" | "hidden";
export type FreshnessLevel = "fresh" | "active" | "stale" | "archived";

export type ArticleSource =
  | "anthropic"
  | "openai"
  | "github"
  | "langchain"
  | "huggingface"
  | "crewai"
  | "simonw"
  | "latent-space"
  | "ai-coding-daily"
  | "thenewstack"
  | "arxiv"
  | "manual"
  | "other";
export type ContentTier = "editorial" | "translated";
export type ArticleSeries =
  | "weekly"
  | "monthly-roundup"
  | "agentic-engineering-patterns";
export type ArticleStatus = "published" | "draft" | "hidden";
export type SubmissionStatus = "pending" | "approved" | "rejected";

export interface Skill {
  id: string;
  slug: string;
  name: string;
  nameZh?: string;
  description: string;
  descriptionZh?: string;
  author: string;
  category: string;
  tags: string[];
  // Source tracking
  source: SkillSource;
  sourceUrl?: string;
  githubUrl?: string;
  // Metrics
  stars: number;
  downloads: number;
  weeklyDownloads?: number;
  // Security & trust
  securityScore: SecurityScore;
  isVerified?: boolean;
  isFeatured?: boolean;
  // Content (SKILL.md body)
  content?: string;
  contentZh?: string;
  // Install & requirements
  installCommand?: string;
  requiresEnv?: string[];
  requiresBins?: string[];
  // Editorial review
  editorRating?: string;
  editorReviewZh?: string;
  editorCommentZh?: string;
  // Repo source tracking
  repoSource?: string;
  // Content governance
  qualityTier?: "S" | "A" | "B" | "C";
  isHidden?: boolean;
  status?: "draft" | "published" | "hidden";
  introZh?: string;
  qualityScore?: number;
  qualityReason?: string;
  // Repo metadata & freshness
  discoveredAt?: string;
  pushedAt?: string;
  forksCount?: number;
  isArchived?: boolean;
  isTrending?: boolean;
  weeklyStarsDelta?: number;
  freshness?: FreshnessLevel;
  installCount?: number;
  lastSyncedAt?: string;
  // Enrichment
  pricingType?: PricingType;
  platform?: string[];
  version?: string;
  screenshotUrls?: string[];
  similarSkills?: string[];
  // Freshness
  lastVerifiedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Article {
  id: string;
  slug: string;
  title: string;
  titleZh?: string;
  summary: string;
  summaryZh?: string;
  content: string;
  contentZh?: string;
  introZh?: string;
  source?: ArticleSource;
  sourceUrl?: string;
  category: ArticleType;
  coverImage?: string;
  readingTime: number;
  status: ArticleStatus;
  relevanceScore?: number;
  contentTier: ContentTier;
  series?: string;
  seriesNumber?: number;
  publishedAt: string;
  createdAt: string;
}

export interface McpServer {
  id: string;
  slug: string;
  name: string;
  nameZh?: string;
  author?: string;
  description?: string;
  descriptionZh?: string;
  introZh?: string;
  category?: string;
  tags: string[];
  githubUrl?: string;
  npmPackage?: string;
  installCommand?: string;
  installConfig?: Record<string, unknown>;
  toolsCount: number;
  tools?: {
    name: string;
    description?: string;
    inputSchema?: Record<string, unknown>;
  }[];
  version?: string;
  stars: number;
  forksCount: number;
  weeklyDownloads: number;
  qualityScore?: number;
  qualityTier: "S" | "A" | "B" | "C";
  qualityReason?: string;
  editorCommentZh?: string;
  editorRating?: string;
  status: McpStatus;
  source?: McpSource;
  sourceUrl?: string;
  isVerified: boolean;
  isFeatured: boolean;
  isTrending: boolean;
  isArchived: boolean;
  weeklyStarsDelta: number;
  freshness: FreshnessLevel;
  pushedAt?: string;
  discoveredAt: string;
  lastSyncedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Submission {
  id: string;
  skillName: string;
  skillUrl: string;
  submitterEmail?: string;
  description?: string;
  isFastTrack: boolean;
  status: SubmissionStatus;
  createdAt: string;
}
