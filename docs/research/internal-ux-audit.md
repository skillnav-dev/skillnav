# SkillNav 内部 UI/UX 审计报告

## 审计概要

- **审计日期**: 2026-03-08
- **覆盖页面**: 8 个页面 + 全部布局/共享组件
- **覆盖组件**: 31 个组件文件
- **整体评分**: 6.5 / 10
- **审计方法**: 逐一阅读全部源文件，从视觉一致性、信息层级、交互体验、移动端适配、导航寻路、CTA 清晰度、品牌感七个维度进行分析

**总体印象**: 项目整体 UI 架构清晰，Tailwind + shadcn/ui 体系使用规范，深靛蓝品牌色贯穿始终。主要问题集中在：数据真实性（StatsBar 虚假数据）、页面间体验不一致（MCP 页缺乏与 Skills/Articles 对等的工具栏设计）、移动端细节缺失、以及多处功能性组件尚未接入（Newsletter、Giscus 评论）。

---

## 页面逐一审查

### 1. 首页 (`src/app/page.tsx`)

**当前状态**: 由 5 个 section 组成 -- HeroSection、StatsBar、FeaturedSkills、LatestArticles、NewsletterCta。结构清晰，信息层级合理。

**优点**:
- Hero 区域主副标题层次分明，CTA 按钮主次关系清晰（实心 "浏览 Skills" + 描边 "MCP 导航"）
- 响应式 CTA 按钮在移动端 full-width、桌面端 auto-width，触摸友好
- FeaturedSkills 和 LatestArticles 区域的 "查看全部" 链接在桌面端右上角、移动端底部居中，适配合理
- 渐变背景 `from-primary/5` 微妙而不喧宾夺主

**问题清单**:

| # | 问题 | 严重度 | 说明 |
|---|------|--------|------|
| 1 | **StatsBar 数据造假** | **P0** | "Skills 收录 13,000+"、"安全已审计 8,500+"、"月活跃用户 25,000+"、"周增长率 12%" 均为硬编码虚假数据。实际仅 168 个精选 Skills，无用户数据。这严重损害"专业可信赖"的品牌定位 |
| 2 | Newsletter 表单未接入后端 | P1 | `handleSubmit` 只做了 `setSubmitted(true)` 前端状态切换，TODO 注释标注 "integrate with Resend API"。用户提交邮箱后看到 "订阅成功"，但实际未保存任何数据 |
| 3 | Hero 区域缺少搜索入口 | P2 | 首页 Hero 只有两个导航按钮，没有搜索框。用户带着明确需求（如搜索某个 Skill）时无法直接行动 |
| 4 | FeaturedSkills 和 LatestArticles 之间无视觉分隔 | P2 | 两个 section 均为 `py-16` 白色背景，视觉上容易混为一体。StatsBar 有 `bg-muted/30` 背景色区分，但这两个 section 之间缺乏类似处理 |
| 5 | LatestArticles 网格为 2-col，与 FeaturedSkills 的 3-col 不一致 | P2 | 文章卡片使用 `sm:grid-cols-2`，Skills 使用 `sm:grid-cols-2 lg:grid-cols-3`。文章区域在桌面端只有 2 列显得过于稀疏 |

**改进建议**:
1. **P0**: 立即替换 StatsBar 数据为真实数据（168+ Skills、270+ 资讯、13 信源、每日更新），或改为 About 页的静态 stats 形式
2. **P1**: 暂时隐藏 Newsletter 表单或显示 "即将推出" 状态，避免欺骗用户
3. **P2**: 在 Hero 添加一个简单搜索框，跳转到 `/skills?q=xxx`
4. **P2**: 给 LatestArticles section 添加 `bg-muted/20` 背景或在两个 section 之间加分隔线

---

### 2. Skills 列表页 (`src/app/skills/page.tsx`)

**当前状态**: 完善的筛选工具栏（tabs + 搜索 + 平台筛选 + 排序 + 分类标签）+ 3-col 卡片网格 + 分页，使用 nuqs 管理 URL 参数，Suspense 加载状态。

