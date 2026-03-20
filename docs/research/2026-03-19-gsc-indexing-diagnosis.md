---
title: GSC 索引率诊断：133/2500 = 5% 的原因与修复方案
date: 2026-03-19
tags: [seo, indexing, sitemap, crawl-budget, google]
---

# Research: GSC 索引率异常低（5%）诊断

> **Goal:** 诊断 Google Search Console 仅索引 133/2500 页（5%）的原因，制定分优先级的修复方案
> **Date:** 2026-03-19
> **Depth:** Quick Scan + 项目现状深度分析
> **Dimensions:** Best Practices, Current State, Performance

## TL;DR

索引率低的原因是**多因素叠加**，而非单一技术故障。按影响排序：
1. **Sitemap 被截断**（最关键）— 线上 sitemap.xml 在 ~580 URL 处断裂，XML 不完整，Google 无法解析完整 URL 列表
2. **内容质量信号弱** — MCP 占 sitemap ~850 URL（S/A tier），但大部分是模板生成的薄页面，Google 2025 年起大幅收紧对程序化页面的索引门槛
3. **网站年龄 + 域名权重低** — 新站（~2 个月），domain authority 极低，Google 给的 crawl budget 有限
4. **缺乏 internal linking 拓扑** — MCP 详情页之间缺少交叉链接，大量页面成为"孤岛"

推荐路径：先修截断（P0），再做 sitemap 拆分 + 内链增强（P1），最后做内容充实（P2）。

## Current State

### 站点数据概览

| 维度 | 数据 |
|------|------|
| GSC 已索引 | ~133 页 |
| Sitemap 提交 | ~2,500 URL（设计值） |
| 实际 sitemap.xml | **被截断，仅 ~580 URL 可读** |
| 网站上线时间 | ~2 个月 |
| 月访客 | 142（79% 来自搜索） |
| 域名权重 | 极低（新站） |

### Sitemap URL 构成（设计值）

| 类别 | 数量 | 来源 |
|------|------|------|
| MCP 详情页 zh | ~426 | S/A tier |
| MCP 详情页 en | ~426 | 英文版 |
| Skills 详情页 zh | ~168 | curated published |
| Skills 详情页 en | ~168 | 英文版 |
| Articles | ~213 | published |
| Weekly | ~1 | |
| Learn | 12 | 静态 |
| Static pages | ~20 | 首页/列表/关于等 |
| **合计** | **~1,434** | |

注意：实际 URL 数与"2,500"的差距需进一步确认。但无论如何，**线上 sitemap.xml 在 ~580 URL 处就被截断了**。

### 现有 SEO 配置

- ✅ robots.txt 正确（允许 /，禁止 /admin、/api）
- ✅ 所有页面有 canonical URL
- ✅ hreflang 双语标注
- ✅ B/C tier MCP 页面已设置 `robots: { index: false }`
- ✅ B tier 已从 sitemap 排除
- ✅ JSON-LD 结构化数据（SoftwareApplication、FAQ、DefinedTerm、Breadcrumb）
- ❌ **sitemap.xml 被截断，XML 不完整**
- ❌ 无 sitemap index（单文件）
- ❌ `_next/` chunk 文件未设置 `X-Robots-Tag: noindex`
- ❌ `/cdn-cgi/` 未在 robots.txt 中 disallow
- ❌ MCP 详情页间缺少交叉内链
- ❌ Supabase 查询无分页保障（默认 limit 1000）

## 问题诊断

### 问题 1: Sitemap 被截断 [HIGH]

**事实：** 通过 WebFetch 验证，线上 `https://skillnav.dev/sitemap.xml` 在约 580 个 URL 处被截断，XML 缺少 `</urlset>` 闭合标签。

**根因推测：** Next.js 在 Cloudflare Workers 上动态生成 sitemap.xml。当数据量较大时，可能触发 Worker 的内存限制或 CPU 时间限制，导致响应体被截断。Supabase 查询也可能受默认 1000 行限制影响（MCP S/A ~426 行不超限，但所有查询无显式 `.limit()` 也不安全）。

