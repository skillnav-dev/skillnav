# Skills & MCP 内容质量复审方案
Status: active
Progress: Phase 3 partial (3.1 done, others pending)
Date: 2026-03-13

## 一、数据现状

### Skills 表 (301 published)

| 字段 | 空值率 | 严重度 | 影响 |
|------|--------|--------|------|
| `name_zh` | 100% (301) | P0 | 卡片标题、h1、meta title 全部回退英文 |
| `install_command` | 100% (301) | P0 | 安装区块不显示或 git clone tree URL 无法执行 |
| `content_zh` | 100% (301) | 不做 | 英文文档已够用 |
| `intro_zh` | 100% (301) | P2 | 留给编辑手写 S-tier 导读 |
| `editor_comment_zh` | 100% (301) | P2 | 留给编辑手写 |
| `description_zh` | 0% | 已完成 | 2026-03-13 批量生成 |
| `content` | 6% (17) | P2 | Anthropic 官方 skill slug 格式问题 |
| `stars` = 0 | 6% (19) | P2 | 同上 |
| `quality_tier` | 284 null, 17 C | P2 | 无 S/A 评级 |
| `category` | 0% | OK | |
| `tags` | 0% | OK | |

### MCP Servers 表 (4,616 published)

| 字段 | 空值率 | 严重度 | 影响 |
|------|--------|--------|------|
| `category` | 99.6% (4,598) | P0 | 分类筛选形同虚设 |
| `intro_zh` | 98.6% (4,550) | P1 | 仅 66 个 S-tier 有 |
| `editor_comment_zh` | 98.6% (4,550) | P1 | 仅 66 个有 |
| `description_zh` | 未批量生成 | P1 | 卡片/meta 回退英文 |
| `tools` JSONB | 72% (3,340) | P1 | 详情页无工具列表 |
| `tools_count` = 0 | 94% (4,320) | P1 | 卡片不显示工具数 |
| `stars` = 0 | 63% (2,914) | P1 | 多数卡片无星标 |
| `source` 为空 | 78% (3,616) | P1 | sidebar 来源不显示 |
| `github_url` 为空 | 12% (560) | P2 | 无法抓 README |
| `quality_tier` | S:66 A:360 B:4190 | OK | 符合长尾定位 |

## 二、前端渲染问题

### P0 — 用户打开就能看到

1. **Skills 全站零中文标题** — `name_zh` 全空，所有 `nameZh ?? name` 回退英文
2. **Skills 无安装命令** — `install_command` 全空，githubUrl 是 tree 路径非 clone URL
3. **MCP 99.6% 无分类** — 卡片无 category badge，分类筛选无意义
4. **MCP B-tier 详情页内容极空** — 无编辑评测、无工具列表、无 README

### P1 — 影响内容质量

5. **MCP sidebar sourceLabels 不匹配** — 代码写 `official-registry`，数据是 `mcp-registry`
6. **Skills sidebar 缺 source 映射** — `awesome-list` 显示原始英文
7. **MCP/Skills 搜索只查 name** — 不搜 description
8. **英文 MCP 详情页严重简化** — 无编辑评测、无 README、sidebar 手写 dl
9. **首页无 MCP 展示区块** — 三大支柱之一在首页缺席
10. **Hero CTA 无 MCP 入口** + **页脚缺 MCP 链接**

### P2 — 技术债

11. `freshness` undefined 时 sidebar 显示 "undefined"
12. FAQ JSON-LD answer 可能为空
13. OG Image 全站缺失
14. MCP `generateStaticParams` 仅 200 页
15. Newsletter CTA "敬请期待"不可交互

## 三、实施计划

### Phase 1: Skills 体验补齐 (2-3 天)

| # | 任务 | 类型 | 复杂度 |
|---|------|------|--------|
| 1.1 | Skills `name_zh` 批量生成 | 脚本 | 小 |
| 1.2 | Skills `install_command` 构造 | 脚本 | 小 |
| 1.3 | Skills source label 补全 (`awesome-list` 等) | 前端 | 极小 |
| 1.4 | 首页/页脚增加 MCP 入口 (Hero CTA + footer + FeaturedMcp) | 前端 | 小 |
| 1.5 | 构建验证 | 验证 | — |

### Phase 2: MCP 分类 + 前端修复 (3-5 天)

| # | 任务 | 类型 | 复杂度 |
|---|------|------|--------|
| 2.1 | MCP 批量分类 (LLM based on description+tools) | 脚本 | 中 |
| 2.2 | MCP source 回填 (3,616 条 null) | 脚本 | 小 |
| 2.3 | MCP sidebar sourceLabels 修正 | 前端 | 极小 |
| 2.4 | MCP/Skills 搜索扩展至 description | 前端 | 小 |
| 2.5 | freshness/空值防护 | 前端 | 极小 |

### Phase 3: 内容深度提升 (持续)

| # | 任务 | 类型 | 复杂度 |
|---|------|------|--------|
| 3.1 | MCP `description_zh` 批量生成 (4,616 条) | 脚本 | 大 |
| 3.2 | Skills `quality_tier` 自动评级 (govern-skills.mjs) | 脚本 | 中 |
| 3.3 | 英文 MCP 详情页对齐中文版 | 前端 | 中 |
| 3.4 | 全站 OG Image | 前端 | 小 |
| 3.5 | MCP generateStaticParams 200 → 1000 | 前端 | 极小 |
| 3.6 | Anthropic 官方 17 条数据补全 | 脚本 | 小 |

## 四、不做的事

- content_zh 翻译 (301 篇全文翻译成本太高)
- Newsletter 功能 (改为引导关注 GitHub/WeChat)
- screenshot_urls (缺乏稳定截图源)
- 404 页面改造 (当前简洁够用)