**优点**:
- 工具栏设计完整：tabs（全部/精选/最新）、搜索、平台下拉、排序、分类按钮，覆盖了核心筛选需求
- URL 驱动的筛选状态，支持分享和浏览器后退
- 搜索输入有清除按钮（X），减少操作步骤
- 分页组件桌面端显示页码、移动端简化为 "1/7" 紧凑格式
- Skeleton 加载态与实际卡片布局匹配
- 分类按钮区域在移动端可横向滚动 (`overflow-x-auto`)，避免换行
- 结果计数文本在过渡中有 `opacity-50` 反馈

**问题清单**:

| # | 问题 | 严重度 | 说明 |
|---|------|--------|------|
| 6 | 卡片标题不是整卡可点击 | P1 | `SkillCard` 只有标题文字是 `<Link>`，卡片其余区域点击无反应。用户可能期望整卡可点击 |
| 7 | 卡片信息密度偏高 | P1 | 每张卡片包含：标题、作者、平台 badge、安全 badge、描述、编辑评语、分类 badge、精选 badge、Stars、来源 -- 最多 10 个信息元素，视觉过载 |
| 8 | 分类按钮与 Tabs 功能重叠 | P2 | "精选" tab 和分类按钮同时存在，用户可能困惑哪个是主筛选维度 |
| 9 | Skeleton 数量过多 | P2 | `SkillsSkeleton` 渲染 `PAGE_SIZE`（24）个骨架卡片，首屏 loading 时满屏闪动，体验不佳。应限制为 6-9 个 |
| 10 | 搜索无防抖视觉反馈 | P2 | 搜索输入有 300ms throttle，但输入时无 loading spinner 或 "搜索中..." 提示 |
| 11 | PlatformBadge 字号过小 | P2 | `text-[10px]` 在高 DPI 屏幕上勉强可读，在标准屏幕上可能太小 |

**改进建议**:
1. **P1**: 将整张卡片包裹为 `<Link>`，或添加 CSS `after:absolute after:inset-0` 使整卡可点击
2. **P1**: 考虑简化卡片信息层级 -- 移除编辑评语（保留在详情页），合并平台 + 安全 badge 为一行
3. **P2**: Skeleton 限制为 6 个，避免长页面闪动

---

### 3. Skill 详情页 (`src/app/skills/[slug]/page.tsx`)

**当前状态**: 面包屑 + Hero（标题/作者/描述/编辑评语） + 两栏布局（左 main: 安装 tabs + 文档 + 编辑评测 + 评论；右 sidebar: 元数据/标签/链接） + 相关 Skills。

**优点**:
- 两栏布局清晰，sidebar `sticky top-24` 跟随滚动
- 安装 tabs（Claude Code / Codex）支持多平台，命令可一键复制
- 文档区支持中英文切换，语言切换器设计精巧
- 面包屑导航提供完整返回路径
- 相关 Skills 区域用 `border-t` 分隔，独立于主内容
- SoftwareApplicationJsonLd 结构化数据完善

**问题清单**:

| # | 问题 | 严重度 | 说明 |
|---|------|--------|------|
| 12 | Giscus 评论未配置 | P1 | `GISCUS_CONFIG.repoId` 和 `categoryId` 均为空字符串，组件直接 `return null`。详情页缺少用户互动能力 |
| 13 | 容器宽度不一致 | P1 | 详情页使用 `max-w-5xl`，列表页使用 `max-w-6xl`。用户从列表跳转到详情时，内容区宽度突然收窄，视觉不连贯 |
| 14 | Hero 区域 h1 与 PlatformBadge 垂直不对齐 | P2 | `flex items-center gap-3` 将 badge 与标题居中对齐，但当标题折行时，badge 会在视觉上错位 |
| 15 | "已验证" Badge 孤零零出现 | P2 | `isVerified` 的 Badge 独占一行 (`mt-3`)，与其他元数据分离，视觉上不协调 |
| 16 | sidebar 在移动端排列在内容下方 | P2 | `grid-cols-1` 断点下 sidebar 排到最后，用户需要大量滚动才能看到元数据信息。考虑在移动端将关键元数据折叠到 Hero 区域 |
| 17 | 文档为空时的 "暂无文档内容" 提示单调 | P2 | 没有引导用户到 GitHub 查看源码或提供其他行动路径 |
| 18 | `SkillInstall` 组件已被 `SkillInstallTabs` 替代但仍保留 | P2 | `skill-install.tsx` 是旧版组件，与 `skill-install-tabs.tsx` 功能完全重复（含重复的 `CopyButton`），增加维护负担 |

