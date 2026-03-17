export const siteConfig = {
  name: "SkillNav",
  nameZh: "SkillNav - 中文开发者的 AI 智能体工具站",
  description:
    "中文开发者的 AI 智能体工具站 — Skills · MCP · 实战资讯，发现最好用的 AI Agent 工具。",
  url: "https://skillnav.dev",
  ogImage: "https://skillnav.dev/opengraph-image",
  links: {
    github: "https://github.com/skillnav-dev",
    twitter: "https://x.com/skillnav_dev",
  },
} as const;

export const navItems = [
  { title: "Skills", href: "/skills" },
  { title: "MCP", href: "/mcp" },
  { title: "周刊", href: "/weekly" },
  { title: "专栏", href: "/guides" },
  { title: "资讯", href: "/articles" },
  { title: "学习", href: "/learn" },
  { title: "关于", href: "/about" },
] as const;

export const footerLinks = {
  product: {
    title: "产品",
    links: [
      { title: "Skills 导航", href: "/skills" },
      { title: "MCP 导航", href: "/mcp" },
      { title: "专栏", href: "/guides" },
      { title: "资讯", href: "/articles" },
      { title: "学习中心", href: "/learn" },
    ],
  },
  community: {
    title: "社区",
    links: [
      { title: "GitHub", href: "https://github.com/skillnav-dev" },
      { title: "Twitter", href: "https://x.com/skillnav_dev" },
    ],
  },
} as const;
