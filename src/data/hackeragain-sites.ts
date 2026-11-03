export type HackerAgainCategory =
  | "视频"
  | "书"
  | "论文"
  | "电影"
  | "工具"
  | "产品"
  | "播客"
  | "Wiki"
  | "元目录"
  | "评测";

export type HackerAgainLanguage = "zh" | "en" | "mixed";

export interface HackerAgainSite {
  slug: string;
  nameZh: string;
  nameEn?: string;
  blurbZh: string;
  category: HackerAgainCategory;
  language: HackerAgainLanguage;
  url: string;
  secondaryUrl?: string;
  hasMcp?: boolean;
  hasDataset?: boolean;
  licenseNote?: string;
  complianceNote?: string;
  status?: "online" | "unverified";
}

export const HACKERAGAIN_CATEGORIES = [
  "全部",
  "视频",
  "书",
  "论文",
  "电影",
  "工具",
  "产品",
  "播客",
  "Wiki",
  "元目录",
  "评测",
] as const;

export type HackerAgainCategoryFilter =
  (typeof HACKERAGAIN_CATEGORIES)[number];

const LANGUAGE_LABEL: Record<HackerAgainLanguage, string> = {
  zh: "中文",
  en: "英文",
  mixed: "中英",
};

export function hackerAgainLanguageLabel(
  language: HackerAgainLanguage,
): string {
  return LANGUAGE_LABEL[language];
}

/**
 * HN 灵感站外链目录（SkillNav 自编中文简介）。
 * 只做导航，不镜像第三方整站或数据包。
 * Karpathy 原博 karpathy.bearblog.dev/hacker-tube/ 抽查 404，不单列卡片。
 */
export const hackerAgainSites: HackerAgainSite[] = [
  {
    slug: "hackertube",
    nameZh: "HackerTube",
    nameEn: "HackerTube",
    blurbZh:
      "HN 灵感视频合集站。原 Karpathy 博文链暂 404，以本站为准；若引用其开放数据请遵循 ODC-By 并链回原作。",
    category: "视频",
    language: "en",
    url: "https://hackertube.org",
    licenseNote:
      "数据引用须 ODC-By 并链回原作；本页仅外链，不镜像数据集。",
    status: "online",
  },
  {
    slug: "hackerbooks",
    nameZh: "HackerBooks",
    nameEn: "HackerBooks",
    blurbZh: "HN 社区常推技术书与阅读清单的导航站。",
    category: "书",
    language: "en",
    url: "https://hackerbooks.org",
    status: "online",
  },
  {
    slug: "dair-hacker-papers",
    nameZh: "DAIR 黑客论文集",
    nameEn: "DAIR Hacker Papers",
    blurbZh: "DAIR.AI 整理的 Hacker Papers 论文合集入口。",
    category: "论文",
    language: "en",
    url: "https://academy.dair.ai/papers/collections/hacker-papers",
    status: "online",
  },
  {
    slug: "qiaomu-hacker-papers",
    nameZh: "乔木黑客论文",
    nameEn: "Qiaomu Hacker Papers",
    blurbZh: "面向中文读者的 HN / 黑客圈论文精选与导读。",
    category: "论文",
    language: "zh",
    url: "https://hackerpapers.qiaomu.ai",
    status: "online",
  },
  {
    slug: "qiaomu-hacker-books",
    nameZh: "乔木黑客书架",
    nameEn: "Qiaomu Hacker Books",
    blurbZh: "中文书讯与书架导航；仅链官方站，不做资源镜像。",
    category: "书",
    language: "zh",
    url: "https://hackerbooks.qiaomu.ai",
    complianceNote:
      "仅链官方 hackerbooks.qiaomu.ai；收录公开书讯与合法购买信息，非盗版网盘或搜索入口。切勿链 zlib 等盗版源。",
    status: "online",
  },
  {
    slug: "hnmovies",
    nameZh: "HNMovies",
    nameEn: "HNMovies",
    blurbZh:
      "HN 相关电影/片单站；提供 MCP 与 Hugging Face 数据包，便于 Agent 检索。",
    category: "电影",
    language: "en",
    url: "https://hnmovies.org",
    hasMcp: true,
    hasDataset: true,
    status: "online",
  },
  {
    slug: "showreel-hn",
    nameZh: "Showreel HN",
    nameEn: "Showreel HN",
    blurbZh: "Show HN 与演示类视频/作品卷轴式浏览。",
    category: "视频",
    language: "en",
    url: "https://showreel-hn.netlify.app",
    status: "online",
  },
  {
    slug: "wikihack",
    nameZh: "Wikihack",
    nameEn: "Wikihack",
    blurbZh: "HN 灵感维基式知识库；主站不可用时可试 Netlify 备链。",
    category: "Wiki",
    language: "en",
    url: "https://wikihack.org",
    secondaryUrl: "https://wikihack.netlify.app",
    status: "online",
  },
  {
    slug: "hackertools",
    nameZh: "HackerTools",
    nameEn: "HackerTools",
    blurbZh: "开发者工具目录；站点提供 tools.json 便于机器读取。",
    category: "工具",
    language: "en",
    url: "https://shouvik12.github.io/hackertools",
    status: "online",
  },
  {
    slug: "hackerproducts",
    nameZh: "HackerProducts",
    nameEn: "HackerProducts",
    blurbZh: "HN 产品与 Show HN 产物向的目录站。",
    category: "产品",
    language: "en",
    url: "https://hackerproducts.pages.dev",
    status: "online",
  },
  {
    slug: "trustmebro",
    nameZh: "Trust Me Bro",
    nameEn: "Trust Me Bro",
    blurbZh: "产品与工具的社区式评测 / 「信我」式推荐站。",
    category: "评测",
    language: "en",
    url: "https://trustmebro.reviews",
    status: "online",
  },
  {
    slug: "hackerpodcasts",
    nameZh: "HackerPodcasts",
    nameEn: "HackerPodcasts",
    blurbZh: "HN 与黑客圈相关播客导航。",
    category: "播客",
    language: "en",
    url: "https://hackerpodcasts.org",
    status: "online",
  },
  {
    slug: "hackeragain",
    nameZh: "HackerAgain",
    nameEn: "HackerAgain",
    blurbZh: "英文原版「索引的索引」——本页的灵感来源与元目录。",
    category: "元目录",
    language: "en",
    url: "https://hackeragain.com",
    status: "online",
  },
  {
    slug: "hackerhype",
    nameZh: "HackerHype",
    nameEn: "HackerHype",
    blurbZh: "与 HN 灵感站生态相关的元目录 / 热度向索引。",
    category: "元目录",
    language: "en",
    url: "https://epestr.com/hackerhype",
    status: "online",
  },
];

export const HACKERAGAIN_REFERENCE = {
  titleZh: "V2EX：HN 灵感站讨论帖",
  url: "https://www.v2ex.com/t/1253963",
} as const;