**改进建议**:
1. **P1**: 配置 Giscus 或替换为其他评论方案（如 utterances），否则移除评论区入口
2. **P1**: 统一容器宽度为 `max-w-6xl`，或在详情页加宽内容区
3. **P2**: 移动端将 sidebar 关键信息（平台、分类、安全评分）提取为 Hero 区域内的 inline 展示

---

### 4. Articles 列表页 (`src/app/articles/page.tsx`)

**当前状态**: 与 Skills 列表页结构对等 -- SectionHeader + 工具栏（搜索 + 来源筛选 + 排序 + 分类标签） + 卡片网格 + 分页。

**优点**:
- 工具栏与 Skills 页模式一致，降低用户学习成本
- 分类标签使用 `ARTICLE_TYPE_LABELS` 映射中文，体验统一
- 文章卡片信息层级清晰：类型 Badge + 来源 + 日期 + 阅读时间 -> 标题 -> 摘要
- 空状态提示友好，有 "浏览全部文章" 按钮

**问题清单**:

| # | 问题 | 严重度 | 说明 |
|---|------|--------|------|
| 19 | 文章类型只有 3 种（tutorial/analysis/guide） | P1 | MEMORY 记录 6 种 article types，但 `ArticleType` 类型定义和 `ARTICLE_TYPE_LABELS` 只有 3 种。DB 中的 news/review/comparison/weekly 类型文章的分类 badge 会显示原始英文 key 而非中文标签 |
| 20 | 文章卡片缺少封面图 | P2 | `ArticleCard` 没有展示 `coverImage`，列表页全是纯文字卡片，视觉吸引力不足 |
| 21 | 卡片同样不是整卡可点击 | P1 | 与 SkillCard 相同问题，只有标题文字是 `<Link>` |
| 22 | 网格布局与 Skills 页不一致 | P2 | Articles grid 使用 `sm:grid-cols-2 lg:grid-cols-3`（代码中），但 MEMORY 记录为 "ARTICLES_PAGE_SIZE = 12, grid 2-col"。需要确认实际渲染效果 |
| 23 | 缺少 "没有更多筛选条件" 的清除入口 | P2 | Articles 工具栏没有 "清除全部筛选" 按钮，用户需要逐个取消 |

**改进建议**:
1. **P1**: 补全 `ArticleType` 类型定义和对应的 `ARTICLE_TYPE_LABELS`/`ARTICLE_TYPE_COLORS`，覆盖 DB 中实际存在的所有类型
2. **P2**: 为文章卡片添加封面图缩略图（有图时显示，无图时隐藏）
3. **P1**: 整卡可点击

---

### 5. Article 详情页 (`src/app/articles/[slug]/page.tsx`)

**当前状态**: 面包屑 + h1 + ArticleMeta + Hero Image + ArticleContent（ReactMarkdown） + 版权声明 + 相关文章。内容区 `max-w-3xl`。

**优点**:
- 文章内容区宽度限制为 `max-w-3xl`，阅读体验好，行宽适中
- 版权声明区域设计得体，明确标注编译来源
- ReactMarkdown + remarkGfm + rehypeHighlight 渲染链完善
- CodeBlock 组件有语言标签和复制按钮
- 外链自动在新标签页打开

**问题清单**:

| # | 问题 | 严重度 | 说明 |
|---|------|--------|------|
| 24 | **ArticleMeta 日期显示为原始 ISO 字符串** | **P0** | `article.publishedAt` 直接渲染，在 ArticleMeta 中没有格式化（只在 ArticleCard 中格式化了）。用户会看到 "2026-03-05T12:00:00Z" 这样的文本 |
| 25 | 没有 "返回列表" 的快捷按钮 | P2 | 面包屑可以返回，但文章底部读完后没有明确的 "返回资讯列表" CTA |
| 26 | 相关文章只显示 2 篇 | P2 | `related` 限制为 2 篇且只取同分类，如果分类文章少可能显示 0-1 篇甚至不显示 |
| 27 | FallbackImage 使用 `<img>` 而非 Next.js Image | P2 | 外部图片使用原生 `<img>` 绕过了 Next.js 的图片优化（resize/lazy/format），影响 LCP 性能 |
| 28 | 文章内容区缺少目录导航 | P2 | 长文章没有 TOC（Table of Contents），用户需要大量滚动 |

