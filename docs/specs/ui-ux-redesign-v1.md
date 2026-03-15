# SkillNav UI/UX 重构方案 v1
Status: draft
Date: 2026-03-08

> 依据: 4 份并行调研报告交叉验证

---

## 一、诊断总结

### 整体评分: 6.5/10

4 个维度调研交叉验证后，提炼出 6 个核心问题：

| # | 问题 | 严重度 | 调研印证 |
|---|------|--------|---------|
| 1 | **StatsBar 数据造假** — 13,000+ Skills / 25,000+ MAU 全部虚构 | P0 | 内部审计 + 用户旅程 |
| 2 | **文章详情页日期显示 ISO 字符串** — 显示 `2026-03-05T12:00:00Z` | P0 | 内部审计 |
| 3 | **三板块孤岛化** — Skills/Articles/MCP 零交叉引流 | P1 | 内部审计 + 用户旅程 + 竞品分析 |
| 4 | **导航缺乏高亮 + 信息架构混乱** — Skills/MCP 并列造成认知负担 | P1 | 内部审计 + 用户旅程 |
| 5 | **无全站搜索** — 用户不知该去哪搜 | P1 | 全部 4 份报告 |
| 6 | **卡片不可整卡点击 + 信息过载** — 违反交互预期 | P1 | 内部审计 + 竞品分析 |

### 相对优势（保持并强化）

- Deep Indigo 品牌色在中文站中独一无二（竞品 ai-bot.cn/36kr/机器之心 均无暗色模式）
- shadcn/ui + Tailwind 技术栈与 Supabase 设计系统天然兼容
- nuqs URL 驱动筛选、Suspense 流式加载已到位
- 168 精选 > 18,000 大全的"策展"定位，与 HelloGitHub/Glama 趋势一致

---

## 二、设计方向决策

### 推荐: Supabase 式品牌识别力（方向 A）

三个候选方向对比：

| 方向 | 核心 | 实施难度 | 适用阶段 |
|------|------|---------|---------|
| **A. Supabase 式 — 品牌识别力** | Deep Indigo 品牌色 + 技术信赖感 | **低** | **当前** |
| B. Raycast Store 式 — 搜索驱动 | Cmd+K 全局搜索即导航 | 中 | 数据量 500+ 后 |
| C. daily.dev 式 — 内容 Feed | 混合信息流首页 | 高 | 内容量充足后 |

**三个方向不互斥，按 A → B → C 逐步叠加。**

本次重构聚焦方向 A + 方向 B 的基础能力（首页搜索框），方向 C 推迟到内容量充足后。

### 设计原则（6 条）

1. **搜索即导航** — 搜索框是第一入口，不是辅助功能
2. **信息密度分层** — 列表页追求 3 秒可扫描，详情页追求信息完整
3. **品牌色即身份** — Deep Indigo 占视觉面积 <5%，但出现在所有关键交互点
4. **克制的动效** — Vercel 级别的克制，不是 Linear 的华丽
5. **内容优先排版** — 中文 16px 正文 + 1.75 行高
6. **暗色一等公民** — 每个新组件必须有暗色适配

---

## 三、实施方案

### Phase 0: 信任修复（立即，~1h）

解决两个 P0 问题，止血。

#### 0.1 StatsBar 真实数据

```
当前: 13,000+ Skills | 8,500+ 安全审计 | 25,000+ 月活 | 12% 周增长
改为: 168+ 精选工具 | 270+ 翻译资讯 | 13 一手信源 | 每日更新
```

文件: `src/components/home/stats-bar.tsx`

#### 0.2 文章详情页日期格式化

```
当前: 2026-03-05T12:00:00Z
改为: 2026年3月5日
```

文件: `src/components/articles/article-meta.tsx`
方法: `toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })`

---

### Phase 1: 体验基线修复（Week 1，~5h）

解决 P1 问题，让现有页面达到基本水准。

#### 1.1 导航高亮

当前: 所有导航项固定 `text-muted-foreground`，用户不知在哪个页面。

方案: 提取 `NavLinks` 为 client component，用 `usePathname()` 检测当前路由，active 项添加 `text-foreground font-medium`。同步修复 MobileNav。

文件: `src/components/layout/site-header.tsx`, `src/components/layout/mobile-nav.tsx`

#### 1.2 卡片整卡可点击

当前: SkillCard/ArticleCard 只有标题文字是 `<Link>`。

方案: 给标题 `<Link>` 添加 `after:absolute after:inset-0` 伪元素覆盖整卡，卡片容器添加 `relative`。

文件: `src/components/skills/skill-card.tsx`, `src/components/articles/article-card.tsx`

#### 1.3 卡片信息精简

