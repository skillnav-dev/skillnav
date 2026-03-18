# 功能全景清单

## 内容板块

| ID | 功能 | 状态 | 说明 |
|----|------|------|------|
| SKL-01 | Skills 列表 + 详情页 | shipped | 168 Skills（7 仓库），仓库为一级实体，安装命令指向具体 skill |
| SKL-02 | Skills 中文翻译（name_zh/description_zh） | shipped | LLM 批量翻译 |
| SKL-03 | Skills 标签系统 | shipped | LLM 生成 3-5 标签 |
| SKL-04 | Skills 编辑评论 | shipped | Wirecutter 风格一句话推荐 |
| ART-01 | 文章列表 + 详情页 | shipped | 194 篇 published，RSS 采集 + 编译翻译 |
| ART-02 | 文章封面图提取 | shipped | 从 source_url 提取 og:image |
| MCP-01 | MCP 列表 + 详情页 | shipped | 3,947 published（S/A/B 三层），B-tier noindex，结构化模板（什么是/如何使用/核心功能/FAQ） |
| MCP-02 | MCP 工具定义（tools JSONB） | shipped | 从 Smithery API 回填 |
| MCP-03 | MCP 自动分级治理 | shipped | 基于星数/工具数/验证状态 |
| MCP-04 | S-tier 编辑精选 | shipped | 从 A-tier 中精选 + 编辑评论 |
| WKL-01 | 周刊生成 + 页面 | shipped | 三支柱生成 + DB 数据层 + 列表/详情页 + 首期已发布 |
| LEARN-01 | 学习中心索引 + 概念页 | shipped | 12 概念页全部上线（3 P1 + 9 P2），含可视化图表 + 文章交叉链接 |
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
| OPS-07 | 内容治理自动化 | shipped | Skills/Articles/MCP 三路治理 + 软广自动检测（isAdvertorial） |
| OPS-08 | GPT Proxy 超时 + 错误分类 | shipped | 60s 超时，isRetryable 分类 |
| OPS-09 | LLM Fallback 机制 | shipped | 连续 3 次失败自动切备用 provider |
| OPS-10 | 系列内容回填脚本 | shipped | `backfill-series.mjs`，可复用 |

## 前端 & UX

| ID | 功能 | 状态 | 说明 |
|----|------|------|------|
| UI-01 | 首页场景导航 | shipped | Hero + Stats + "你想做什么"8 场景入口 + 编辑精选 + 精选工具 + 最新文章 + X 关注 CTA |
| UI-02 | 暗色模式 | shipped | next-themes |
| UI-03 | 移动端适配 | shipped | 响应式 + 触控优化 |
| UI-04 | Admin 后台 | shipped | Skills/Articles/MCP 统一管理 |
| UI-05 | 英文路由（/en/） | shipped | 双语内容 |
| UI-06 | 错误边界（error.tsx） | shipped | 根级 500 错误页，重试 + 返回首页 |

## SEO & 分发

| ID | 功能 | 状态 | 说明 |
|----|------|------|------|
| SEO-01 | Sitemap + robots.txt + canonical | shipped | S/A 级工具 + 文章，B-tier 移除 sitemap + noindex |
| SEO-02 | JSON-LD 结构化数据 | shipped | 含 MCP FAQ 可见化（JSON-LD + 页面同步） |
| SEO-03 | llms.txt / llms-full.txt | shipped | AI 可读摘要 |
| SEO-04 | Umami + GA + GSC | shipped | 三重分析 |
| SEO-05 | 动态 OG:Image | shipped | 5 个路由级动态生成（Skills/MCP/Articles/Weekly/Learn） |
| SEO-06 | Hidden 文章 301 重定向 | shipped | 避免 404 死链损害站点信任 |

## 待开发

| ID | 功能 | 状态 | 说明 |
|----|------|------|------|
| SEARCH-01 | 全站搜索（Orama → Meilisearch） | planned | |
| USER-01 | 用户系统 | planned | |
| PAY-01 | 付费 Skill 套件 | planned | LemonSqueezy |
| DIST-01 | X 社交分发 | wip | @skillnav_dev 已建立，API CreditsDepleted 待解决 |