**改进建议**:
1. **P0**: 在 ArticleMeta 中使用 `toLocaleDateString('zh-CN')` 格式化日期
2. **P2**: 文章底部添加 "返回资讯" 按钮和上/下篇导航
3. **P2**: 为长文章自动生成侧边 TOC

---

### 6. MCP 导航页 (`src/app/mcp/page.tsx`)

**当前状态**: SectionHeader + client-side MCPGrid（搜索 + 分类 Badge 筛选 + 3-col 卡片网格）。使用静态 JSON 数据 (`mcp-servers.ts`)，全部在客户端筛选。

**优点**:
- 卡片设计紧凑，安装命令可直接点击复制
- 客户端搜索即时响应，无需服务端请求

**问题清单**:

| # | 问题 | 严重度 | 说明 |
|---|------|--------|------|
| 29 | 分类筛选使用 Badge 而非 Button | P1 | Skills 和 Articles 页用 `Button` 做分类筛选，MCP 页用 `Badge` + `cursor-pointer`。Badge 没有 focus 状态和键盘可访问性，且视觉上不像可点击元素 |
| 30 | 搜索框高度与其他页面不一致 | P2 | MCP 的 Input 没有 `h-10` class，会比 Skills/Articles 页的搜索框矮 |
| 31 | MCP Card 标题不可导航 | P1 | MCP Card 的 h3 是纯文本，没有链接。缺少详情页（目前 MCP 没有 `[slug]` 路由），外链图标 (`ExternalLink`) 只有一个小的 GitHub 链接 |
| 32 | 空状态设计简陋 | P2 | MCP 空状态只有一行 "没有找到匹配的 MCP Server"，没有图标、没有引导操作 |
| 33 | 缺少分页 | P2 | 当 MCP 数据量增长时，当前全量渲染无法扩展。但当前数据量较小，暂不紧急 |
| 34 | 工具栏布局与其他页面结构不同 | P2 | Skills/Articles 使用 `space-y-4` 分层（搜索行 + 分类行 + 计数行），MCP 使用 `flex-col sm:flex-row` 将搜索和分类放在同一行，结果计数独立一行 |

**改进建议**:
1. **P1**: 将 Badge 分类筛选替换为与 Skills 页一致的 Button 形式
2. **P1**: 考虑为 MCP 卡片添加外链或简单的展开详情面板
3. **P2**: 统一搜索框高度和工具栏布局结构

---

### 7. About 页面 (`src/app/about/page.tsx`)

**当前状态**: Hero + 痛点区域 + 解决方案 + 内容管线可视化 + 数据概览 + CTA + 联系方式。信息架构完整。

**优点**:
- 痛点 -> 方案 -> 行动的叙事逻辑清晰
- 内容管线可视化（信源 -> 抓取 -> 过滤 -> 发布）直观
- 数据概览使用真实数据（168+ Skills、270+ 资讯），与首页 StatsBar 的虚假数据形成对比
- CTA 区域有主次按钮 + 社交链接，转化路径完整

**问题清单**:

| # | 问题 | 严重度 | 说明 |
|---|------|--------|------|
| 35 | 内容管线箭头在移动端隐藏 | P2 | `sm:hidden` 隐藏了 "→" 连接符，移动端 4 个步骤变成垂直列表但没有视觉连接关系 |
| 36 | 痛点卡片和解决方案卡片样式几乎相同 | P2 | 唯一区别是图标背景色（destructive vs primary），缺少更明确的视觉对比来强调 "问题 vs 解决方案" |
| 37 | 数据概览的数字是硬编码的 | P2 | 与 StatsBar 同一个问题，但这里至少用了接近真实的数据。建议从 DB 动态获取或注明更新日期 |

**改进建议**:
1. **P2**: 在移动端用竖线或编号替代隐藏的箭头
2. **P2**: 解决方案区域使用不同的卡片样式（如加入左侧彩色边框）以区分痛点

---

### 8. 404 页面 (`src/app/not-found.tsx`)

**当前状态**: 居中布局，大号 "404" + "页面未找到" 文案 + "返回首页" 按钮。

**优点**:
- 简洁清晰，CTA 明确
- 404 数字使用 `text-primary/20` 淡化处理，不喧宾夺主
- 按钮带 Home 图标，语义明确

**问题清单**:

