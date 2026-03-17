# 功能全景清单

## 内容板块

| ID | 功能 | 状态 | 说明 |
|----|------|------|------|
| SKL-01 | Skills 列表 + 详情页 | shipped | 309+ Skills，10 类分类，SSR |
| SKL-02 | Skills 中文翻译（name_zh/description_zh） | shipped | LLM 批量翻译 |
| SKL-03 | Skills 标签系统 | shipped | LLM 生成 3-5 标签 |
| SKL-04 | Skills 编辑评论 | shipped | Wirecutter 风格一句话推荐 |
| ART-01 | 文章列表 + 详情页 | shipped | 194 篇 published，RSS 采集 + 编译翻译 |
| ART-02 | 文章封面图提取 | shipped | 从 source_url 提取 og:image |
| MCP-01 | MCP 列表 + 详情页 | shipped | 5,172+ servers，三层分级（S/A/Hidden） |
| MCP-02 | MCP 工具定义（tools JSONB） | shipped | 从 Smithery API 回填 |
| MCP-03 | MCP 自动分级治理 | shipped | 基于星数/工具数/验证状态 |
| MCP-04 | S-tier 编辑精选 | shipped | 从 A-tier 中精选 + 编辑评论 |
| WKL-01 | 周刊生成 + 页面 | shipped | 整合三支柱 + LLM 编辑序言 |
| LEARN-01 | 学习中心索引 + 概念页 | wip | 3 概念页上线（Agent/MCP/RAG），P1 4/5 |
| GUIDE-01 | 专栏系列支持 | wip | series 标签 + 导航组件 + backfill 脚本，落地页待建 |
| GH-01 | GitHub 开源导航页 | shipped | AI Agent 生态项目导航 |

## 运营系统

| ID | 功能 | 状态 | 说明 |
|----|------|------|------|
| OPS-01 | RSS 文章双时段同步 | shipped | UTC 22:15 + 10:15，9 个源 |
| OPS-02 | Skills 定期同步 | shipped | ClawHub + Anthropic + curated，周一 |
| OPS-03 | MCP 定期同步 | shipped | Registry + Smithery，周一 |
| OPS-04 | GitHub 元数据刷新 | shipped | Stars/Forks 日刷新 + 周快照趋势 |
| OPS-05 | 数据回填管线 | shipped | name_zh/tags/desc_zh/editor_comments |
| OPS-06 | 数据质量健康检查 | shipped | 每日 23:45，Job Summary 报告 |
| OPS-07 | 内容治理自动化 | shipped | Skills/Articles/MCP 三路治理 |
| OPS-08 | GPT Proxy 超时 + 错误分类 | shipped | 60s 超时，isRetryable 分类 |
| OPS-09 | LLM Fallback 机制 | shipped | 连续 3 次失败自动切备用 provider |
| OPS-10 | 系列内容回填脚本 | shipped | `backfill-series.mjs`，可复用 |

## 前端 & UX

| ID | 功能 | 状态 | 说明 |
|----|------|------|------|
| UI-01 | 首页 5 大板块 | shipped | Hero + Stats + Featured + Articles + Newsletter |
| UI-02 | 暗色模式 | shipped | next-themes |
| UI-03 | 移动端适配 | shipped | 响应式 + 触控优化 |
| UI-04 | Admin 后台 | shipped | Skills/Articles/MCP 统一管理 |
| UI-05 | 英文路由（/en/） | shipped | 双语内容 |

## SEO & 分发

| ID | 功能 | 状态 | 说明 |
|----|------|------|------|
| SEO-01 | Sitemap + robots.txt | shipped | 精选质量页面，含 /learn |
| SEO-02 | JSON-LD 结构化数据 | shipped | |
| SEO-03 | llms.txt / llms-full.txt | shipped | AI 可读摘要 |
| SEO-04 | Umami + GA + GSC | shipped | 三重分析 |

## 待开发

| ID | 功能 | 状态 | 说明 |
|----|------|------|------|
| SEARCH-01 | 全站搜索（Orama → Meilisearch） | planned | |
| USER-01 | 用户系统 | planned | |
| PAY-01 | 付费 Skill 套件 | planned | LemonSqueezy |
| DIST-01 | 社交分发管线 | planned | 微信公众号/X/小红书 |
