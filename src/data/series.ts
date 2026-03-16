/**
 * Static series metadata. Kept in code (not DB) because series are few
 * and change rarely. Add a new entry when curating a new external series.
 */
export interface SeriesMeta {
  title: string;
  titleZh: string;
  sourceUrl?: string;
  author?: string;
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
  },
};