| # | 问题 | 严重度 | 说明 |
|---|------|--------|------|
| 38 | 缺少搜索框或其他导航选项 | P2 | 用户到达 404 通常是 URL 错误，提供搜索框或热门页面链接可以挽回用户 |
| 39 | 品牌感不足 | P2 | 没有 logo、没有品牌色装饰，看起来像一个通用 404 页面 |

**改进建议**:
- 添加搜索框和热门链接（Skills、资讯、MCP），提高挽回率

---

### 9. 布局组件 (`src/components/layout/`)

#### SiteHeader

**优点**:
- `sticky top-0` + `backdrop-blur-lg` + `bg-background/80` 毛玻璃效果专业
- 移动端汉堡菜单 + Sheet 侧滑面板，交互流畅
- Logo 区域（"S" 圆角方块 + "SkillNav"）简洁有识别度

**问题清单**:

| # | 问题 | 严重度 | 说明 |
|---|------|--------|------|
| 40 | 导航无当前页高亮 | **P1** | nav links 使用固定的 `text-muted-foreground`，没有 active 状态样式。用户无法从导航栏判断当前所在页面 |
| 41 | 移动端导航同样无当前页高亮 | P1 | Sheet 中的 nav links 也没有 active 状态 |
| 42 | Header 高度较矮 | P2 | `h-14`（56px）在移动端足够，但在桌面端导航项较少时显得略微紧凑 |
| 43 | 缺少 CTA 按钮 | P2 | Header 右侧只有主题切换，没有突出的操作入口（如 "提交 Skill" 或 "订阅"） |

**改进建议**:
1. **P1**: 使用 `usePathname()` 检测当前路由，为 active nav link 添加 `text-foreground font-semibold` 样式
2. **P2**: 考虑在 Header 右侧添加一个 CTA 按钮

#### SiteFooter

**优点**:
- Logo + 品牌描述 + 分组链接 + 版权声明，信息完整
- 分组布局 `grid-cols-2 md:grid-cols-4` 响应式合理

**问题清单**:

| # | 问题 | 严重度 | 说明 |
|---|------|--------|------|
| 44 | Footer 链接组只有两组（产品 + 社区） | P2 | `grid-cols-4` 布局中只有 3 列内容（logo + 2 groups），第 4 列空白。建议添加 "资源" 或 "关于" 组 |
| 45 | 品牌描述过时 | P2 | Footer 写 "中文世界的 AI Agent Skills 导航站"，而 About 页定位是 "中文开发者的 AI 工具生态指南"。品牌话术不统一 |
| 46 | 缺少社交媒体图标 | P2 | 社区链接只有文字 "GitHub" / "Twitter"，没有对应图标 |

#### MobileNav

**优点**:
- Sheet 组件使用正确，`SheetTitle` 满足 a11y 要求
- 点击导航项后 `setOpen(false)` 自动关闭，体验流畅

**问题清单**: 参见 #41（无 active 状态）。

#### ThemeToggle

**优点**:
- `useSyncExternalStore` 处理 hydration 问题，避免 lint 错误
- Sun/Moon 图标有 rotate + scale 过渡动画
- 未挂载时渲染空按钮骨架，避免布局跳动

**问题清单**: 无明显问题。

---

### 10. 共享组件 (`src/components/shared/`)

#### SectionHeader

**当前状态**: 简单的 h2 + description 组合，`text-2xl sm:text-3xl`。

**问题**:
| # | 问题 | 严重度 | 说明 |
|---|------|--------|------|
| 47 | SectionHeader 只能用 h2 | P2 | 语义上，列表页的 SectionHeader 应该是 h1（页面主标题），但组件硬编码为 h2。Skills 页和 Articles 页的页面标题被渲染为 h2，违反标题层级规范 |

#### SecurityBadge
- 设计精良，4 种安全等级有明确的颜色区分和图标，暗色模式适配。无明显问题。

#### PageBreadcrumb
- 使用 shadcn/ui Breadcrumb 组件，最后一级截断为 300px，合理。无明显问题。

#### FallbackImage
- 参见 #27。图片加载失败时显示品牌占位符（ImageOff + "SkillNav" 文字），用户体验好。

#### CodeBlock
- 语言标签 + 复制按钮 + 暗色模式代码高亮，功能完整。无明显问题。

---

### 11. 全局样式 (`src/app/globals.css`)