**影响：** 这是最致命的问题。Google 无法解析截断的 XML，可能完全忽略 sitemap 或仅处理已解析的部分。**大量页面从未被 Google 发现。**

### 问题 2: 程序化薄页面质量问题 [HIGH]

**事实：** Google 2025 年 5 月核心更新和 6 月核心更新大幅收紧了对程序化生成页面的索引标准。"Crawled — currently not indexed" 意味着 Google 已抓取但判定质量不足、不予索引。MCP 详情页虽然有模板化的"什么是 X""如何使用 X"等结构，但同质化程度高，对 Google 而言属于"模板化薄内容"。

**数据佐证：** 流量基线显示 MCP 板块占 3,947 页但仅 1% PV — Google 也看到了同样的信号。

**影响：** 即使 sitemap 修好，大量 MCP 详情页仍可能被 Google "Crawled — not indexed"。行业平均索引率仅 16.5%，programmatic SEO 站点更低。

### 问题 3: 新站 Crawl Budget 极低 [MEDIUM]

**事实：** 网站仅上线 ~2 个月，域名权重极低。Google 对新站的 crawl budget 分配保守。同时 Google 近期（2025 Q4-2026 Q1）GSC 报告本身也有数据延迟和显示 bug，可能影响数字准确性。

**影响：** 即使技术问题全部修复，索引增长也是渐进的（数周到数月）。

### 问题 4: `_next/` Chunk 浪费 Crawl Budget [MEDIUM]

**事实：** Next.js 部署后，Google 会尝试爬取 `/_next/static/chunks/` 和 `/_next/data/` 路径下的 JS/JSON 文件。这些文件不应被索引，但会消耗 crawl budget。多个 Next.js 用户报告了此问题导致的索引下降。[HIGH]

**影响：** 对新站影响尤为严重 — crawl budget 本就有限，被 chunk 文件分散后更少。

### 问题 5: 缺乏 Hub-Spoke 内链结构 [MEDIUM]

**事实：** MCP 详情页、Skills 详情页之间缺少语义相关的交叉内链。详情页主要通过列表页到达，缺少"相关工具""同类推荐"等内链。Google 爬虫依赖内链发现页面。

**影响：** 即使 sitemap 提交完整 URL，内链稀疏的页面在 Google 看来"不重要"，优先级低。

### 问题 6: `/cdn-cgi/` 路径未屏蔽 [LOW]

**事实：** Cloudflare 官方建议在 robots.txt 中 disallow `/cdn-cgi/`，因为 Google 爬取该路径会遇到错误。当前 robots.txt 未包含此规则。

**影响：** 轻微，但会产生不必要的 crawl errors。

## Best Practices

### Google 2025-2026 索引趋势

- Google 越来越选择性地索引内容。2024 年 3 月核心更新砍掉 40% "无帮助内容"，2025 年 6 月更新首次大规模 **去索引**（而非降权）[HIGH]
- E-E-A-T（Experience, Expertise, Authoritativeness, Trustworthiness）是关键因子。展示一手经验的页面可见度提升 38%，泛化 AI 内容下降 71% [MEDIUM]
- 行业平均索引率仅 ~16.5%，许多网站仅 1-3% 索引率 [HIGH]
- "Crawled — currently not indexed" 是质量判定，不是技术错误 [HIGH]

### Programmatic SEO 索引策略

- 使用"index gate"：仅当页面内容充实、有内链、有差异化信息时才提交 sitemap [HIGH]
- 分批上线：先 20-50 页验证模板质量，再扩展 [MEDIUM]
- Hub-spoke 模型：列表页（hub）链接到详情页（spoke），详情页之间交叉链接 3-6 个同类页面 [HIGH]
- 保持重要页面在首页 3 次点击内可达 [MEDIUM]

### Next.js + Cloudflare Workers SEO 优化

