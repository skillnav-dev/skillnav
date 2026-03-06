export const siteConfig = {
  name: "SkillNav",
  nameZh: "SkillNav - 中文开发者的 AI 智能体工具站",
  description:
    "中文开发者的 AI 智能体工具站 — Skills · MCP · 实战资讯，发现最好用的 AI Agent 工具。",
  url: "https://skillnav.dev",
  ogImage: "https://skillnav.dev/og.png",
  links: {
    github: "https://github.com/skillnav-dev",
    twitter: "https://x.com/skillnav_dev",
  },
} as const;

export const navItems = [
  { title: "首页", href: "/" },
  { title: "Skills", href: "/skills" },
  { title: "MCP", href: "/mcp" },
  { title: "资讯", href: "/articles" },
  { title: "关于", href: "/about" },
] as const;

export const footerLinks = {
  product: {
    title: "产品",
    links: [
      { title: "Skills 导航", href: "/skills" },
      { title: "MCP 导航", href: "/mcp" },
      { title: "资讯", href: "/articles" },
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
