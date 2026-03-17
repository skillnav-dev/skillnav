# SkillNav UI/UX 全面审计报告

> 审计日期：2026-03-17
> 审计范围：Design Token 合规性、逐页视觉一致性、组件规范性、竞品对标、信息架构、用户旅程
> 对标文档：`docs/design-spec.md` v1.0 + `docs/product-spec.md` v1.0

---

## 目录

1. [Design Token 合规审计](#1-design-token-合规审计)
2. [逐页视觉审查](#2-逐页视觉审查)
3. [组件一致性审计](#3-组件一致性审计)
4. [竞品分析](#4-竞品分析)
5. [设计标杆拆解](#5-设计标杆拆解)
6. [信息架构与用户旅程审查](#6-信息架构与用户旅程审查)
7. [系统性问题汇总与优先级](#7-系统性问题汇总与优先级)

---

## 1. Design Token 合规审计

对 `globals.css` 中的 Token 实现与 `design-spec.md` 规范进行逐项对比。

### 1.1 色彩 Token — ✅ 合规

| Token | 规范值 (Light) | 实现值 | 状态 |
|-------|--------------|--------|------|
| `--background` | `oklch(0.985 0.005 260)` | `oklch(0.985 0.005 260)` | ✅ |
| `--foreground` | `oklch(0.16 0.02 260)` | `oklch(0.16 0.02 260)` | ✅ |
| `--primary` | `oklch(0.45 0.18 260)` | `oklch(0.45 0.18 260)` | ✅ |
| `--accent` | `oklch(0.65 0.2 185)` | `oklch(0.65 0.2 185)` | ✅ |
| `--muted` | `oklch(0.95 0.005 260)` | `oklch(0.96 0.008 260)` | ⚠️ 微偏差 |
| `--card` | `oklch(1 0 0)` | `oklch(1 0 0)` | ✅ |
| `--border` | `oklch(0.90 0.005 260)` | `oklch(0.9 0.01 260)` | ⚠️ 微偏差 |

Dark mode Token 全部正确实现。`--card` dark 值 `oklch(0.19 0.025 260)` 与规范 `oklch(0.17 0.015 260)` 有偏差（lightness 0.19 vs 0.17），但视觉差异极小。

**结论**: 色彩体系整体合规，微偏差不影响视觉效果。

### 1.2 圆角 Token — ✅ 合规

| Token | 规范值 | 实现值 | 状态 |
|-------|--------|--------|------|
| `--radius` | `0.625rem` (10px) | `0.625rem` | ✅ |
| `rounded-sm` | 6px (`calc(var(--radius) - 4px)`) | ✅ | ✅ |
| `rounded-md` | 8px | ✅ | ✅ |
| `rounded-lg` | 10px (`var(--radius)`) | ✅ | ✅ |
| `rounded-xl` | 14px | ✅ | ✅ |

### 1.3 字体栈 — ✅ 合规

```css
/* 实现 */
--font-sans: var(--font-sans), "Noto Sans SC", "PingFang SC", "Microsoft YaHei", "Hiragino Sans GB", sans-serif;
/* 规范 */
Body: Inter, "Noto Sans SC", "PingFang SC", "Microsoft YaHei", "Hiragino Sans GB", sans-serif
```
Inter 通过 Next.js `next/font` 注入到 `var(--font-sans)`，字体栈完全匹配。

### 1.4 动画 Token — ✅ 合规

`animate-fade-in` (0.2s ease-out) 和 `animate-slide-up` (0.25s ease-out) 均按规范实现。

### 1.5 行高 — ✅ 合规

`body { line-height: 1.75; }` 在 `globals.css` 中设置，符合中文排版规范。

---

## 2. 逐页视觉审查

### 2.1 首页 (`/`)

**合规项**:
- ✅ Hero `py-20 sm:py-28`
- ✅ 容器 `max-w-6xl mx-auto px-4 sm:px-6`
- ✅ Hero 标题 `text-4xl sm:text-5xl lg:text-6xl font-bold` (Display 级)
- ✅ 各 section `py-16`
- ✅ StatsBar `grid-cols-2 md:grid-cols-4 gap-4`
- ✅ Hero 渐变 `from-primary/5`（克制用色）

**问题**:

| # | 问题 | 文件:行号 | 严重度 |
|---|------|----------|--------|
| H-1 | 分隔线 `border-border/20` 违反两级规范（应为 `/40`） | `src/app/page.tsx:24` | 低 |
| H-2 | FeaturedTools/LatestArticles 列表项用 `border-border/30`，不在规范两级内 | `featured-tools.tsx:75,112` / `latest-articles.tsx:54` | 低 |
| H-3 | Hero 有 3 个 CTA 按钮（浏览工具 / 阅读周刊 / 最新资讯），竞品通常仅 1-2 个，注意力分散 | `hero-section.tsx:43-65` | 中 |
| H-4 | EditorialHighlights 周刊大卡 `text-lg font-semibold`，偏离卡片标题规范 `text-base` | `editorial-highlights.tsx:51` | 低 |

### 2.2 Skills 列表 (`/skills`)

**合规项**:
- ✅ 容器 `mx-auto max-w-6xl px-4 py-12 sm:px-6`
- ✅ Grid `gap-4 sm:grid-cols-2 lg:grid-cols-3`
- ✅ SectionHeader → 内容 `mt-6`
- ✅ Toolbar 控件 `h-10` 统一高度

**问题**: 无显著问题。

### 2.3 Skill 详情 (`/skills/[slug]`)

**合规项**:
- ✅ H1 `text-3xl font-bold tracking-tight sm:text-4xl`
- ✅ 两栏布局 `lg:grid lg:grid-cols-3 lg:gap-8`
- ✅ 相关推荐区 `border-t border-border/40`

**问题**:

| # | 问题 | 文件:行号 | 严重度 |
|---|------|----------|--------|
| SD-1 | Sidebar 信息块用 `rounded-lg p-5`，视觉上是卡片但圆角和间距与 Card 组件不一致 | `skill-sidebar.tsx:57,159,181` | 中 |

### 2.4 MCP 列表 (`/mcp`)

**合规项**:
- ✅ 容器、Grid、Toolbar 均合规

**问题**:

| # | 问题 | 文件:行号 | 严重度 |
|---|------|----------|--------|
| ML-1 | 分页使用自定义 Link 样式（`rounded-md border px-3 py-1.5`）而非 Button 组件，与 Skills/Articles 分页不一致 | `mcp-grid.tsx` | 中 |
| ML-2 | 无独立 EmptyState 组件，空结果使用行内 `py-12 text-center` 文本 | `mcp-grid.tsx` | 低 |

### 2.5 MCP 详情 (`/mcp/[slug]`)

**合规项**:
- ✅ H1、容器、面包屑、相关推荐区均合规
- ✅ 内容块 `rounded-lg border-border/40 bg-card p-6`

**问题**:

| # | 问题 | 文件:行号 | 严重度 |
|---|------|----------|--------|
| MD-1 | 工具列表项 `border-border/30`（应为 `/40`） | `mcp/[slug]/page.tsx:264` | 低 |
| MD-2 | Sidebar 信息块 `rounded-lg p-5`，同 SD-1 | `mcp-detail-sidebar.tsx:44,117,134` | 中 |
| MD-3 | 内容块均用 `rounded-lg`，若视为卡片应用 `rounded-xl` | `mcp/[slug]/page.tsx:221-279` | 中 |

### 2.6 文章列表 (`/articles`)

**合规项**:
- ✅ 容器、Grid (`sm:grid-cols-2`)、Toolbar 均合规

**问题**: 无显著问题。

### 2.7 文章详情 (`/articles/[slug]`)

**合规项**:
- ✅ 阅读容器 `max-w-3xl mx-auto`
- ✅ H1 `text-3xl font-bold tracking-tight sm:text-4xl`

**问题**:

| # | 问题 | 文件:行号 | 严重度 |
|---|------|----------|--------|
| AD-1 | 来源归属框 `border-border/60`（应为 `/40`） | `articles/[slug]/page.tsx:175` | 低 |
| AD-2 | 相关文章卡片 `border-border/60`，非标准 | `articles/[slug]/page.tsx:225` | 低 |

### 2.8 周刊列表 (`/weekly`)

**问题**:

| # | 问题 | 文件:行号 | 严重度 |
|---|------|----------|--------|
| WL-1 | 周刊卡片 `rounded-lg border-border/60`（双重违规：圆角 + 边框透明度） | `weekly/page.tsx:53` | 高 |
| WL-2 | 卡片标题 `text-lg font-semibold`（应为 `text-base`） | `weekly/page.tsx:68` | 中 |
| WL-3 | Grid 间距 `mt-10`（应为 `mt-6`） | `weekly/page.tsx:48` | 低 |
| WL-4 | Grid 用 `gap-6`（其他列表页用 `gap-4`） | `weekly/page.tsx:48` | 低 |

### 2.9 周刊详情 (`/weekly/[slug]`)

**问题**:

| # | 问题 | 文件:行号 | 严重度 |
|---|------|----------|--------|
| WD-1 | 前后导航卡片 `border-border/60`（应为 `/40`） | `weekly/[slug]/page.tsx:114,130` | 低 |

### 2.10 学习中心 (`/learn`)

**问题**:

| # | 问题 | 文件:行号 | 严重度 |
|---|------|----------|--------|
| LC-1 | ConceptCard `rounded-lg border-border/60`（双重违规） | `concept-card.tsx:19` | 高 |
| LC-2 | ConceptCard 标题 `text-lg font-semibold`（应为 `text-base`） | `concept-card.tsx:26` | 中 |
| LC-3 | RelatedConcepts 容器 `border-border/60` | `related-concepts.tsx:17` | 低 |
| LC-4 | 学习详情页底部内容块 `border-border/60` | `learn/[slug]/page.tsx:298` | 低 |

### 2.11 Guides 页 (`/guides`)

**问题**:

| # | 问题 | 文件:行号 | 严重度 |
|---|------|----------|--------|
| G-1 | 系列卡片 `rounded-lg`（应为 `rounded-xl`） | `guides/page.tsx:29` | 中 |

### 2.12 关于 / GitHub / 404 / Admin

- ✅ About 页面容器合规
- ✅ 404 页面设计简洁合规
- ⚠️ GitHub 页 GitHubCard `pb-2`（应为 `pb-3`）

---

## 3. 组件一致性审计

### 3.1 系统性问题：`border-border` 透明度滥用

**规范（DS:2.4）**: 仅允许两个级别——`border-border`（默认）和 `border-border/40`（微妙）。

**实际使用了 4 个非规范级别**:

| 透明度 | 出现次数 | 位置 |
|--------|---------|------|
| `/20` | 1 | 首页分隔线 |
| `/30` | 6 | 列表项分隔、代码块头部、MCP 工具项 |
| `/50` | 0 | 无 (已按规范废弃) |
| `/60` | 9 | ConceptCard, SeriesNav, 周刊卡片, 相关文章, RelatedConcepts, 学习详情, 周刊详情导航 |

**根因**: 新开发的页面/组件没有严格参照规范，凭直觉选择了中间值。

### 3.2 系统性问题：详情页内容块圆角不统一

详情页内的"卡片式内容块"（有 border + bg-card + padding 的 div）大量使用 `rounded-lg`，而 shadcn Card 组件使用 `rounded-xl`。两者在视觉上都是"卡片"，但圆角不一致。

| 组件类型 | 圆角 | 规范预期 |
|---------|------|---------|
| shadcn Card（列表卡片） | `rounded-xl` (14px) | ✅ |
| 详情页内容块（安装、工具、简介） | `rounded-lg` (10px) | ❓ 未明确 |
| Sidebar 信息块 | `rounded-lg` (10px) | ❓ 未明确 |

**建议**: 在 design-spec 中明确区分"Card"（列表项）和"ContentBlock"（详情页内嵌块）的圆角规范。目前内容块用 `rounded-lg` 与卡片 `rounded-xl` 有视觉差异，建议统一为 `rounded-xl`。

### 3.3 卡片组件对比

| 维度 | SkillCard | ArticleCard | MCPCard | ConceptCard | WeeklyCard | GitHubCard |
|------|-----------|-------------|---------|-------------|------------|------------|
| 圆角 | `rounded-xl` ✅ | `rounded-xl` ✅ | `rounded-xl` ✅ | `rounded-lg` ❌ | `rounded-lg` ❌ | `rounded-xl` ✅ |
| 标题字号 | `text-base` ✅ | `text-base` ✅ | `text-base` ✅ | `text-lg` ❌ | `text-lg` ❌ | `text-base` ✅ |
| Hover | `hover:shadow-md` ✅ | `hover:shadow-md` ✅ | `hover:shadow-md` ✅ | `hover:bg-accent/30` ⚠️ | `hover:bg-muted/30` ⚠️ | `hover:shadow-md` ✅ |
| HeaderPadding | `pb-3` ✅ | `pb-3` ✅ | `pb-3` ✅ | N/A (自定义) | N/A (自定义) | `pb-2` ❌ |
| 描述截断 | `line-clamp-2` ✅ | `line-clamp-2` ✅ | `line-clamp-2` ✅ | ✅ | `line-clamp-2` ✅ | `line-clamp-3` ⚠️ |

**Pattern**: 使用 shadcn Card 组件的卡片（Skill/Article/MCP/GitHub）大部分合规；**自定义卡片**（Concept/Weekly）系统性偏离规范。

### 3.4 Button/Input 默认高度

| 组件 | 规范 | 实际默认 | Toolbar 覆盖 |
|------|------|---------|-------------|
| Button | `h-10` (DS:4.1) | `h-9` (shadcn 默认) | Toolbar 手动加 `h-10` |
| Input | `h-10` (DS:4.2) | `h-9` (shadcn 默认) | Toolbar 手动加 `h-10` |
| SelectTrigger | `h-10` | `h-9` | Toolbar 手动加 `h-10` |

**影响**: Toolbar 中已手动覆盖为 `h-10`，其他场景（Admin 表单等）仍使用 `h-9`。不影响列表页体验。

### 3.5 骨架屏一致性

| 组件 | 使用 Card 组件 | overflow-hidden | 状态 |
|------|--------------|-----------------|------|
| SkillsSkeleton | ❌ raw div | ❌ 缺失 | ⚠️ |
| ArticlesSkeleton | ❌ raw div | ✅ | ⚠️ |
| MCPGridSkeleton | ✅ Card | ✅ | ✅ |

---

## 4. 竞品分析

### 4.1 竞品概览

| 竞品 | 定位 | 规模 | 中文 | 核心交互 | 视觉风格 |
|------|------|------|------|---------|---------|
| **daily.dev** | 开发者新闻 | 内容无限 | 无 | 算法推荐 Feed | 暗色 + 粉紫 |
| **opentools.ai** | AI 工具全品类 | 10K+ | 无 | 分类 + 排名 + AI Bot | 暗色 + 玫瑰色 |
| **glama.ai** | MCP 平台 | 19K+ servers | 无 | 多维筛选 + Deep Search | 深暗色渐变 |
| **toolify.ai** | AI 工具全品类 | 28K+ | 机器翻译 | 分类 + 排名 + 流量数据 | 浅色白底 |
| **mcp.so** | MCP 目录 | 18K+ servers | 无 | 混合语义搜索 + Playground | 明暗双色 + 紫色 |

### 4.2 关键发现

**SkillNav 已有的差异化优势（必须保持）**:
1. **中文编辑策展** — 所有竞品要么无中文，要么机器翻译
2. **S/A/B 分层体系** — 比 Glama 的 A-F 更简洁有观点
3. **内容深度三件套** — 翻译资讯 + 周刊 + 学习中心，竞品无此组合
4. **垂直聚焦 AI Agent** — 不做全品类

**竞品值得借鉴的模式**:

| 模式 | 来源 | 描述 | SkillNav 适用性 |
|------|------|------|----------------|
| **结构化详情模板** | mcp.so | "是什么 / 怎么用 / FAQ" 固定结构 | ✅ 高 — 提升 SEO + 内容一致性 |
| **多维排序** | glama.ai | Stars / 更新时间 / 策展评级并存 | ✅ 高 — 已有基础 |
| **功能 Tag 卡片展示** | opentools.ai | 卡片上直接展示 3-5 个能力标签 | ✅ 中 — 减少点击决策成本 |
| **工具对比页** | opentools.ai | "A vs B" 对比页面 | ✅ 中 — SEO 长尾价值 |
| **三维评级可视化** | glama.ai | Security / License / Quality 三维 | ⚠️ 低 — 当前 security_score 够用 |
| **调用量排行** | mcp.so | 按实际使用量排序 | ❌ 无数据源 |
| **AI Bot 发现** | opentools.ai | 自然语言描述需求 → 推荐 | ❌ 成本高，P3 |
| **Playground** | mcp.so | 在线试用 MCP Server | ❌ 实现成本极高，P3 |

### 4.3 视觉风格对比

| 维度 | 行业趋势 | SkillNav 现状 | 差距 |
|------|---------|-------------|------|
| 主题 | 暗色优先（4/5 竞品） | 明暗双色 ✅ | 无 |
| 信息密度 | 中高（卡片 + 指标） | 中等 | 可提升：卡片可增加功能 Tag |
| 品牌色面积 | <5%，仅 CTA/accent | <5% ✅ | 无 |
| 卡片样式 | 圆角 + 微阴影 + hover | 一致 ✅ | 无 |
| 导航 | 顶部极简 + 分类侧栏 | 顶部导航 ✅ | 无 |

---

## 5. 设计标杆拆解

### 5.1 Linear — 暗色排版动效克制

**可借鉴**:
- **4 级文字颜色 Token**: `text-primary` / `text-secondary` / `text-tertiary` / `text-quaternary`。SkillNav 当前仅 `text-foreground` + `text-muted-foreground` 两级，在详情页长内容中层级表达不够精细
- **动效哲学**: "增强不分散"，微交互用极慢循环 + 阶梯透明度。SkillNav 当前动效克制 ✅，保持即可
- **透明度建立层级**: 用 `foreground/85`、`foreground/75` 而非引入新颜色。SkillNav MCP 详情页已用 `text-foreground/85`、`text-foreground/75`，可系统化

**建议**: 在 design-spec 中增加 `foreground/85`（次要正文）、`foreground/65`（辅助信息）两个语义级别，替代随意的透明度数值。

### 5.2 Vercel — 信息层级与证据驱动

**可借鉴**:
- **证据指标区块**: 首页用具体数字展示规模感（"3,900+ MCP Server 收录"）。SkillNav StatsBar 已有 ✅，但数字展示可更突出
- **按意图导航**: 将导航从"内容类型"（Skills / MCP / Articles）转向"用户意图"（发现工具 / 学习概念 / 跟踪动态）
- **CTA 聚焦**: 首页仅 1 个主 CTA + 1 个辅助。SkillNav 有 3 个同级 CTA，分散注意力

**建议**: Hero CTA 精简为 2 个（主: 浏览工具 / 辅: 阅读周刊），"最新资讯"降级到 EditorialHighlights section。

### 5.3 Supabase — 开发者信任构建

**可借鉴**:
- **代码可见性**: CLI 命令直接展示，建立技术可信度。SkillNav MCP 详情页已有安装命令 ✅
- **GitHub Stars 醒目展示**: SkillNav 工具卡片已显示 ✅
- **单卡单能力**: 首页功能区每张卡聚焦一个能力。SkillNav FeaturedTools 用 Tab 切换 Skills/MCP ✅

---

## 6. 信息架构与用户旅程审查

### 6.1 导航效率

| 维度 | 评估 | 问题 |
|------|------|------|
| 导航项数 | 5 项（Skills / MCP / 周刊 / 资讯 / 关于） | ✅ 合理 |
| 导航深度 | 最多 3 层 | ✅ |
| 首页 → 目标 | 2 步（首页 → 列表 → 详情） | ✅ |
| Learn 中心入口 | 无主导航入口，仅 Footer 和文章交叉链接 | ⚠️ **内容可发现性低** |
| Guides 入口 | 无主导航入口，仅 Learn 页面链接 | ⚠️ |
| GitHub 页入口 | 无主导航，仅 Footer | ✅（低优先级页面） |

**问题 IA-1**: 学习中心（`/learn`）和指南（`/guides`）作为内容差异化的重要支柱，在导航中完全不可见。用户除非偶然发现 Footer 链接，否则无法触达。

**建议**: 考虑在导航中增加"学习"下拉（含 Learn 概念 + Guides 深度指南），或将 Learn 整合到"资讯"下拉菜单。

### 6.2 内容可发现性

| 内容类型 | 入口数量 | 入口位置 | 评估 |
|---------|---------|---------|------|
| Skills | 3 | 导航 + 首页搜索 + 首页 FeaturedTools | ✅ 充分 |
| MCP | 3 | 导航 + 首页 FeaturedTools Tab + 场景标签 | ✅ 充分 |
| Articles | 3 | 导航 + 首页 EditorialHighlights + LatestArticles | ✅ 充分 |
| Weekly | 2 | 导航 + 首页 EditorialHighlights 大卡 | ✅ 合理 |
| Learn | 1 | Footer + 文章内交叉链接 | ❌ **不足** |
| Guides | 0.5 | Learn 页面内链 | ❌ **极不足** |

### 6.3 用户旅程瓶颈

**旅程 A: 效率猎手（找工具）**
- ✅ 首页搜索 → Skills 列表 → 详情 → 复制安装命令，流程顺畅
- ⚠️ **Skills 和 MCP 列表分离**：用户不确定目标工具是 Skill 还是 MCP Server 时，需要两个页面分别搜索。竞品 glama.ai 和 mcp.so 将所有工具统一搜索

**旅程 B: 趋势跟踪者（看周刊）**
- ✅ 导航 → 周刊列表 → 周刊详情，流程简单
- ⚠️ 周刊内缺少到工具详情页的深链（依赖 Markdown 内容中的链接），不如 mcp.so 的结构化链接

**旅程 C: 新手探索者（学习概念）**
- ❌ **断裂旅程**：用户从首页几乎无法发现 Learn 页面。场景标签跳转 Skills 列表，不跳转学习中心
- **建议**: 首页 ScenarioShortcuts 增加"学习路径"入口，或在 Hero 下方增加"新手？从这里开始"引导

### 6.4 跨板块衔接

| 衔接点 | 实现状态 | 问题 |
|--------|---------|------|
| 文章 → 提及的工具 | ✅ 文章详情页底部 RelatedTools | — |
| 工具 → 相关文章 | ✅ Skill/MCP 详情页底部 RelatedArticles | — |
| 工具 → 相关 MCP | ✅ Skill 详情页 RelatedMCP | — |
| 文章 → Learn 概念 | ⚠️ 仅通过行内链接 | 缺少结构化推荐 |
| Learn → 工具推荐 | ❌ 无 | 学习概念后应推荐相关工具 |
| 周刊 → 工具详情 | ⚠️ 依赖 Markdown 链接 | 应改为结构化卡片链接 |

---

## 7. 系统性问题汇总与优先级

### P0 — 设计系统违规（应立即修复）

| # | 问题 | 影响范围 | 修复方案 |
|---|------|---------|---------|
| **S-1** | `border-border/60` 在 9 处使用，违反两级规范 | ConceptCard, SeriesNav, 周刊卡片, 文章详情, 学习详情, RelatedConcepts, 周刊详情导航 | 全部替换为 `border-border/40` |
| **S-2** | ConceptCard 和周刊卡片使用 `rounded-lg`，应为 `rounded-xl` | `/learn`, `/weekly` 两个页面 | 替换为 `rounded-xl` |
| **S-3** | ConceptCard 和周刊卡片标题用 `text-lg`，应为 `text-base` | 同上 | 替换为 `text-base font-semibold` |

### P1 — 一致性改进（本迭代修复）

| # | 问题 | 影响范围 | 修复方案 |
|---|------|---------|---------|
| **S-4** | `border-border/30` 在 6 处使用（列表项分隔线、代码块） | 首页列表项, 代码块, MCP 工具项 | 统一为 `border-border/40` 或在 spec 中增加第三级 |
| **S-5** | 详情页内容块（安装/工具/简介）用 `rounded-lg`，与列表卡片 `rounded-xl` 不统一 | 所有详情页 | 在 spec 中明确 ContentBlock 圆角，建议统一为 `rounded-xl` |
| **S-6** | Sidebar 信息块 padding `p-5` 非标准（不在 8pt grid 上） | SkillSidebar, McpDetailSidebar | 改为 `p-6`（spec 标准）或 `p-4` |
| **S-7** | MCP 分页样式与 Skills/Articles 不一致 | `/mcp` 列表页 | 统一使用 Button 组件 |
| **S-8** | GitHubCard `pb-2`，其他卡片 `pb-3` | `/github` 页 | 改为 `pb-3` |
| **S-9** | ConceptCard 和 WeeklyCard 未使用 `hover:shadow-md` | `/learn`, `/weekly` | 统一 hover 效果 |

### P2 — 信息架构优化（规划中期执行）

| # | 问题 | 建议 |
|---|------|------|
| **IA-1** | Learn/Guides 导航不可见 | 导航增加"学习"入口或下拉菜单 |
| **IA-2** | Hero 3 个同级 CTA 分散注意力 | 精简为 2 个（主 + 辅），第三个降级 |
| **IA-3** | Skills 和 MCP 搜索分离 | 考虑统一搜索入口（长期），或在搜索结果中互相引用 |
| **IA-4** | 周刊 → 工具缺少结构化链接 | 周刊详情页增加"本周提及工具"卡片区 |
| **IA-5** | Learn → 工具无推荐 | 概念详情页增加"推荐工具"关联区 |

### P3 — 竞品启发的功能增强（长期路线图）

| # | 功能 | 来源竞品 | 预期价值 |
|---|------|---------|---------|
| **F-1** | 详情页结构化模板（What is / How to / FAQ） | mcp.so | SEO + 内容一致性 |
| **F-2** | 卡片增加功能 Tag 展示（3-5 个能力标签） | opentools.ai | 降低点击决策成本 |
| **F-3** | 工具对比页（A vs B） | opentools.ai | SEO 长尾 + 用户价值 |
| **F-4** | design-spec 增加 `foreground/85` / `foreground/65` 文字层级 | linear.app | 详情页排版精细度 |

---

## 附录：竞品详情卡片

### opentools.ai 卡片结构
```
┌─ 缩略图 ──────────────────────────┐
│ [工具名]          ★4.2  ♡ 1.2K   │
│ 一句话描述（line-clamp-2）          │
│ [Tag] [Tag] [Tag] [Tag]           │
│ [Free] [#分类]                    │
└──────────────────────────────────┘
```

### glama.ai 卡片结构
```
┌──────────────────────────────────┐
│ [头像] [名称]        [Official]  │
│ [A级] [分类] [分类] [分类]       │
│ 120-180字描述                    │
│ 最后更新: 3天前  工具调用: 1.2K   │
└──────────────────────────────────┘
```

### mcp.so 详情页模板
```
┌── What is [工具名]? ─────────────┐
│  2-3 段描述                      │
├── How to use ────────────────────┤
│  JSON 配置代码块 + 多平台安装指南  │
├── Key Features ──────────────────┤
│  5-8 条功能列表                   │
├── Use Cases ─────────────────────┤
│  3-5 个使用场景                   │
├── FAQ ───────────────────────────┤
│  4-6 个 Q&A（结构化数据 SEO）     │
└──────────────────────────────────┘
```

---

## 执行建议

1. **本周**: 批量修复 P0（S-1 ~ S-3），约 30 分钟工作量
2. **下周**: 修复 P1（S-4 ~ S-9），更新 design-spec 补充 ContentBlock 规范
3. **本月**: 推进 P2 信息架构优化（IA-1 Learn 导航入口优先）
4. **下月**: 评估 P3 功能增强（F-1 结构化详情模板优先）