- 对 `/_next/` 路径添加 `X-Robots-Tag: noindex` 响应头 [HIGH]
- Disallow `/cdn-cgi/` [LOW]
- Sitemap 拆分为 sitemap index + 多个子 sitemap（每个 <1000 URL）[HIGH]
- 避免频繁部署导致旧 chunk 404（version skew）[MEDIUM]

## Recommendations

### Recommended Path

分三阶段修复，按紧急度排序：

#### P0: 修复 Sitemap 截断（1-2 天）

1. **拆分为 sitemap index** — 将单个 `sitemap.xml` 拆分为 sitemap index + 多个子文件：
   - `/sitemap-index.xml`（主索引）
   - `/sitemap-static.xml`（静态页 + learn + guides）
   - `/sitemap-articles.xml`（文章 + 周刊）
   - `/sitemap-mcp.xml`（MCP S/A tier，zh + en）
   - `/sitemap-skills.xml`（Skills，zh + en）

   Next.js 15 App Router 支持 `generateSitemaps()` 返回多个 sitemap ID。

2. **确保 Supabase 查询完整性** — 虽然当前 S/A MCP ~426 未超 1000 限制，但应显式加 `.limit(2000)` 或分页，防止未来数据增长后静默截断。

3. **验证** — 部署后用 `curl -s https://skillnav.dev/sitemap.xml | wc -c` 确认完整性，用 GSC URL 检查工具验证。

#### P1: 减少 Crawl Budget 浪费（1 天）

4. **添加 `X-Robots-Tag: noindex` 到 `_next/` 路径** — 通过 Cloudflare Worker 或 `next.config.js` headers 配置。

5. **Disallow `/cdn-cgi/`** — 在 robots.txt 中添加。

6. **重新提交 sitemap** — 在 GSC 中删除旧 sitemap，重新提交 sitemap index。

#### P2: 提升内容质量信号（持续）

7. **MCP 详情页增加交叉内链** — 每个详情页底部添加"相关 MCP 服务器"模块（基于 category 或 tags 匹配，3-6 个链接）。

8. **充实 S-tier MCP 页面内容** — 66 个 S-tier 页面优先添加 README 内容、工具列表、使用示例等差异化信息。

9. **强化 hub-spoke 结构** — 在 `/mcp` 列表页增加 category 子页面（如 `/mcp?category=database`），形成 hub → spoke 拓扑。

10. **逐步请求索引** — 对已修复的高价值页面（文章、S-tier MCP），在 GSC 逐个请求索引。

### Alternatives Considered

- **使用 `next-sitemap` 包**：成熟方案，但引入额外依赖。Next.js 15 内置 `generateSitemaps()` 足够，优先用原生能力。
- **将 sitemap 预构建为静态文件**：可以绕过 Worker 动态生成的内存问题，但需要额外 CI 步骤和数据同步。作为 fallback 方案保留。
- **大幅削减 sitemap URL 数量**：可以只提交文章 + S-tier MCP（~280 URL），但会牺牲长尾 SEO 潜力。延后考虑。

### Open Questions

1. GSC 中 "Not indexed" 的页面具体是 "Discovered — not indexed" 还是 "Crawled — not indexed"？两者修复方向不同
2. sitemap 截断的确切原因是 Worker 内存限制还是其他？需要部署后观察日志
3. Cloudflare Firewall 是否误拦了 Googlebot？需检查 Firewall > Overview 日志

### Suggested Next Steps

1. 检查 GSC Pages 报告中 "Not indexed" 的具体分类（Discovered vs Crawled）
2. 实施 P0 sitemap 拆分方案
3. 部署后验证 sitemap 完整性
4. 30 天后复查索引率变化

## Adoption Decisions

### Industry Standard Layers

| 行业标准分层 | 我们的现状 | Gap |
|-------------|-----------|-----|
| Sitemap 完整性 & 拆分 | 单文件，且被截断 | 截断导致 Google 无法发现大部分 URL |
| Crawl budget 管理 | 未管理 `_next/` 和 `/cdn-cgi/` | JS chunk 浪费有限的 crawl budget |
| 内容质量信号（E-E-A-T） | 大量模板化薄页面 | 程序化页面缺乏差异化内容 |
| Internal linking（hub-spoke） | 仅列表→详情单向链接 | 缺乏详情页间交叉内链和 category hub |
| 结构化数据 | ✅ 完备 | 无 gap |
| Canonical & hreflang | ✅ 完备 | 无 gap |
| robots.txt | 缺少 `/cdn-cgi/` | 轻微 |