**优点**:
- 深靛蓝品牌色体系（hue 260）统一贯穿 light/dark 模式
- 语义化颜色变量完善（brand, cta, safe, warning, danger, unscanned）
- 暗色模式的 highlight.js 手动覆盖了 github-dark-dimmed 配色
- 行内代码有精致的 pill 样式（padding + border + background）
- 去除了 prose 中代码的默认引号（`::before`, `::after` content: none）

**问题清单**:

| # | 问题 | 严重度 | 说明 |
|---|------|--------|------|
| 48 | CTA 色（hue 185 青色）与品牌色（hue 260 靛蓝）对比度不足 | P2 | CTA 按钮实际使用 primary 色而非 cta 色，定义的 `--cta` 变量在整个项目中未被使用，相当于死代码 |
| 49 | 暗色模式的 border 透明度 | P2 | `--border: oklch(1 0 0 / 10%)` 在某些背景上可能过于微弱，边框几乎不可见 |

---

## 跨页面共性问题

### 一致性问题

| # | 问题 | 严重度 | 说明 |
|---|------|--------|------|
| 50 | **容器宽度不统一** | P1 | 列表页用 `max-w-6xl`，Skill 详情用 `max-w-5xl`，Article 详情用 `max-w-3xl`。Article 的窄宽度是合理的（阅读体验），但 Skill 详情页的 5xl 缺乏理由 |
| 51 | **卡片交互模式不统一** | P1 | SkillCard 和 ArticleCard 都只有标题可点击，MCPCard 完全不可导航。三种卡片应统一交互范式 |
| 52 | **formatNumber 函数重复定义** | P2 | `skill-card.tsx`、`skill-sidebar.tsx`、`skill-meta.tsx`、`mcp-card.tsx` 各自定义了功能相同的 `formatNumber` / `formatStars` 函数 |
| 53 | **CopyButton 组件重复 3 次** | P2 | `code-block.tsx`、`skill-install.tsx`、`skill-install-tabs.tsx` 各有独立的 CopyButton 实现 |
| 54 | **工具栏布局模式不统一** | P1 | Skills 页有 3 层工具栏（tabs + 搜索/筛选 + 分类），Articles 页有 2 层（搜索/筛选 + 分类），MCP 页有 1 层（搜索 + badge 并排）。视觉节奏混乱 |

### 移动端问题

| # | 问题 | 严重度 | 说明 |
|---|------|--------|------|
| 55 | **Select 下拉框在移动端宽度固定** | P1 | `w-[140px]` 和 `w-[120px]` 硬编码宽度，在窄屏下可能超出容器或与搜索框比例失调 |
| 56 | 分类按钮横滚无滚动指示器 | P2 | `-mx-4 overflow-x-auto` 实现了横滚，但没有渐变遮罩或指示器提示用户可以继续滑动 |
| 57 | Skill 详情页 sidebar 在移动端位置不合理 | P2 | 参见 #16，关键元数据在移动端需要滚动到页面底部才能看到 |
| 58 | 分页按钮触摸目标偏小 | P2 | `min-w-9`（36px）略低于推荐的 44px 最小触摸目标 |

### 交互问题

| # | 问题 | 严重度 | 说明 |
|---|------|--------|------|
| 59 | **无全局搜索** | P1 | 每个列表页有独立搜索，但没有全站搜索。用户不确定要搜 Skill 还是 Article 时需要分别尝试 |
| 60 | 页面间跳转无过渡动画 | P2 | 页面切换是硬刷新，没有 loading bar 或过渡效果。Next.js 可以使用 `next/navigation` 的 loading state |
| 61 | 外部链接无视觉标记 | P2 | GitHub、来源链接等外部链接除了 ExternalLink 图标外，没有统一的外链标识符（如小箭头或不同下划线样式） |

---

## 问题汇总表

