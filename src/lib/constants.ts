export const siteConfig = {
  name: "SkillNav",
  nameZh: "SkillNav - AI Agent Skills 导航",
  description:
    "中文世界的 AI Agent Skills 导航站，发现、评估和管理最好用的 AI Skills。",
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
  { title: "资讯", href: "/articles" },
  { title: "关于", href: "/about" },
] as const;

export const footerLinks = {
  product: {
    title: "产品",
    links: [
      { title: "Skills 导航", href: "/skills" },
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