### Adoption Decision Table

| # | 发现 | 决策 | 作用域 | 理由 |
|---|------|------|--------|------|
| 1 | Sitemap 被截断，XML 不完整 | 采纳 | P0 全项目 | 最关键阻塞，不修无法被 Google 发现 |
| 2 | 应拆分为 sitemap index + 多子文件 | 采纳 | P0 全项目 | 行业标准做法，防止单文件过大 |
| 3 | `_next/` 需加 X-Robots-Tag noindex | 采纳 | P1 全项目 | 节省 crawl budget，多个案例验证 |
| 4 | `/cdn-cgi/` 需 disallow | 采纳 | P1 全项目 | Cloudflare 官方建议，成本极低 |
| 5 | MCP 详情页添加交叉内链 | 采纳 | P2 MCP 模块 | hub-spoke 是 pSEO 标配，但需开发 |
| 6 | S-tier MCP 页面内容充实 | 采纳 | P2 MCP 模块 | 配合产品方向"做厚 S-tier 详情页" |
| 7 | 削减 sitemap 只保留高质量页面 | 延后 | P3+ | 先观察修复后的索引率再决定 |
| 8 | 迁移到 `next-sitemap` 包 | 不采纳 | — | Next.js 15 原生 `generateSitemaps()` 足够 |
| 9 | Sitemap 预构建为静态文件 | 延后 | P3+ fallback | 如拆分后仍截断，再考虑 |

## Sources

- [Google Index Rate: How to Speed Up Crawling in 2026](https://www.clickrank.ai/google-index-rate/)
- [Crawled – Currently Not Indexed: Why It Happens (2026)](https://indexmachine.co/blog/crawled-currently-not-indexed-why-it-happens-how-to-fix)
- [Pages Unindexed After Google June 2025 Update](https://www.getpassionfruit.com/blog/why-website-pages-are-getting-de-indexed-after-june-2025-google-core-update-complete-recovery-guide)
- [Google Indexing Less Since Late May 2025](https://www.seroundtable.com/google-indexing-less-may-39538.html)
- [Why Google Isn't Indexing Your Programmatic Pages](https://seomatic.ai/blog/programmatic-seo-indexing)
- [Index Bloat in SEO](https://searchengineland.com/guide/index-bloat)
- [Next.js Soft 404s Discussion #78288](https://github.com/vercel/next.js/discussions/78288)
- [Prevent Google from crawling chunks — Next.js Discussion #34193](https://github.com/vercel/next.js/discussions/34193)
- [Cloudflare: Google/Bing unable to index my site](https://community.cloudflare.com/t/google-bing-unable-to-index-my-site/849683)
- [Cloudflare Workers Limits](https://developers.cloudflare.com/workers/platform/limits/)
- [Google: Manage Large Sitemaps](https://developers.google.com/search/docs/crawling-indexing/sitemaps/large-sitemaps)
- [Next.js Metadata: sitemap.xml](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap)
- [Next.js SEO: Sitemap Index for Enterprise](https://dev.to/ziaulhoque24/the-critical-gap-in-nextjs-seo-implementing-sitemap-index-for-enterprise-applications-2k87)
- [Internal Linking Strategy: Complete SEO Guide 2026](https://www.ideamagix.com/blog/internal-linking-strategy-seo-guide-2026/)
- [How to Fix Indexing Issues in GSC](https://www.digitalupward.com/blog/how-to-fix-indexing-issues-in-google-search-console/)
- [Cloudflare Troubleshooting Crawl Errors](https://developers.cloudflare.com/support/troubleshooting/general-troubleshooting/troubleshooting-crawl-errors/)
