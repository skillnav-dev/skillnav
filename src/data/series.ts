/**
 * Static series metadata. Kept in code (not DB) because series are few
 * and change rarely. Add a new entry when curating a new external series.
 */

export interface Chapter {
  title: string;
  titleZh: string;
  /** Inclusive range of series_number values in this chapter */
  range: [number, number];
}

export interface SeriesMeta {
  title: string;
  titleZh: string;
  sourceUrl?: string;
  author?: string;
  description?: string;
  descriptionZh?: string;
  /** Ordered chapter groups for the landing page TOC */
  chapters?: Chapter[];
  /** Whether this series appears on /guides (false for weekly) */
  isGuide?: boolean;
}

export const SERIES_META: Record<string, SeriesMeta> = {
  weekly: {
    title: "SkillNav Weekly",
    titleZh: "SkillNav 周刊",
  },
  "agentic-engineering-patterns": {
    title: "Agentic Engineering Patterns",
    titleZh: "Agentic Engineering 实战模式",
    sourceUrl: "https://simonwillison.net/guides/agentic-engineering-patterns/",
    author: "Simon Willison",
    description:
      "A practical guide to building effective AI coding agents — from principles to testing to prompt engineering.",
    descriptionZh:
      "构建高效 AI 编程智能体的实战指南——从核心原则到测试策略再到提示工程，12 篇系统化深度解读。",
    isGuide: true,
    chapters: [
      {
        title: "Principles",
        titleZh: "核心原则",
        range: [1, 5],
      },
      {
        title: "Testing & QA",
        titleZh: "测试与质量保障",
        range: [6, 8],
      },
      {
        title: "Understanding Code",
        titleZh: "理解代码",
        range: [9, 10],
      },
      {
        title: "Annotated Prompts",
        titleZh: "提示工程实战",
        range: [11, 11],
      },
      {
        title: "Appendix",
        titleZh: "附录",
        range: [12, 12],
      },
    ],
  },
};

/** Get all series that should appear on /guides */
export function getGuideSeries(): (SeriesMeta & { slug: string })[] {
  return Object.entries(SERIES_META)
    .filter(([, meta]) => meta.isGuide)
    .map(([slug, meta]) => ({ slug, ...meta }));
}