| # | 页面/组件 | 问题 | 严重度 |
|---|-----------|------|--------|
| 1 | 首页 StatsBar | 数据造假（13,000+ Skills, 25,000+ 月活） | **P0** |
| 2 | 首页 Newsletter | 表单未接入后端，假装订阅成功 | P1 |
| 3 | 首页 Hero | 缺少搜索入口 | P2 |
| 4 | 首页 | FeaturedSkills 和 LatestArticles 之间无视觉分隔 | P2 |
| 5 | 首页 | LatestArticles 网格 2-col 在桌面端过于稀疏 | P2 |
| 6 | Skills 列表 | 卡片不是整卡可点击 | P1 |
| 7 | Skills 列表 | 卡片信息密度过高（10 个元素） | P1 |
| 8 | Skills 列表 | 分类按钮与 Tabs 功能重叠易混淆 | P2 |
| 9 | Skills 列表 | Skeleton 数量过多（24 个） | P2 |
| 10 | Skills 列表 | 搜索输入无 loading 反馈 | P2 |
| 11 | Skills 列表 | PlatformBadge 字号 10px 过小 | P2 |
| 12 | Skill 详情 | Giscus 评论未配置，组件空渲染 | P1 |
| 13 | Skill 详情 | 容器宽度与列表页不一致 | P1 |
| 14 | Skill 详情 | h1 与 PlatformBadge 折行时对齐问题 | P2 |
| 15 | Skill 详情 | "已验证" Badge 孤零零独占一行 | P2 |
| 16 | Skill 详情 | 移动端 sidebar 排在最底部 | P2 |
| 17 | Skill 详情 | 文档为空时无引导操作 | P2 |
| 18 | Skill 详情 | skill-install.tsx 旧组件未清理 | P2 |
| 19 | Articles 列表 | ArticleType 定义只有 3 种，DB 实际 6 种 | P1 |
| 20 | Articles 列表 | 文章卡片缺少封面图 | P2 |
| 21 | Articles 列表 | 卡片不是整卡可点击 | P1 |
| 22 | Articles 列表 | 网格列数需确认一致性 | P2 |
| 23 | Articles 列表 | 缺少 "清除全部筛选" 按钮 | P2 |
| 24 | Article 详情 | **日期显示为原始 ISO 字符串** | **P0** |
| 25 | Article 详情 | 文章底部缺少 "返回列表" 按钮 | P2 |
| 26 | Article 详情 | 相关文章限制 2 篇，可能不足 | P2 |
| 27 | Article 详情 | FallbackImage 用 img 未走 Next.js 优化 | P2 |
| 28 | Article 详情 | 长文章缺少 TOC 目录导航 | P2 |
| 29 | MCP 导航 | 分类筛选用 Badge 而非 Button，不可键盘访问 | P1 |
| 30 | MCP 导航 | 搜索框高度不一致 | P2 |
| 31 | MCP 导航 | 卡片无详情页或展开面板 | P1 |
| 32 | MCP 导航 | 空状态设计简陋 | P2 |
| 33 | MCP 导航 | 缺少分页 | P2 |
| 34 | MCP 导航 | 工具栏布局与其他页面不统一 | P2 |
| 35 | About | 内容管线箭头移动端隐藏无替代 | P2 |
| 36 | About | 痛点/方案卡片样式区分不够 | P2 |
| 37 | About | 数据概览数字硬编码 | P2 |
| 38 | 404 | 缺少搜索框或热门链接 | P2 |
| 39 | 404 | 品牌感不足 | P2 |
| 40 | Header | **导航无当前页高亮** | P1 |
| 41 | MobileNav | 导航无当前页高亮 | P1 |
| 42 | Header | 桌面端高度略紧凑 | P2 |
| 43 | Header | 缺少 CTA 按钮 | P2 |
| 44 | Footer | 链接组只有 2 组，grid-cols-4 有空列 | P2 |
| 45 | Footer | 品牌描述与 About 页不一致 | P2 |
| 46 | Footer | 社区链接缺少图标 | P2 |
| 47 | SectionHeader | h2 硬编码导致列表页标题层级错误 | P2 |
| 48 | globals.css | CTA 色变量定义但未使用 | P2 |
| 49 | globals.css | 暗色模式 border 过于微弱 | P2 |
| 50 | 跨页面 | 容器宽度不统一（6xl/5xl/3xl） | P1 |
| 51 | 跨页面 | 卡片交互范式不统一 | P1 |
| 52 | 跨页面 | formatNumber 函数重复定义 | P2 |
| 53 | 跨页面 | CopyButton 组件重复 3 次 | P2 |
| 54 | 跨页面 | 工具栏布局模式不统一 | P1 |
| 55 | 移动端 | Select 下拉固定宽度可能溢出 | P1 |
| 56 | 移动端 | 分类横滚无滚动指示器 | P2 |
| 57 | 移动端 | Skill 详情 sidebar 排位不合理 | P2 |
| 58 | 移动端 | 分页按钮触摸目标偏小 | P2 |
| 59 | 全局 | 无全站搜索 | P1 |
| 60 | 全局 | 页面跳转无过渡动画 | P2 |
| 61 | 全局 | 外部链接无统一视觉标识 | P2 |