当前 SkillCard 有 10 个信息元素（名称/作者/平台/安全/描述/编辑评语/分类/精选/Stars/来源），视觉过载。

方案: 列表页卡片移除编辑评语（保留在详情页），安全 badge 只显示高分（A/B tier），信息层级精简为：

```
名称 + 平台 badge          ← 识别层
一行描述                    ← 理解层
分类 + Stars + 作者         ← 决策层
```

#### 1.4 跨页面视觉一致性

| 问题 | 修复 |
|------|------|
| 容器宽度不统一 (6xl/5xl/3xl) | 列表页统一 `max-w-6xl`，Skill 详情页改为 `max-w-6xl`，Article 详情页保持 `max-w-3xl`（阅读体验） |
| MCP 页分类用 Badge 不可键盘访问 | 替换为 `Button variant="outline"`，与 Skills 页一致 |
| MCP 搜索框高度不一致 | 统一 `h-10` |
| 工具栏布局不统一 | 三个列表页统一为搜索行 + 筛选/分类行 + 结果计数行 |
| Footer 品牌描述过时 | 统一为"中文开发者的 AI 智能体工具站" |

#### 1.5 Skeleton 数量限制

当前 Skills 页渲染 24 个骨架卡片。改为 6 个，覆盖首屏即可。

---

### Phase 2: 首页重构（Week 2，~4h）

#### 2.1 Hero 区域升级

```
当前:
  标题: "发现最好用的 AI Agent 工具"
  副标题: "Skills · MCP · 实战资讯"
  CTA: [浏览 Skills] [MCP 导航]

改为:
  标题: "中文开发者的 AI 工具生态指南"
  副标题: "精选信源 · 编辑策展 · 每周更新"
  搜索框: [🔍 搜索 Skills、文章、MCP Server...]
  CTA: [浏览工具] [阅读周刊] [最新资讯]
```

改动理由:
- 标题从"发现工具"→"生态指南"：传达编辑价值而非纯目录
- 副标题用三个核心动作：暗示质量和更新节奏
- 增加搜索框：对效率猎手（画像 A）直接缩短路径
- 三个 CTA 覆盖三类用户画像

#### 2.2 StatsBar 改版（Phase 0 已完成数据替换，此处优化展示）

每个 stat 可点击，链接到对应页面:
- 168+ 精选工具 → /skills
- 270+ 翻译资讯 → /articles
- 13 一手信源 → /about（信源列表区域）

#### 2.3 首页模块重新排序

```
当前:                        改为:
1. HeroSection              1. Hero + 搜索框
2. StatsBar                  2. StatsBar (真实数据，可点击)
3. FeaturedSkills            3. 编辑精选区 (新增，无内容时隐藏)
4. LatestArticles            4. 精选 Skills (保持)
5. NewsletterCta             5. 最新资讯 (3-col，与 Skills 一致)
                             6. Newsletter CTA (保持)
```

#### 2.4 编辑精选区（新组件 `EditorialHighlights`）

