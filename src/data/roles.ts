/**
 * "按职业发现" on the homepage (issue #28): editor picks per role, at most 10
 * each, every one a published listing. Unpublished slugs are dropped at render
 * time by resolvePublishedTools(), so a pick never links to a 404.
 */

import type { ToolRef } from "@/lib/data/collections";

export interface RolePick extends ToolRef {
  /** One line: why this role should install it. */
  why: string;
}

export interface Role {
  id: string;
  label: string;
  picks: RolePick[];
}

const skill = (slug: string, why: string): RolePick => ({
  type: "skill",
  slug,
  why,
});
const mcp = (slug: string, why: string): RolePick => ({
  type: "mcp",
  slug,
  why,
});

export const ROLES: Role[] = [
  {
    id: "frontend",
    label: "前端开发",
    picks: [
      skill(
        "anthropic--frontend-design",
        "官方出品，让生成的页面摆脱千篇一律的 AI 风",
      ),
      mcp("context7", "把最新版框架文档喂给 Agent，少写过时 API"),
      mcp(
        "microsoft--playwright-mcp",
        "让 Agent 打开浏览器点一遍，自己验证改动",
      ),
      mcp(
        "io-github-chromedevtools--chrome-devtools-mcp",
        "看控制台、网络请求和性能，排查前端 bug",
      ),
      skill("vercel-labs--next-skills", "Next.js 官方团队写的最佳实践"),
      skill("vercel-labs--agent-skills", "React 组件和性能的规则集"),
      mcp(
        "io-github-glips--figma-context-mcp",
        "读取 Figma 设计稿，照稿还原页面",
      ),
      skill("leonxlnx--taste-skill", "补上排版、配色和留白的审美判断"),
      skill("anthropic--webapp-testing", "用 Playwright 写本地 Web 应用的测试"),
    ],
  },
  {
    id: "backend",
    label: "后端开发",
    picks: [
      mcp(
        "io-github-github--github-mcp-server",
        "GitHub 官方：查 issue、PR、代码都不用切窗口",
      ),
      mcp(
        "io-github-bytebase--dbhub",
        "一个 MCP 连 Postgres、MySQL、SQLite 等多种数据库",
      ),
      skill(
        "supabase--agent-skills",
        "Supabase 官方的 Postgres 与 RLS 最佳实践",
      ),
      mcp("supabase", "直接管理 Supabase 项目：建表、迁移、查日志"),
      skill("redis--agent-skills", "Redis 官方的数据结构与缓存用法"),
      skill("better-auth--skills", "登录鉴权照着官方推荐写，少踩安全坑"),
      skill("stripe--ai", "Stripe 官方的支付集成最佳实践"),
      mcp("sentry", "把线上报错和堆栈直接交给 Agent 分析"),
      skill("coderabbitai--skills", "提交前先做一轮 AI 代码审查"),
    ],
  },
  {
    id: "devops",
    label: "运维 / DevOps",
    picks: [
      mcp(
        "io-github-containers--kubernetes-mcp-server",
        "用自然语言查 Pod、看日志、排障",
      ),
      mcp(
        "io-github-hashicorp--terraform-mcp-server",
        "HashiCorp 官方：查 Provider 文档、写 Terraform",
      ),
      skill("hashicorp--agent-skills", "Terraform 代码生成和规范"),
      mcp("io-github-grafana--mcp-grafana", "查看仪表盘、告警和数据源"),
      mcp("io-github-pab1it0--prometheus-mcp-server", "直接跑 PromQL 查指标"),
      mcp("cloudflare", "Cloudflare 官方：管 Workers、DNS、日志"),
      skill("cloudflare--skills", "Cloudflare 平台的开发与部署指南"),
      mcp(
        "io-github-aws--mcp-proxy-for-aws",
        "AWS 官方：用 IAM 凭证安全调用 AWS",
      ),
      skill("cloudflare--security-audit-skill", "按清单给项目做一次安全审计"),
    ],
  },
  {
    id: "data",
    label: "数据分析",
    picks: [
      skill("anthropic--xlsx", "官方 Excel 技能：读写表格、公式和图表"),
      mcp("io-github-bytebase--dbhub", "连上业务库直接用 SQL 取数"),
      mcp("io-github-clickhouse--mcp-clickhouse", "ClickHouse 官方：查数仓"),
      skill("clickhouse--agent-skills", "ClickHouse 建表与查询优化指南"),
      mcp(
        "io-github-motherduckdb--mcp-server-motherduck",
        "用 DuckDB 在本地分析 CSV 和 Parquet",
      ),
      mcp(
        "io-github-antvis--mcp-server-chart",
        "蚂蚁 AntV 出品，一句话生成图表",
      ),
      mcp("io-github-posthog--mcp", "查产品埋点、漏斗和留存"),
      mcp(
        "com-microsoft--powerbi-modeling-mcp",
        "微软官方：搭 Power BI 语义模型",
      ),
      skill("k-dense-ai--scientific-agent-skills", "统计、生信等科研分析流程"),
    ],
  },
  {
    id: "product",
    label: "产品经理",
    picks: [
      skill("phuryn--pm-skills", "PRD、用户访谈、A/B 分析等产品工作模板"),
      skill("obra--superpowers", "先头脑风暴、再写计划，适合想清楚需求"),
      skill("anthropic--doc-coauthoring", "和 AI 一起把文档从草稿改到定稿"),
      skill("anthropic--pptx", "官方 PPT 技能：直接生成汇报幻灯片"),
      skill("mvanhorn--last30days-skill", "汇总某个话题最近 30 天的讨论"),
      mcp("io-github-posthog--mcp", "自己查数据，不用排队等分析师"),
      mcp(
        "taylorwilsdon--google-workspace-mcp",
        "读写 Google 文档、表格、日历和邮件",
      ),
      mcp("doist--todoist-mcp", "把会议结论直接变成待办"),
      skill("anthropic--internal-comms", "写周报、公告等内部沟通文案"),
    ],
  },
  {
    id: "content",
    label: "内容与市场",
    picks: [
      skill(
        "coreyhaines31--marketingskills",
        "文案、落地页、A/B 测试等营销技能合集",
      ),
      skill("agricidaniel--claude-seo", "关键词、站内 SEO 和技术 SEO 体检"),
      skill("blader--humanizer", "去掉 AI 腔，让文字更像人写的"),
      skill("anthropic--brand-guidelines", "让产出统一遵守品牌规范"),
      skill("anthropic--canvas-design", "生成海报、封面等静态视觉"),
      skill("remotion-dev--skills", "用代码批量生成视频"),
      mcp(
        "io-github-firecrawl--firecrawl-mcp-server",
        "抓取竞品网页，转成干净的 Markdown",
      ),
      mcp("exa", "按语义搜索全网资料和案例"),
      mcp("io-github-eat-pray-ai--yutu", "管理 YouTube 频道和视频"),
    ],
  },
];

/** All refs across roles, deduplicated, for one batched lookup. */
export function allRoleRefs(): ToolRef[] {
  const seen = new Set<string>();
  return ROLES.flatMap((r) => r.picks).filter((p) => {
    const key = `${p.type}:${p.slug}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
