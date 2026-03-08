import type { ArticleType } from "@/data/types";

// Unified Chinese labels for article types
export const ARTICLE_TYPE_LABELS: Record<ArticleType, string> = {
  tutorial: "教程",
  analysis: "深度",
  guide: "指南",
};

// Badge color classes for article types
export const ARTICLE_TYPE_COLORS: Record<ArticleType, string> = {
  tutorial:
    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  analysis:
    "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  guide:
    "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
};

// Source display labels
export const ARTICLE_SOURCE_LABELS: Record<string, string> = {
  anthropic: "Anthropic",
  openai: "OpenAI",
  github: "GitHub",
  langchain: "LangChain",
  huggingface: "Hugging Face",
  crewai: "CrewAI",
  simonw: "Simon Willison",
  "latent-space": "Latent Space",
  "ai-coding-daily": "AI Coding Daily",
  thenewstack: "The New Stack",
  manual: "SkillNav 原创",
  other: "其他",
};