```
┌─────────────────────────────────────────────────────┐
│  编辑精选                          查看全部 →         │
│                                                      │
│  ┌─────── 大卡片 ──────┐  ┌──── 列表 ────────────┐  │
│  │ SkillNav Weekly #3  │  │ · Claude Code 3.2    │  │
│  │ 本周 5 个精选工具    │  │   实战评测 (分析)     │  │
│  │ 3 篇值得读的文章    │  │                       │  │
│  │ [阅读完整周刊 →]    │  │ · MCP 安全配置指南   │  │
│  └─────────────────────┘  │   (教程)              │  │
│                            └───────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

**渐进策略**: `content_tier = 'editorial'` 记录为 0 时，整个模块 `return null`。第一期周刊发布后自动展示。

---

### Phase 3: 导航 & 信息架构（Week 2，~2h）

#### 3.1 导航结构调整

```
当前:  首页 | Skills | MCP 精选 | 资讯 | 关于  (5 项)
改为:  Skills | 周刊 | 资讯 | 关于              (4 项)
```

变更说明:
- 去掉"首页"：Logo 已承担回首页功能
- "周刊"独立导航项：内容战略 v2 的品牌核心，需要一级入口
- MCP 降级：移入 Footer 链接 + Skills 页增加 Tab 切换
- 不改 URL 结构：所有现有路由保持不变

#### 3.2 周刊路由（新增）

```
/weekly          — 周刊列表页（所有往期）
/weekly/[slug]   — 周刊详情页（slug: 2026-w11）
```

数据层: 复用 articles 表，`series = 'weekly'` 查询。

详情页专属模板:
- 目录导航（TOC）
- 往期切换（上/下期）
- 社交分享按钮
- Newsletter CTA

---

### Phase 4: 转化漏斗优化（Week 3，~3h）

#### 4.1 文章详情页 Newsletter CTA（最高 ROI 触点）

在 related articles 区之前插入轻量版订阅框:

```
┌────────────────────────────────────────────┐
│  📬 每周精选 AI 工具资讯，直达收件箱         │
│  [email input                ] [订阅]       │
└────────────────────────────────────────────┘
```

文件: `src/app/articles/[slug]/page.tsx`

#### 4.2 文章分享按钮

文章标题旁 + 底部阅读完毕处，添加:
- Twitter/X 分享（预填文案）
- 知乎分享
- 复制链接（+ toast "已复制"）

#### 4.3 Skill 详情页关联文章

在相关 Skills 区旁，基于 Skill 名称/分类搜索 articles 表，展示 2-3 篇相关文章。打破内容孤岛。

#### 4.4 文章详情页关联工具

文章底部增加"本文提及的工具"区域（需在翻译/编辑时标注 `mentioned_skills[]`，MVP 阶段可基于关键词匹配）。

---

### Phase 5: 细节打磨（Week 3-4，~3h）

#### 5.1 代码清理
- 删除 `skill-install.tsx`（已被 `skill-install-tabs.tsx` 替代）
- 提取 `CopyButton` 为 `src/components/shared/copy-button.tsx`（当前 3 处重复）
- 提取 `formatNumber` 为 `src/lib/utils.ts`（当前 4 处重复）

#### 5.2 Newsletter 后端接入
当前 `handleSubmit` 只做前端状态切换（`setSubmitted(true)`），TODO 注释标注 "integrate with Resend API"。

方案: 接入 Resend API，或暂时改为"即将推出"提示，避免欺骗用户。

#### 5.3 SectionHeader 支持 h1
当前硬编码 `<h2>`。列表页的标题应该是 `<h1>`（页面主标题）。

添加 `as` prop: `<SectionHeader as="h1" ... />`

#### 5.4 Giscus 评论
配置 `skillnav-dev/discussions` 仓库，填入 repoId 和 categoryId。或暂时移除空组件。

#### 5.5 移动端优化
- Select 下拉 `w-full sm:w-[140px]`（避免窄屏溢出）
- 分类横滚添加渐变遮罩指示器
- Skill 详情页移动端：关键元数据提取到 Hero 区域

---

## 四、不做什么

明确排除以下改动，避免过度工程化：

| 排除项 | 理由 |
|--------|------|
| Cmd+K 全局搜索面板 | 数据量 168 Skills 不足以支撑，首页搜索框足够 MVP |
| Feed 式首页 | 内容量不足，需要周刊稳定产出后再考虑 |
| Linear 风格渐变动效 | 已被过度模仿，且工具站用户来做事不看动画 |
| 全站重写/换设计系统 | 现有 shadcn/ui + Tailwind 完全胜任，不换 |
| 移动端底部 Tab Bar | 当前 4 个导航项用 Header 足够，底部 Tab 增加复杂度 |
| 个性化推荐 | 需要用户系统和行为数据，远超当前阶段 |
| MCP 数据迁入 Supabase | 重要但不紧急（仅 18 个 Server），推迟到 Phase 6 |

---

## 五、实施路线图

```
Phase 0: 信任修复          ~1h    ← 立即执行
Phase 1: 体验基线修复       ~5h    ← Week 1
Phase 2: 首页重构           ~4h    ← Week 2
Phase 3: 导航 & 信息架构    ~2h    ← Week 2
Phase 4: 转化漏斗优化       ~3h    ← Week 3
Phase 5: 细节打磨           ~3h    ← Week 3-4
                          ────────
                    总计   ~18h
```

---

## 六、成功指标

| 指标 | 当前基线 | 3 个月目标 | 追踪 |
|------|---------|-----------|------|
| 首页跳出率 | 未知 | <60% | Umami |
| 文章→Newsletter 转化率 | 0%（无入口） | 3-5% | Umami 事件 |
| 平均浏览深度 | 未知 | 2.5+ 页/会话 | Umami |
| 周刊打开率 | N/A | 40%+ | Resend |
| 社交分享次数/文章 | 0（无功能） | 2-5 | 自定义事件 |

---

## 七、调研报告索引

| 报告 | 路径 | 行数 |
|------|------|------|
| 内部 UI/UX 审计 | `docs/research/internal-ux-audit.md` | ~493 |
| 竞品 UI/UX 分析 | `docs/research/competitive-ux-analysis.md` | ~516 |
| 标杆站点设计拆解 | `docs/research/benchmark-design-analysis.md` | ~599 |
| 用户旅程 & 信息架构 | `docs/research/user-journey-ia-analysis.md` | ~569 |
