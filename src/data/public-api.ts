/**
 * Public query API reference (GET /api/skill/query). Single source for the
 * /docs/api page and the API section of /llms.txt, so docs and the
 * SkillNav Skill (skills/skillnav/SKILL.md) stay in sync with the route.
 */

export const API_ENDPOINT = "https://skillnav.dev/api/skill/query";

export interface ApiParam {
  name: string;
  required: boolean;
  zh: string;
  en: string;
}

export interface ApiType {
  type: "search" | "mcp" | "trending" | "brief" | "paper";
  zh: string;
  en: string;
  params: ApiParam[];
  /** Key response fields of each result. */
  fields: string[];
  example: string;
}

const LIMIT: ApiParam = {
  name: "limit",
  required: false,
  zh: "返回条数，1–20，默认 5",
  en: "Max results, 1–20, default 5",
};

export const API_TYPES: ApiType[] = [
  {
    type: "search",
    zh: "全站搜索：概念、MCP、Skills、文章，按此顺序合并",
    en: "Site-wide search across concepts, MCP servers, Skills and articles (merged in that order)",
    params: [
      { name: "q", required: true, zh: "关键词，中英文均可，最长 100 字符", en: "Keyword (Chinese or English), max 100 chars" },
      LIMIT,
    ],
    fields: ["result_type (concept | mcp | skill | article)", "name / name_zh / title_zh", "description_zh / summary_zh / one_liner", "editor_comment_zh", "stars", "install_command", "url"],
    example: `${API_ENDPOINT}?type=search&q=数据库`,
  },
  {
    type: "mcp",
    zh: "搜索 MCP Server（全文检索，无结果时回退模糊匹配）",
    en: "Search MCP servers (full-text, falls back to substring match)",
    params: [
      { name: "q", required: true, zh: "关键词", en: "Keyword" },
      LIMIT,
    ],
    fields: ["name", "name_zh", "description_zh", "category", "editor_comment_zh", "stars", "install_command", "github_url", "url"],
    example: `${API_ENDPOINT}?type=mcp&q=github`,
  },
  {
    type: "trending",
    zh: "近 7 天热门工具（Skills + MCP）",
    en: "Trending tools of the last 7 days (Skills + MCP)",
    params: [LIMIT],
    fields: ["period", "last_updated", "tools[]"],
    example: `${API_ENDPOINT}?type=trending&limit=10`,
  },
  {
    type: "brief",
    zh: "最新一期 AI 日报（结构化）",
    en: "Latest daily AI brief, structured",
    params: [
      { name: "section", required: false, zh: "只取某一栏：news / papers / tools", en: "One section only: news / papers / tools" },
    ],
    fields: ["date", "headline", "highlights[]", "papers[]", "tools[]", "url", "is_fallback"],
    example: `${API_ENDPOINT}?type=brief&section=tools`,
  },
  {
    type: "paper",
    zh: "论文：按 arXiv ID 查中文导读 / 译文，或按关键词搜近 7 天日报里的论文",
    en: "Papers: look up an arXiv ID for Chinese notes / translation, or search papers in the last 7 days of briefs",
    params: [
      { name: "id", required: false, zh: "arXiv ID，如 2603.23483（与 q 二选一）", en: "arXiv ID such as 2603.23483 (id or q)" },
      { name: "q", required: false, zh: "关键词（与 id 二选一）", en: "Keyword (id or q)" },
      LIMIT,
    ],
    fields: ["has_translation", "brief_card", "translation", "arxiv_url"],
    example: `${API_ENDPOINT}?type=paper&id=2603.23483`,
  },
];

export const API_NOTES = {
  zh: [
    "无需密钥，只读，只返回已上架（精选）条目。",
    "支持跨域（CORS: *），响应在边缘缓存 5 分钟。",
    "每个成功响应带 meta.skill_version，供 SkillNav Skill 检查更新。",
    "出错时返回 { error, message, fallback }，HTTP 状态码 400 / 404 / 500。",
    "请合理调用；高频批量抓取请改用 /sitemap.xml 或联系我们。",
  ],
  en: [
    "No key required, read-only, returns published (curated) entries only.",
    "CORS enabled (*); responses are edge-cached for 5 minutes.",
    "Successful responses include meta.skill_version for the SkillNav Skill.",
    "Errors return { error, message, fallback } with HTTP 400 / 404 / 500.",
    "Please be gentle; for bulk crawling use /sitemap.xml or contact us.",
  ],
};

/** Plain-text API section for /llms.txt. */
export function apiReferenceText(): string {
  const lines = [
    "## Public API",
    "",
    `GET ${API_ENDPOINT}?type=<type>&...  (docs: https://skillnav.dev/docs/api)`,
    "",
    ...API_NOTES.en.map((n) => `- ${n}`),
    "",
  ];
  for (const t of API_TYPES) {
    lines.push(`### type=${t.type}`, "", t.en, "");
    for (const p of t.params) {
      lines.push(`- ${p.name}${p.required ? " (required)" : ""}: ${p.en}`);
    }
    lines.push(`- Fields: ${t.fields.join(", ")}`, `- Example: ${t.example}`, "");
  }
  return lines.join("\n");
}
