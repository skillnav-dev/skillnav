import type { Metadata } from "next";
import { siteConfig } from "@/lib/constants";
import { Github, Twitter, Mail, Rss, Newspaper, Sparkles } from "lucide-react";

export const metadata: Metadata = {
  title: "关于",
  description:
    "SkillNav 是中文世界的 AI Agent Skills 导航与资讯平台，帮助开发者发现和使用最好的 AI 工具。",
  openGraph: {
    title: "关于 SkillNav",
    description:
      "中文世界的 AI Agent Skills 导航与资讯平台，帮助开发者发现和使用最好的 AI 工具。",
    url: `${siteConfig.url}/about`,
  },
};

// Quick stats for the data overview section
const stats = [
  { icon: Sparkles, label: "精选 Skills", value: "168+" },
  { icon: Newspaper, label: "资讯文章", value: "270+" },
  { icon: Rss, label: "RSS 源持续同步", value: "13" },
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      {/* Hero */}
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
        关于 SkillNav
      </h1>
      <p className="mt-3 text-lg text-muted-foreground">
        中文世界的 AI Agent Skills 导航与资讯平台
      </p>

      {/* What is SkillNav */}
      <section className="mt-12 space-y-4">
        <h2 className="text-xl font-semibold">项目介绍</h2>
        <p className="leading-relaxed text-muted-foreground">
          SkillNav 帮助中文开发者发现和使用 AI Agent Skills、MCP Server
          等智能工具。
        </p>
        <ul className="list-inside list-disc space-y-2 text-muted-foreground">
          <li>
            精选收录跨平台 AI Skills（Claude Code / Codex /
            Cursor），提供中文搜索和分类导航
          </li>
          <li>翻译聚合全球 AI 工具生态资讯，每日自动更新</li>
          <li>提供安装指引和使用说明，降低上手门槛</li>
        </ul>
      </section>

      {/* Why SkillNav */}
      <section className="mt-12 space-y-4">
        <h2 className="text-xl font-semibold">为什么做 SkillNav</h2>
        <p className="leading-relaxed text-muted-foreground">
          AI Agent
          工具生态正在爆发式增长，但中文世界缺乏系统性的导航和评测资源。开发者往往需要在英文文档和分散的信息源中反复跳转，才能找到适合自己的工具。
        </p>
        <p className="leading-relaxed text-muted-foreground">
          我们相信好工具不应该被语言壁垒阻隔。SkillNav 希望成为中文开发者探索 AI
          工具生态的起点。
        </p>
      </section>

      {/* Data overview */}
      <section className="mt-12">
        <h2 className="text-xl font-semibold">数据概览</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {stats.map(({ icon: Icon, label, value }) => (
            <div
              key={label}
              className="rounded-lg border bg-card p-4 text-center"
            >
              <Icon className="mx-auto size-5 text-primary" />
              <p className="mt-2 text-2xl font-bold">{value}</p>
              <p className="text-sm text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Contact */}
      <section className="mt-12 space-y-4">
        <h2 className="text-xl font-semibold">联系我们</h2>
        <ul className="space-y-3 text-muted-foreground">
          <li className="flex items-center gap-2">
            <Github className="size-4" />
            <a
              href={siteConfig.links.github}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              skillnav-dev
            </a>
          </li>
          <li className="flex items-center gap-2">
            <Twitter className="size-4" />
            <a
              href={siteConfig.links.twitter}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              @skillnav_dev
            </a>
          </li>
          <li className="flex items-center gap-2">
            <Mail className="size-4" />
            <a
              href="mailto:hello@skillnav.dev"
              className="text-primary hover:underline"
            >
              hello@skillnav.dev
            </a>
          </li>
        </ul>
      </section>
    </div>
  );
}
