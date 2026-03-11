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
  | "manual"
  | "other";
export type ContentTier = "editorial" | "translated";
export type ArticleSeries = "weekly" | "monthly-roundup";
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
  qualityTier?: "A" | "B" | "C";
  isHidden?: boolean;
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
