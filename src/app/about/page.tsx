import type { Metadata } from "next";
import Link from "next/link";
import { siteConfig } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import {
  Github,
  Twitter,
  Mail,
  Rss,
  Newspaper,
  Sparkles,
  Layers,
  ShieldCheck,
  FileSearch,
  ArrowRight,
  RefreshCw,
  Terminal,
} from "lucide-react";

export const metadata: Metadata = {
  title: "关于",
  description:
    "SkillNav 是中文开发者的 AI 工具生态指南。精选信源、持续过滤、编辑策展，解决 AI 资讯碎片化问题。",
  alternates: {
    canonical: `${siteConfig.url}/about`,
  },
  openGraph: {
    title: "关于 SkillNav",
    description:
      "中文开发者的 AI 工具生态指南。精选信源、持续过滤、编辑策展，解决 AI 资讯碎片化问题。",
    url: `${siteConfig.url}/about`,
  },
};

// Pain points developers face
const painPoints = [
  {
    icon: Layers,
    title: "信息碎片化",
    description:
      "RSS、公众号、Twitter、Discord 散落各处，每天花大量时间刷信息，却很难形成有效的知识沉淀。",
  },
  {
    icon: FileSearch,
    title: "碎片不成体系",
    description:
      "一篇讲 MCP，一篇讲 Skills，一篇讲 Agent 框架，但没有人把它们的关系和演进脉络讲清楚。",
  },
  {
    icon: ShieldCheck,
    title: "标题党多，实战价值低",
    description:
      '"效率提升 10 倍" 的标题点进去是浅层介绍，没有可复现的操作步骤，更没有真实使用体验。',
  },
];

// How SkillNav solves these problems
const solutions = [
  {
    icon: Rss,
    title: "一手信源，持续优化",
    description:
      "直接对接 Anthropic、OpenAI、Google AI 等官方博客和顶级技术社区。信源池不断迭代——筛掉低质量源，引入新发现的高价值源，确保每一条都值得读。",
  },
  {
    icon: Sparkles,
    title: "编辑精选，不堆数量",
    description:
      "AI 工具目录动辄上万条，我们只收录经过筛选和分类的精品。每个 Skill 都有中文说明、安装指引和质量分级。",
  },
  {
    icon: Newspaper,
    title: "深度翻译，保留上下文",
    description:
      "不是机翻摘要，而是全文翻译并保留技术术语原文。代码块、链接、引用完整保留，方便直接上手实操。",
  },
];

