/**
 * Starter packs (issue #27): themed sets of 4–6 published Skills / MCP
 * servers with a short Chinese walkthrough. Unpublished slugs are dropped at
 * render time by resolvePublishedTools().
 */

import type { ToolRef } from "@/lib/data/collections";

export interface PackStep {
  title: string;
  body: string;
  /** Prompt to paste into the agent after installing. */
  prompt?: string;
}

export interface Pack {
  slug: string;
  title: string;
  /** Who it is for, one line. */
  audience: string;
  summary: string;
  items: ToolRef[];
  steps: PackStep[];
}

const skill = (slug: string): ToolRef => ({ type: "skill", slug });
const mcp = (slug: string): ToolRef => ({ type: "mcp", slug });

export const PACKS: Pack[] = [
  {
    slug: "frontend",
    title: "前端开发装机包",
    audience: "用 React / Next.js 写页面的前端开发者",
    summary:
      "查最新文档、照规范写组件、打开浏览器自测，一套装齐，让 Agent 写的页面能直接用。",
    items: [
      mcp("context7"),
      skill("anthropic--frontend-design"),
      skill("vercel-labs--next-skills"),
      mcp("microsoft--playwright-mcp"),
      mcp("io-github-chromedevtools--chrome-devtools-mcp"),
    ],
    steps: [
      {
        title: "先让它查文档再动手",
        body: "Context7 会按你项目里的版本拉取官方文档。提问时带上「use context7」，可以避免它写出过时的 API。",
        prompt: "use context7：用 Next.js App Router 写一个带分页的文章列表页",
      },
      {
        title: "用设计技能提高页面质感",
        body: "frontend-design 会约束排版、配色和动效。直接描述页面的气质，比列需求清单效果更好。",
        prompt: "做一个开发者工具的落地页，风格克制、偏编辑感，不要渐变紫",
      },
      {
        title: "让它自己打开浏览器验证",
        body: "写完后让 Agent 用 Playwright 打开页面走一遍关键路径。报错时再用 Chrome DevTools 看控制台和网络请求。",
        prompt:
          "启动 dev server，用 Playwright 打开 /articles，点到第 2 页，截图并检查控制台有没有报错",
      },
    ],
  },
  {
    slug: "saas",
    title: "全栈 SaaS 装机包",
    audience: "独立开发者、要上线付费产品的小团队",
    summary:
      "数据库、登录、支付、邮件、报错监控，五件事各配一个官方技能或 MCP，照着最佳实践搭。",
    items: [
      skill("supabase--agent-skills"),
      mcp("supabase"),
      skill("better-auth--skills"),
      skill("stripe--ai"),
      skill("resend--resend-skills"),
      mcp("sentry"),
    ],
    steps: [
      {
        title: "先把表和权限建对",
        body: "Supabase 技能会按官方建议写 RLS 策略，Supabase MCP 可以直接在你的项目里执行迁移。建议先连开发项目，不要直接连生产库。",
        prompt:
          "为团队协作 SaaS 设计 teams、members、projects 三张表，写好 RLS，只允许成员访问自己团队的数据",
      },
      {
        title: "登录和支付照官方写法接",
        body: "鉴权和支付最容易出安全问题。先让 Agent 按技能里的检查清单出方案，你确认后再写代码。",
        prompt:
          "用 Better Auth 加邮箱登录，再用 Stripe Checkout 做按月订阅，先给出方案和要改的文件",
      },
      {
        title: "上线后让它看报错",
        body: "Sentry MCP 能读取线上 issue 和堆栈。把链接丢给 Agent，让它定位代码并给出修复。",
        prompt:
          "看一下 Sentry 里最近 24 小时出现次数最多的错误，找到对应代码并修复",
      },
    ],
  },
  {
    slug: "data",
    title: "数据分析装机包",
    audience: "要从数据库和表格里取数、出图的分析师和运营",
    summary:
      "连上数据库直接用中文提问，结果导出成 Excel 或图表，不用来回复制粘贴。",
    items: [
      mcp("io-github-bytebase--dbhub"),
      mcp("io-github-motherduckdb--mcp-server-motherduck"),
      mcp("io-github-antvis--mcp-server-chart"),
      skill("anthropic--xlsx"),
      skill("anthropic--pdf"),
    ],
    steps: [
      {
        title: "用只读账号连数据库",
        body: "DBHub 支持 Postgres、MySQL、SQLite 等。给它配只读账号，Agent 写错 SQL 也不会改坏数据。本地的 CSV 和 Parquet 用 MotherDuck（DuckDB）直接查。",
        prompt: "看看库里有哪些表，按月统计过去一年的新增用户数",
      },
      {
        title: "让它出图",
        body: "AntV Chart MCP 会把结果画成折线图、柱状图等，返回图片链接，可以直接贴进周报。",
        prompt: "把上面的月度新增画成折线图，标出环比增长最高的月份",
      },
      {
        title: "整理成表格或读取报告",
        body: "xlsx 技能能生成带公式和格式的 Excel；pdf 技能能从 PDF 报表里抽取表格。",
        prompt:
          "把结果做成 Excel，第二个 sheet 放环比公式；再从 report.pdf 里提取第 3 页的表格",
      },
    ],
  },
  {
    slug: "devops",
    title: "运维排障装机包",
    audience: "管 Kubernetes、云资源和监控的运维与 SRE",
    summary: "查集群、看指标、写 Terraform 都在对话里完成，适合值班排障。",
    items: [
      mcp("io-github-containers--kubernetes-mcp-server"),
      mcp("io-github-grafana--mcp-grafana"),
      mcp("io-github-pab1it0--prometheus-mcp-server"),
      mcp("io-github-hashicorp--terraform-mcp-server"),
      skill("hashicorp--agent-skills"),
    ],
    steps: [
      {
        title: "先只读，再放开写权限",
        body: "Kubernetes MCP 支持只读模式。排障阶段用只读的 kubeconfig，需要改资源时再切换，并逐条确认 Agent 要执行的命令。",
        prompt: "default 命名空间里哪些 Pod 在重启？看看最近的日志，找出原因",
      },
      {
        title: "把指标和告警串起来",
        body: "Grafana MCP 可以读取仪表盘和告警，Prometheus MCP 可以直接跑 PromQL，让 Agent 对照着时间线分析。",
        prompt:
          "过去 1 小时 API 延迟 P99 是多少？和 Grafana 里正在触发的告警对一下",
      },
      {
        title: "改基础设施走 Terraform",
        body: "Terraform MCP 会查询 Provider 的最新文档，hashicorp 技能会约束代码风格。生成后先 plan，再由你来 apply。",
        prompt:
          "用 Terraform 给这个服务加一个 Cloudflare DNS 记录，先给出 plan 的预期变更",
      },
    ],
  },
  {
    slug: "content",
    title: "内容创作装机包",
    audience: "写公众号、做 SEO 和营销文案的内容团队",
    summary: "从找资料、写初稿到去 AI 腔、做 SEO，一条流水线装齐。",
    items: [
      mcp("exa"),
      mcp("io-github-firecrawl--firecrawl-mcp-server"),
      skill("coreyhaines31--marketingskills"),
      skill("agricidaniel--claude-seo"),
      skill("blader--humanizer"),
    ],
    steps: [
      {
        title: "先找素材",
        body: "Exa 按语义搜索资料和案例，Firecrawl 把网页抓成干净的 Markdown。两者都需要各自的 API Key。",
        prompt:
          "找 5 篇近半年讲 AI 编程工具选型的高质量英文文章，抓取正文并列出要点",
      },
      {
        title: "按营销框架写初稿",
        body: "marketingskills 里有落地页、邮件、A/B 文案等模板，先说清楚受众和目标再让它写。",
        prompt:
          "面向中文独立开发者，写一篇介绍我们产品的公众号文章，目标是引导注册试用",
      },
      {
        title: "去 AI 腔 + SEO 检查",
        body: "humanizer 会去掉套话和排比，claude-seo 会检查标题、关键词和结构，最后再自己通读一遍。",
        prompt:
          "把这篇文章去掉 AI 腔，再按「AI 编程工具」这个关键词做一次 SEO 检查",
      },
    ],
  },
  {
    slug: "research",
    title: "论文研究装机包",
    audience: "读论文、做调研的研究生和算法工程师",
    summary: "搜论文、管文献、追热点，一站完成，适合写综述和技术调研。",
    items: [
      mcp("io-github-blazickjp--arxiv-mcp-server"),
      mcp("io-github-54yyyu--zotero-mcp"),
      mcp("fetch"),
      skill("mvanhorn--last30days-skill"),
      skill("k-dense-ai--scientific-agent-skills"),
    ],
    steps: [
      {
        title: "搜论文并下载全文",
        body: "arXiv MCP 可以按关键词和日期搜索，并把论文下载到本地交给 Agent 读。",
        prompt:
          "找 2026 年关于 Agent 记忆机制的 arXiv 论文，按引用和相关度挑 5 篇总结",
      },
      {
        title: "接上你的 Zotero 文献库",
        body: "Zotero MCP 读取你已有的文献和笔记，让 Agent 基于你读过的材料回答，而不是凭空编造。",
        prompt: "在我的 Zotero 里找所有讲 RAG 评测的文献，整理成对比表",
      },
      {
        title: "追最近 30 天的讨论",
        body: "last30days 技能会汇总一个话题最近的讨论，适合在写综述前确认没有漏掉新进展。",
        prompt: "最近 30 天关于 MCP 安全问题有哪些讨论和事件？",
      },
    ],
  },
];

export function getPack(slug: string): Pack | undefined {
  return PACKS.find((p) => p.slug === slug);
}