---

## Top 10 优先修复项

按影响力和实现难度综合排序：

### 1. [P0] 首页 StatsBar 数据造假 (#1)
**影响**: 直接损害 "专业可信赖" 的品牌定位，一旦被用户发现会严重伤害信任。
**方案**: 替换为真实数据（168+ 精选工具、270+ 翻译资讯、13 一手信源、每日更新），或重构为 About 页同样的 stats 布局。
**工作量**: ~15 分钟

### 2. [P0] Article 详情页日期显示原始 ISO 字符串 (#24)
**影响**: 直接影响用户阅读体验，显示 "2026-03-05T12:00:00Z" 极不专业。
**方案**: 在 `ArticleMeta` 中用 `toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })` 格式化。
**工作量**: ~5 分钟

### 3. [P1] Header 导航无当前页高亮 (#40, #41)
**影响**: 用户无法从导航栏判断当前位置，导航寻路体验差。
**方案**: 使用 `usePathname()` + `cn()` 为当前路由的 nav link 添加 `text-foreground` 样式。Header 需改为 client component 或将 nav 拆为 client component。
**工作量**: ~30 分钟

### 4. [P1] 卡片不是整卡可点击 (#6, #21, #51)
**影响**: 违反常见的卡片交互预期，降低点击率。
**方案**: 在 `SkillCard` 和 `ArticleCard` 中添加 CSS `after:absolute after:inset-0` 到标题 Link 上，使整卡都是点击热区。
**工作量**: ~20 分钟

### 5. [P1] Newsletter 表单未接入后端 (#2)
**影响**: 用户提交邮箱后数据丢失，损害信任。
**方案 A**: 接入 Resend API。**方案 B**: 暂时替换为 "即将推出" 提示或直接隐藏。
**工作量**: 方案 B ~10 分钟，方案 A ~2 小时

### 6. [P1] ArticleType 定义不完整 (#19)
**影响**: DB 中 news/review/comparison/weekly 类型文章的分类 Badge 显示原始英文 key。
**方案**: 在 `types.ts` 和 `article-constants.ts` 中补全所有 6 种类型的 label 和 color。
**工作量**: ~15 分钟

### 7. [P1] MCP 页分类筛选 a11y 问题 (#29)
**影响**: Badge 不可键盘导航，不满足无障碍要求。
**方案**: 替换为与 Skills 页一致的 `Button variant="outline"` 形式。
**工作量**: ~15 分钟

### 8. [P1] 跨页面工具栏布局不统一 (#34, #54)
**影响**: 用户在不同列表页之间切换时，工具栏交互模式不一致，增加认知负担。
**方案**: 统一三个列表页的工具栏为相同的分层结构（搜索行 + 筛选行 + 计数行）。
**工作量**: ~1 小时

### 9. [P1] Giscus 评论未配置 (#12)
**影响**: Skill 详情页缺少用户互动能力，组件存在但不渲染，浪费代码空间。
**方案 A**: 创建 `skillnav-dev/discussions` 公共仓库，配置 Giscus。**方案 B**: 暂时移除评论区代码。
**工作量**: 方案 A ~30 分钟，方案 B ~5 分钟

### 10. [P1] 移动端 Select 固定宽度可能溢出 (#55)
**影响**: 在窄屏（320px 宽度）下，搜索框 + 两个 Select 可能超出视口。
**方案**: 移动端将 Select 换行为 full-width，或改为 responsive width（`w-full sm:w-[140px]`）。
**工作量**: ~15 分钟

---

## 附录：未使用/可清理组件

| 文件 | 说明 |
|------|------|
| `src/components/skills/skill-install.tsx` | 已被 `skill-install-tabs.tsx` 替代，可删除 |
| `src/components/skills/skill-meta.tsx` | 详情页已使用 `skill-sidebar.tsx` 替代 metadata 展示，`skill-meta.tsx` 仅被废弃，可删除 |
| `--cta` / `--cta-foreground` CSS 变量 | 已定义但项目中未引用，可保留备用或删除 |