// Data stats
const stats = [
  { icon: Sparkles, label: "精选 Skills", value: "168+" },
  { icon: Newspaper, label: "翻译资讯", value: "200+" },
  { icon: Rss, label: "一手信源", value: "14" },
  { icon: RefreshCw, label: "更新频率", value: "每日" },
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      {/* Hero */}
      <div className="relative py-8 sm:py-12">
        <div className="pointer-events-none absolute inset-0 -mx-4 rounded-2xl bg-gradient-to-b from-primary/5 via-transparent to-transparent sm:-mx-6" />
        <div className="relative mx-auto max-w-2xl text-center">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            关于 SkillNav
          </h1>
          <p className="mt-3 text-lg text-muted-foreground">
            中文开发者的 AI 工具生态指南 — 精选信源、持续过滤、编辑策展
          </p>
        </div>
      </div>

      {/* Pain points */}
      <section className="mt-12 rounded-xl bg-muted/30 px-4 py-8 sm:px-6">
        <h2 className="text-xl font-semibold tracking-tight">
          开发者面临的问题
        </h2>
        <p className="mt-2 text-muted-foreground">
          AI Agent
          工具生态正在爆发式增长，但中文开发者获取信息的体验并没有跟上。
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {painPoints.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="rounded-lg ring-1 ring-gray-950/10 dark:ring-gray-50/10 bg-card p-5"
            >
              <div className="inline-flex rounded-lg bg-destructive/10 p-2">
                <Icon className="size-5 text-destructive" />
              </div>
              <h3 className="mt-3 font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Our approach */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold tracking-tight">我们怎么做</h2>
        <p className="mt-2 text-muted-foreground">
          不做大而全的聚合站，做有编辑判断力的工具指南。
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {solutions.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="rounded-lg ring-1 ring-gray-950/10 dark:ring-gray-50/10 bg-card p-5"
            >
              <div className="inline-flex rounded-lg bg-primary/10 p-2">
                <Icon className="size-5 text-primary" />
              </div>
              <h3 className="mt-3 font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Content pipeline */}
      <section className="mt-12 space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">内容管线</h2>
        <div className="rounded-lg bg-gray-950/[0.025] dark:bg-gray-50/[0.025] p-6">
          <div className="flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-md bg-primary/10 px-2.5 py-1 font-medium text-primary">
              <Rss className="size-3.5" />
              14 个一手信源
            </span>
            <span className="hidden text-muted-foreground/50 sm:inline">→</span>
            <span className="inline-flex items-center gap-1.5 rounded-md bg-primary/10 px-2.5 py-1 font-medium text-primary">
              <RefreshCw className="size-3.5" />
              自动抓取与翻译
            </span>
            <span className="hidden text-muted-foreground/50 sm:inline">→</span>
            <span className="inline-flex items-center gap-1.5 rounded-md bg-primary/10 px-2.5 py-1 font-medium text-primary">
              <ShieldCheck className="size-3.5" />
              相关性过滤
            </span>
            <span className="hidden text-muted-foreground/50 sm:inline">→</span>
            <span className="inline-flex items-center gap-1.5 rounded-md bg-primary/10 px-2.5 py-1 font-medium text-primary">
              <Newspaper className="size-3.5" />
              每日发布
            </span>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            信源覆盖 Anthropic、OpenAI、Google AI、LangChain、GitHub
            等官方博客及 Latent Space
            等深度技术媒体。我们持续评估每个信源的信噪比，淘汰低质量源，引入新发现的高价值渠道，并通过关键词过滤自动排除与
            AI 工具生态无关的内容。
          </p>
        </div>
      </section>

      {/* Data overview */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold tracking-tight">数据概览</h2>
        <div className="mt-4 grid gap-4 grid-cols-2 sm:grid-cols-4">
          {stats.map(({ icon: Icon, label, value }) => (
            <div
              key={label}
              className="rounded-lg ring-1 ring-gray-950/10 dark:ring-gray-50/10 bg-card p-4 text-center"
            >
              <Icon className="mx-auto size-5 text-primary" />
              <p className="mt-2 text-2xl font-bold tracking-tight">{value}</p>
              <p className="text-sm text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Claude Code Skill */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold tracking-tight">
          在 Claude Code 中使用
        </h2>
        <p className="mt-2 text-muted-foreground">
          一行命令安装 SkillNav Skill，在编辑器中直接搜索
          MCP、阅读日报、发现热门工具。
        </p>
        <div className="mt-4 rounded-lg ring-1 ring-gray-950/10 dark:ring-gray-50/10 bg-card p-5">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Terminal className="size-4" />
            安装命令
          </div>
          <pre className="mt-3 overflow-x-auto rounded-md bg-gray-950 p-4 text-sm text-gray-100">
            <code>
              mkdir -p ~/.claude/skills/skillnav &amp;&amp; curl -sL
              https://raw.githubusercontent.com/skillnav-dev/skillnav-skill/main/SKILL.md
              -o ~/.claude/skills/skillnav/SKILL.md
            </code>
          </pre>
          <div className="mt-4 grid gap-2 text-sm sm:grid-cols-3">
            <div className="rounded-md bg-muted/50 px-3 py-2">
              <code className="text-primary">/skillnav brief</code>
              <span className="ml-2 text-muted-foreground">— 今日 AI 日报</span>
            </div>
            <div className="rounded-md bg-muted/50 px-3 py-2">
              <code className="text-primary">/skillnav mcp database</code>
              <span className="ml-2 text-muted-foreground">— 搜索 MCP</span>
            </div>
            <div className="rounded-md bg-muted/50 px-3 py-2">
              <code className="text-primary">/skillnav trending</code>
              <span className="ml-2 text-muted-foreground">— 热门工具</span>
            </div>
          </div>
        </div>
      </section>

      {/* CTA + Contact */}
      <section className="mt-12 rounded-2xl bg-primary/5 px-6 py-12 text-center sm:px-12">
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
          开始探索
        </h2>
        <p className="mt-3 text-muted-foreground">
          找到适合你的 AI 工具，或订阅周报获取每周精选。
        </p>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Button size="lg" className="w-full sm:w-auto" asChild>
            <Link href="/skills">
              浏览精选工具
              <ArrowRight className="ml-2 size-4" />
            </Link>
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="w-full sm:w-auto"
            asChild
          >
            <Link href="/articles">阅读资讯</Link>
          </Button>
        </div>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
          <a
            href={siteConfig.links.github}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 hover:text-foreground"
          >
            <Github className="size-4" />
            skillnav-dev
          </a>
          <a
            href={siteConfig.links.twitter}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 hover:text-foreground"
          >
            <Twitter className="size-4" />
            @skillnav_dev
          </a>
          <a
            href="mailto:hello@skillnav.dev"
            className="inline-flex items-center gap-1.5 hover:text-foreground"
          >
            <Mail className="size-4" />
            hello@skillnav.dev
          </a>
        </div>
      </section>
    </div>
  );
}
