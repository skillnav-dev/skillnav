export type SecurityScore = "safe" | "warning" | "danger" | "unscanned";
export type SkillSource =
  | "clawhub"
  | "skills_sh"
  | "anthropic"
  | "skillsmp"
  | "agentskill"
  | "manual";
export type PricingType = "free" | "freemium" | "paid";
export type ArticleType =
  | "news"
  | "tutorial"
  | "analysis"
  | "release"
  | "review"
  | "comparison"
  | "weekly";
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
  sourceUrl?: string;
  category: ArticleType;
  coverImage?: string;
  readingTime: number;
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
