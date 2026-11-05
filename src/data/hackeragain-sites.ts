export type HackerAgainCategory =
  | "视频"
  | "书"
  | "论文"
  | "电影"
  | "游戏"
  | "工具"
  | "产品"
  | "播客"
  | "维基"
  | "目录"
  | "评测"
  | "博客"
  | "代码库";

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
  "游戏",
  "工具",
  "产品",
  "播客",
  "维基",
  "目录",
  "评测",
  "博客",
  "代码库",
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
 * HN 灵感站外链导航数据。
 * Keep entries grouped by category so the "全部" view reads in category order.
 */
export const hackerAgainSites: HackerAgainSite[] = [
  {
    slug: "hackertube",
    nameZh: "HackerTube",
    nameEn: "HackerTube",
    blurbZh: "Hacker News 相关的技术与黑客向视频合集，适合随便刷一刷。",
    category: "视频",
    language: "en",
    url: "https://hackertube.org",
    licenseNote: "若引用其开放数据，请遵循 ODC-By 并注明出处。",
    status: "online",
  },
  {
    slug: "hackertv",
    nameZh: "HackerTV",
    nameEn: "HackerTV",
    blurbZh: "把 HN 上反复被推荐的 YouTube 视频排成 24 小时不停播的主题频道，打开就能看（数据来自 HackerTube）。",
    category: "视频",
    language: "en",
    url: "https://hackertv.org",
    status: "online",
  },
  {
    slug: "showreel-hn",
    nameZh: "Showreel HN",
    nameEn: "Showreel HN",
    blurbZh: "Show HN 作品与演示视频，卷轴式浏览。",
    category: "视频",
    language: "en",
    url: "https://showreel-hn.netlify.app",
    status: "online",
  },
  {
    slug: "hackerbooks",
    nameZh: "HackerBooks",
    nameEn: "HackerBooks",
    blurbZh: "HN 上常被提起的技术书与阅读清单。",
    category: "书",
    language: "en",
    url: "https://hackerbooks.org",
    status: "online",
  },
  {
    slug: "qiaomu-hacker-books",
    nameZh: "乔木黑客书架",
    nameEn: "Qiaomu Hacker Books",
    blurbZh: "中文书讯与书架导航，帮你发现值得读的书。",
    category: "书",
    language: "zh",
    url: "https://hackerbooks.qiaomu.ai",
    complianceNote:
      "仅链官方站点，提供公开书讯与正规购买信息，不含盗版资源。",
    status: "online",
  },
  {
    slug: "dair-hacker-papers",
    nameZh: "DAIR 黑客论文集",
    nameEn: "DAIR Hacker Papers",
    blurbZh: "DAIR.AI 整理的黑客向论文合集，方便按主题逛。",
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
    slug: "hackerpapers",
    nameZh: "HackerPapers",
    nameEn: "HackerPapers",
    blurbZh: "英文原版论文站：arXiv 论文按 HN 评论者排序，可回看原讨论。",
    category: "论文",
    language: "en",
    url: "https://hackerpaper.kaipfister.de",
    status: "online",
  },
  {
    slug: "hnmovies",
    nameZh: "HNMovies",
    nameEn: "HNMovies",
    blurbZh: "HN 圈常聊的电影与片单，另有 MCP 与开放数据包。",
    category: "电影",
    language: "en",
    url: "https://hnmovies.org",
    hasMcp: true,
    hasDataset: true,
    status: "online",
  },
  {
    slug: "hackergames",
    nameZh: "HackerGames",
    nameEn: "HackerGames",
    blurbZh: "收录 2006–2026 年 HN 讨论过的游戏。",
    category: "游戏",
    language: "en",
    url: "https://architrixs.github.io/HackerGames/",
    status: "online",
  },
  {
    slug: "hackertools",
    nameZh: "HackerTools",
    nameEn: "HackerTools",
    blurbZh: "实用开发与效率工具目录，按需挑着用。",
    category: "工具",
    language: "en",
    url: "https://shouvik12.github.io/hackertools",
    status: "online",
  },
  {
    slug: "hackerproducts",
    nameZh: "HackerProducts",
    nameEn: "HackerProducts",
    blurbZh: "Show HN 与产品向作品目录，看看大家在做什么。",
    category: "产品",
    language: "en",
    url: "https://hackerproducts.pages.dev",
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
    slug: "wikihack",
    nameZh: "Wikihack",
    nameEn: "Wikihack",
    blurbZh: "HN 灵感主题的维基知识库；主站打不开时可试备链。",
    category: "维基",
    language: "en",
    url: "https://wikihack.org",
    secondaryUrl: "https://wikihack.netlify.app",
    status: "online",
  },
  {
    slug: "hackeragain",
    nameZh: "HackerAgain",
    nameEn: "HackerAgain",
    blurbZh: "英文原版导航目录，也是本页的灵感来源。",
    category: "目录",
    language: "en",
    url: "https://hackeragain.com",
    status: "online",
  },
  {
    slug: "hackerhype",
    nameZh: "HackerHype",
    nameEn: "HackerHype",
    blurbZh: "HN 灵感站相关的热度与目录索引。",
    category: "目录",
    language: "en",
    url: "https://epestr.com/hackerhype",
    status: "online",
  },
  {
    slug: "hackereverything",
    nameZh: "HackerEverything",
    nameEn: "HackerEverything",
    blurbZh: "综合类导航：把 HN 评论里反复推荐的书、演讲、论文、代码库和工具按主题打标签。",
    category: "目录",
    language: "en",
    url: "https://hackereverything.pages.dev/",
    status: "online",
  },
  {
    slug: "trustmebro",
    nameZh: "Trust Me Bro",
    nameEn: "Trust Me Bro",
    blurbZh: "社区风格的产品与工具评测、推荐。",
    category: "评测",
    language: "en",
    url: "https://trustmebro.reviews",
    status: "online",
  },
  {
    slug: "hackerblogs",
    nameZh: "HackerBlogs",
    nameEn: "Hacker Blogs",
    blurbZh: "HN 上常被链接的个人和公司博客合集，可看热门文章，还能导出 OPML 订阅。",
    category: "博客",
    language: "en",
    url: "https://hackerblogs.org",
    status: "online",
  },
  {
    slug: "hnrepos",
    nameZh: "hnrepos",
    nameEn: "hnrepos",
    blurbZh: "收录 HN 讨论里提到的代码仓库，可按主题浏览，并回看原始讨论。",
    category: "代码库",
    language: "en",
    url: "https://hnrepos.com",
    status: "online",
  },
];

export const HACKERAGAIN_REFERENCE = {
  titleZh: "V2EX：大家在聊哪些 HN 灵感站",
  url: "https://www.v2ex.com/t/1253963",
} as const;
