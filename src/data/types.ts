export type SecurityScore = "safe" | "warning" | "danger" | "unscanned";

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
  stars: number;
  downloads: number;
  securityScore: SecurityScore;
  clawhubUrl?: string;
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
  category: "news" | "tutorial" | "analysis" | "release";
  coverImage?: string;
  readingTime: number;
  publishedAt: string;
  createdAt: string;
}
