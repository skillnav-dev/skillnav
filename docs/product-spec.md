# SkillNav 产品规格 v1.0

> 产品结构契约：信息架构、用户旅程、状态权限、数据分析。
> 与 `design-spec.md` 互补——本文件管"怎么运转"，那份管"长什么样"。
>
> AI 生成 UI 代码时必须同时参考两份文件。

---

## 0. 使用说明

### 0.1 标记约定

- `[FILL]` — 项目必须填写（当前未确定）
- `[DEFAULT: 值]` — 推荐默认值，可覆盖
- `-> DS:x.x` — 见 design-spec.md 对应章节
- `-> PS:x.x` — 见本文件对应章节

### 0.2 共享组件词汇表

> 本文件与 `design-spec.md` 使用相同的组件名称。

#### 基础组件（shadcn/ui）

| 规范名称 | 含义 | 使用场景 | DS 章节 |
|---------|------|---------|--------|
| Button | 按钮（default/outline/ghost/destructive） | CTA、筛选、操作 | DS:4.1 |
| Input | 单行文本输入框 | 搜索框、表单 | DS:4.2 |
| Textarea | 多行文本输入框 | Admin 编辑器 | DS:4.2 |
| Select | 下拉选择器 | 排序、筛选 | DS:4.2 |
| Checkbox | 复选框 | Admin 批量选择 | DS:4.2 |
| Card | 圆角卡片容器 | 工具卡片、文章卡片 | DS:4.3 |
| Badge | 小标签 | 分类、质量等级、文章类型 | DS:4.4 |
| Table | 数据表格 | Admin 管理列表 | shadcn 默认 |
| Tabs | 选项卡切换 | 安装方式、Admin 筛选 | shadcn 默认 |
| Sheet | 侧边抽屉 | 移动端导航 | DS:4.6 |
| DropdownMenu | 下拉操作菜单 | Admin 状态切换 | DS:4.6 |
| Toast | 短暂非阻断消息（Sonner） | 复制成功、操作反馈 | DS:4.7 |
| Breadcrumb | 面包屑导航 | 详情页层级 | DS:4.5 |

#### 项目自定义组件

| 规范名称 | 含义 | 使用场景 | DS 章节 |
|---------|------|---------|--------|
| SkillCard | Skill 工具卡片 | Skills 列表、首页精选 | DS:4.3 |
| ArticleCard | 文章卡片 | 文章列表、首页 | DS:4.3 |
| MCPCard | MCP Server 卡片 | MCP 列表、首页精选 | DS:4.3 |
| Toolbar | 搜索+筛选+排序工具栏 | 三个列表页顶部 | DS:4.9 |
| ScrollFade | 横滚容器+渐变遮罩 | 移动端 Toolbar 溢出 | DS:4.9 |
| Skeleton | 脉冲动画加载占位 | Suspense fallback | DS:4.7 |
| EmptyState | 无数据占位 | 列表空结果 | DS:4.7 |
| SectionHeader | 区域标题+描述 | 首页 section、列表页 | DS:4.9 |
| SecurityBadge | 安全评分徽章 | Skill 卡片/详情 | DS:4.4 |
| FreshnessBadge | 时效性徽章 | Skill/MCP 卡片 | DS:4.4 |
| PlatformBadge | 平台标识 | Skill 卡片/详情 | DS:4.4 |
| CopyButton | 复制按钮+确认动画 | 安装命令、代码块 | DS:4.1 |
| CodeBlock | 代码块+语言标签 | 文章/README | DS:4.9 |
| ShareButtons | 社交分享按钮组 | 详情页 | DS:4.9 |
| Pagination | 分页控件 | 所有列表页 | DS:4.5 |
| GiscusComments | GitHub Discussions 评论 | Skills/MCP 详情 | DS:4.9 |
| InlineNewsletterCta | 行内订阅卡片 | 文章详情页 | DS:4.9 |
| ScenarioShortcuts | 场景快捷标签组 | 首页 Hero 下方 | DS:4.9 |
| SkillMeta | Skill 元信息行（桌面端） | Skill 详情页 | DS:6.2 |
| SkillMobileMeta | Skill 元信息行（移动端） | Skill 详情页 | DS:6.2 |
| SkillInstallTabs | 安装命令标签页 | Skill 详情页 | DS:6.2 |
| SkillSidebar | Skill 侧边栏 | Skill 详情页 | DS:6.2 |
| SkillContent | Skill Markdown 内容 | Skill 详情页 | DS:6.2 |
| ArticleMeta | 文章元信息行 | 文章详情页 | DS:6.3 |
| ArticleContent | 文章 Markdown 内容 | 文章详情页 | DS:6.3 |
| McpDetailSidebar | MCP 侧边栏 | MCP 详情页 | DS:6.2 |
| McpReadme | MCP README 折叠渲染 | MCP 详情页 | DS:6.2 |

### 0.3 版本信息

- 模板版本：1.0.0
- 项目规格版本：1.0.0
- 最后更新：2026-03-15

---

## 1. 产品定义

### 1.1 产品定位

中文开发者的 AI 智能体工具站——通过编辑策展 Skills、MCP Server 和实战资讯，帮助开发者发现、评估和使用 AI Agent 工具。

核心差异化：**编辑策展**（不是爬虫大全）+ **中文一等公民**（翻译+原创）+ **三板块联动**（Skills × MCP × 资讯）。

### 1.2 目标用户画像

| 画像 | 角色 | 使用场景 | 痛点 | 目标 |
|------|------|---------|------|------|
| A. 效率猎手 | 高级开发者 | 快速找到某个特定工具 | 信息分散、质量参差、英文门槛 | 30 秒内找到可信工具并安装 |
| B. 趋势跟踪者 | 技术经理/架构师 | 跟踪 AI Agent 生态动态 | 信息过载、噪声太多 | 每周花 10 分钟了解关键变化 |
| C. 新手探索者 | 初级开发者 | 了解 AI Agent 工具生态全貌 | 不知道从哪里开始 | 按场景发现适合的工具 |

### 1.3 核心价值主张

| 要素 | 描述 |
|------|------|
| 核心价值 | 经过策展和翻译的 AI Agent 工具信息，中文开发者可直接消费 |
| Aha 时刻 | 用户在 Skill/MCP 详情页看到中文描述+安装命令+编辑点评，一键复制即可使用 |
| 激活标准 | 用户浏览 >= 2 个工具详情页 或 复制了安装命令 |

### 1.4 核心飞轮

```
资讯翻译(引流) -> 工具导航(留存) -> Skill 套件(变现)
     ^                                    |
     |____________________________________|
```

---

## 2. 信息架构

### 2.1 站点地图

```
skillnav.dev
+-- /                                  [公开] 首页（组合页）
+-- /skills                            [公开] Skills 列表页
|   +-- /skills/[slug]                 [公开] Skill 详情页
+-- /mcp                               [公开] MCP Server 列表页
|   +-- /mcp/[slug]                    [公开] MCP Server 详情页
+-- /articles                          [公开] 资讯列表页
|   +-- /articles/[slug]              [公开] 文章详情页
+-- /weekly                            [公开] 周刊列表页（存根）
|   +-- /weekly/[slug]                [公开] 周刊详情页（存根）
+-- /github                            [公开] GitHub 开源项目
+-- /about                             [公开] 关于页面
+-- /en/skills                         [公开] Skills 列表（英文）
|   +-- /en/skills/[slug]             [公开] Skill 详情（英文）
+-- /en/mcp                            [公开] MCP 列表（英文）
|   +-- /en/mcp/[slug]                [公开] MCP 详情（英文）
+-- /admin                             [管理员] 仪表盘
|   +-- /admin/login                   [公开] 管理员登录
|   +-- /admin/articles                [管理员] 文章管理
|   |   +-- /admin/articles/[id]/edit  [管理员] 文章编辑
|   +-- /admin/skills                  [管理员] Skills 管理
|   |   +-- /admin/skills/[id]/edit    [管理员] Skill 编辑
|   +-- /admin/mcp                     [管理员] MCP 管理
|       +-- /admin/mcp/[id]/edit       [管理员] MCP 编辑
+-- /sitemap.xml                        SEO
+-- /robots.txt                         SEO
+-- /llms.txt                           AI 爬虫索引
```

规则：
- 导航深度：最多 3 层（列表 -> 详情 -> 编辑）
- 所有页面可从导航或链接到达，无孤立页面
- `/weekly` 和 `/weekly/[slug]` 为存根，内容就绪后激活

### 2.2 导航模型

#### 主导航（Header）

| 项目 | 路由 | 说明 |
|------|------|------|
| Skills | `/skills` | 工具导航 |
| MCP | `/mcp` | MCP Server 目录（未来可能并入 Skills Tab） |
| 周刊 | `/weekly` | 编辑精选周刊 |
| 资讯 | `/articles` | 翻译+原创资讯 |
| 关于 | `/about` | 关于 SkillNav |

规则：
- Logo 点击回首页，不单独设"首页"导航项
- 当前页面导航项高亮：`text-foreground font-medium`
- 移动端：汉堡菜单触发 Sheet -> DS:4.6
- 英文路由（`/en/*`）、GitHub 页、Admin 不在主导航

#### 辅助导航

| 类型 | 使用场景 |
|------|---------|
| Breadcrumb | 所有详情页（首页 > 列表 > 当前页） -> DS:4.5 |
| Footer 链接 | 产品区（Skills/MCP/Articles）+ 社区区（GitHub/Twitter） |
| hreflang 切换 | Skill/MCP 详情页底部"View in English"/"查看中文版" |

### 2.3 路由规范

| 页面 | 路由 | 参数 | 示例 |
|------|------|------|------|
| 首页 | `/` | — | — |
| Skills 列表 | `/skills` | `?q=&category=&tab=&sort=&page=` | `/skills?category=coding&sort=stars` |
| Skill 详情 | `/skills/[slug]` | — | `/skills/claude-code-memory` |
| MCP 列表 | `/mcp` | `?q=&category=&sort=&tier=&page=` | `/mcp?tier=A&sort=stars` |
| MCP 详情 | `/mcp/[slug]` | — | `/mcp/supabase-mcp` |
| 文章列表 | `/articles` | `?q=&category=&source=&sort=&page=` | `/articles?category=tutorial` |
| 文章详情 | `/articles/[slug]` | — | `/articles/claude-code-3-2` |
| 周刊列表 | `/weekly` | — | — |
| 周刊详情 | `/weekly/[slug]` | — | `/weekly/2026-w11` |
| GitHub | `/github` | — | — |
| 关于 | `/about` | — | — |
| 英文 Skills | `/en/skills` | — | — |
| 英文 Skill | `/en/skills/[slug]` | — | `/en/skills/claude-code-memory` |
| 英文 MCP | `/en/mcp` | `?q=&category=&sort=&tier=&page=` | — |
| 英文 MCP 详 | `/en/mcp/[slug]` | — | `/en/mcp/supabase-mcp` |

规则：
- 路由命名：kebab-case，名词复数（`/skills`，`/articles`）
- 筛选/搜索用 query params（nuqs 驱动），资源标识用 path params
- 分页用 `page` 参数，每页 [DEFAULT: 24] 条
- query params 变更不触发全页刷新（Suspense 流式更新）

### 2.4 内容模型

#### 实体定义

| 实体 | 核心属性 | 说明 |
|------|---------|------|
| Skill | slug, name, nameZh, author, category, tags[], description, descriptionZh, stars, securityScore, qualityTier, freshness, installCommand, platform | AI Agent 工具（Claude Skills / 通用） |
| Article | slug, title, titleZh, category(ArticleType), source, contentTier, content, contentZh, series, publishedAt | 翻译/原创资讯 |
| McpServer | slug, name, author, category, tags[], description, descriptionZh, stars, qualityTier, toolsCount, tools[], installCommand, freshness | MCP Server 工具 |
| Submission | skillName, skillUrl, submitterEmail, description, status | 用户提交的工具推荐（未激活） |

#### 实体关系

```
[Skill] --tag--> [Article]       "文章提及的工具"（关键词匹配）
[Skill] --category--> [McpServer] "同分类的 MCP Server"
[Article] --series--> [Weekly]    "周刊包含文章精选"（series='weekly'）
[Skill/McpServer] --slug--> [EnglishPage]  "中英文双语页面"
```

关系均为松耦合（基于分类/标签/关键词匹配），无外键约束。

#### 多语言字段

| 实体 | 需要本地化的字段 | 存储策略 |
|------|----------------|---------|
| Skill | name/nameZh, description/descriptionZh, content/contentZh, introZh | 字段后缀 `_zh` |
| Article | title/titleZh, summary/summaryZh, content/contentZh, introZh | 字段后缀 `_zh` |
| McpServer | name/nameZh, description/descriptionZh, introZh | 字段后缀 `_zh` |

### 2.5 搜索与发现

| 维度 | 值 |
|------|---|
| 可搜索实体 | Skills、Articles、MCP Servers（各自独立搜索） |
| 搜索输入 | 文本输入 + 防抖 [DEFAULT: 300ms]，URL 同步（`?q=`） |
| 筛选维度 | 分类（category）、来源（source/tab）、质量等级（tier）、排序（sort） |
| 排序选项 | Stars（默认）/ 最新 / 名称；文章按发布日期 |
| 无结果处理 | EmptyState -> DS:4.7：SearchX 图标 + "没有找到匹配的结果" + 清除筛选按钮 |
| 首页搜索 | Hero 区搜索框 -> 跳转 `/skills?q=` |
| 场景快捷入口 | 首页 10 个场景标签 -> 跳转 `/skills?category=` |

---

## 3. 用户旅程

### 3.1 旅程地图格式

| 阶段 | 用户目标 | 页面/触点 | 用户行为 | 组件 | 系统响应 | 情绪 |
|------|---------|----------|---------|------|---------|------|
| [阶段名] | [想要什么] | [路由] | [操作] | [组件名] | [系统做什么] | [+/-] |

### 3.2 核心旅程：首次体验（效率猎手）

> 画像 A 从搜索引擎/社交媒体进入，目标是找到一个特定工具。

| 阶段 | 用户目标 | 页面/触点 | 用户行为 | 组件 | 系统响应 | 情绪 |
|------|---------|----------|---------|------|---------|------|
| 着陆 | 了解这是什么站 | `/` | 扫描 Hero 标题+副标题 | HeroSection | 展示定位语+实时数据统计 | 中性 |
| 搜索 | 找到目标工具 | `/` | 在 Hero 搜索框输入关键词 | HeroSearch, Input | 跳转到 `/skills?q=关键词` | 期待 |
| 浏览结果 | 筛选和比较 | `/skills` | 扫描卡片列表，看 Stars/分类/描述 | SkillCard, Toolbar | 展示筛选后的 Grid + 总数 | 判断 |
| 深入 | 评估工具质量 | `/skills/[slug]` | 阅读描述、编辑点评、安装方式 | SkillContent, SkillSidebar | 展示完整信息 + 安装命令 | 好奇 |
| **Aha** | 获得可用工具 | `/skills/[slug]` | 点击 CopyButton 复制安装命令 | CopyButton, Toast | 复制成功 + Toast 确认 | **满足** |
| 探索 | 发现更多 | `/skills/[slug]` | 浏览相关 Skills/MCP/Articles | SkillCard, MCPCard, ArticleCard | 展示关联推荐 | 好奇 |

Aha 时刻：用户复制安装命令的瞬间——从"看"转为"用"。
激活指标：用户在首次会话中复制了安装命令 或 浏览了 >= 2 个详情页。

### 3.3 核心旅程：首次体验（趋势跟踪者）

> 画像 B 从 Newsletter 或社交分享进入，目标是快速了解本周动态。

| 阶段 | 用户目标 | 页面/触点 | 用户行为 | 组件 | 系统响应 | 情绪 |
|------|---------|----------|---------|------|---------|------|
| 着陆 | 阅读本周周刊 | `/weekly/[slug]` | 直接进入周刊详情 | ArticleContent | 展示三栏内容（文章+工具+生态） | 期待 |
| 扫描 | 快速获取要点 | `/weekly/[slug]` | 滚动浏览标题和摘要 | CodeBlock, Badge | 结构化内容、可扫描 | 满足 |
| 深入 | 某个工具感兴趣 | `/skills/[slug]` | 点击周刊中的工具链接 | SkillCard | 跳转到工具详情 | 好奇 |
| 留存 | 下周继续看 | `/weekly/[slug]` | 订阅 Newsletter | InlineNewsletterCta | 收集邮箱 + 确认 | 正面 |

### 3.4 核心旅程：主价值循环

> 回访用户的典型使用流程，跨三个板块。

| 阶段 | 用户目标 | 页面/触点 | 用户行为 | 组件 | 系统响应 | 情绪 |
|------|---------|----------|---------|------|---------|------|
| 入口 | 看最新内容 | `/` | 查看 EditorialHighlights + FeaturedTools | EditorialHighlights, FeaturedTools | 展示最新周刊+精选工具+趋势工具 | 期待 |
| 发现 | 浏览新工具 | `/skills` 或 `/mcp` | 按排序"最新"浏览、筛选分类 | Toolbar, SkillCard/MCPCard | 展示新增工具 + FreshnessBadge | 好奇 |
| 阅读 | 学习新技术 | `/articles` | 按分类浏览最新资讯 | ArticleCard, Toolbar | 展示翻译/原创文章列表 | 专注 |
| 使用 | 安装新工具 | `/skills/[slug]` | 复制安装命令 | CopyButton | 复制成功 | 满足 |
| 分享 | 推荐给同事 | `/articles/[slug]` | 点击 ShareButtons | ShareButtons, Toast | 生成分享链接 | 正面 |

循环频率：每周 1-2 次（与周刊节奏同步）。

### 3.5 支线旅程

#### 场景探索（新手）

| 阶段 | 用户目标 | 页面/触点 | 用户行为 | 备注 |
|------|---------|----------|---------|------|
| 着陆 | 不知道找什么 | `/` | 浏览场景快捷标签 | ScenarioShortcuts 10 个场景 |
| 筛选 | 按场景浏览 | `/skills?category=X` | 点击场景标签跳转 | 自动带分类筛选 |
| 比较 | 选择合适工具 | `/skills` | 逐个查看卡片信息 | Stars + SecurityBadge 辅助决策 |

#### 英文用户

| 阶段 | 用户目标 | 页面/触点 | 用户行为 | 备注 |
|------|---------|----------|---------|------|
| 着陆 | 找 AI Agent 工具 | `/en/skills` 或 `/en/mcp` | 通过搜索引擎进入英文页 | hreflang SEO 引流 |
| 浏览 | 查看工具列表 | `/en/skills` | 浏览精简版列表 | 无 Toolbar/筛选，全量展示 |
| 详情 | 查看工具信息 | `/en/skills/[slug]` | 阅读英文描述 + 安装命令 | 无编辑点评、无评论 |

#### 管理员工作流

| 阶段 | 用户目标 | 页面/触点 | 用户行为 | 备注 |
|------|---------|----------|---------|------|
| 登录 | 进入后台 | `/admin/login` | 输入密码 | 密码认证，无用户名 |
| 总览 | 查看数据概况 | `/admin` | 查看 Skills/Articles/MCP 统计 | 三板块各自的计数和状态分布 |
| 管理 | 编辑内容 | `/admin/articles` | 筛选 → 选择 → 编辑/批量操作 | 支持批量发布/隐藏/删除 |
| 编辑 | 修改单条内容 | `/admin/articles/[id]/edit` | 修改字段 → 保存/发布 | Markdown 预览 + 原文对照 |

### 3.6 旅程间衔接

#### 入口/出口映射

| 来源旅程 | 出口点 | 目标旅程 | 入口点 | 触发条件 |
|---------|--------|---------|--------|---------|
| 首次体验 | Aha 时刻（复制命令） | 主价值循环 | 相关推荐区域 | 用户继续浏览 |
| 首次体验 | 文章详情底部 | Newsletter 订阅 | InlineNewsletterCta | 用户读完文章 |
| 主价值循环 | 周刊阅读 | 工具深入 | 周刊内链接 | 用户点击工具名 |
| 文章阅读 | 底部"提及的工具" | 工具详情 | 相关 Skills 区 | 文章提及工具名 |
| 工具详情 | 相关文章区 | 文章阅读 | 文章详情页 | 点击相关文章 |

#### 中断恢复

| 旅程 | 中断点 | 恢复策略 | 实现方式 |
|------|--------|---------|---------|
| 搜索/筛选 | 已设置筛选条件 | 保留筛选条件 | URL query params（nuqs），浏览器前进/后退保持 |
| 列表浏览 | 已翻到某页 | 保留分页位置 | URL `?page=N` |
| 详情阅读 | 阅读中途离开 | 无特殊恢复 | 浏览器历史记录 |

---

## 4. 页面注册与职责

### 4.1 页面注册表

| 页面名称 | 路由 | 类型 | 所属旅程 | 前置页面 | 后续页面 | 访问级别 |
|---------|------|------|---------|---------|---------|---------|
| 首页 | `/` | 组合页 | 所有旅程入口 | — | Skills/MCP/Articles/Weekly | 公开 |
| Skills 列表 | `/skills` | 列表 | 发现工具 | 首页/导航 | Skill 详情 | 公开 |
| Skill 详情 | `/skills/[slug]` | 详情 | 评估工具 | Skills 列表 | 相关 Skills/MCP/Articles | 公开 |
| MCP 列表 | `/mcp` | 列表 | 发现工具 | 首页/导航 | MCP 详情 | 公开 |
| MCP 详情 | `/mcp/[slug]` | 详情 | 评估工具 | MCP 列表 | 相关 MCP/Skills | 公开 |
| 文章列表 | `/articles` | 列表 | 阅读资讯 | 首页/导航 | 文章详情 | 公开 |
| 文章详情 | `/articles/[slug]` | 详情 | 深度阅读 | 文章列表 | 相关文章/工具 | 公开 |
| 周刊列表 | `/weekly` | 列表 | 趋势跟踪 | 导航 | 周刊详情 | 公开 |
| 周刊详情 | `/weekly/[slug]` | 详情 | 趋势跟踪 | 周刊列表/Newsletter | 工具详情/文章详情 | 公开 |
| GitHub | `/github` | 列表 | 开源发现 | Footer | 外部 GitHub 链接 | 公开 |
| 关于 | `/about` | 静态 | 了解产品 | 导航 | Skills/Articles | 公开 |
| EN Skills 列表 | `/en/skills` | 列表 | 英文用户 | 搜索引擎 | EN Skill 详情 | 公开 |
| EN Skill 详情 | `/en/skills/[slug]` | 详情 | 英文用户 | EN Skills 列表 | 中文版链接 | 公开 |
| EN MCP 列表 | `/en/mcp` | 列表 | 英文用户 | 搜索引擎 | EN MCP 详情 | 公开 |
| EN MCP 详情 | `/en/mcp/[slug]` | 详情 | 英文用户 | EN MCP 列表 | 中文版链接 | 公开 |
| Admin 仪表盘 | `/admin` | 仪表盘 | 管理 | 登录 | 管理列表 | 管理员 |
| Admin 登录 | `/admin/login` | 表单 | 认证 | — | Admin 仪表盘 | 公开 |
| Admin 文章管理 | `/admin/articles` | 管理列表 | 内容管理 | Admin 仪表盘 | 文章编辑 | 管理员 |
| Admin 文章编辑 | `/admin/articles/[id]/edit` | 编辑表单 | 内容编辑 | Admin 文章管理 | Admin 文章管理 | 管理员 |
| Admin Skills 管理 | `/admin/skills` | 管理列表 | 内容管理 | Admin 仪表盘 | Skill 编辑 | 管理员 |
| Admin Skill 编辑 | `/admin/skills/[id]/edit` | 编辑表单 | 内容编辑 | Admin Skills 管理 | Admin Skills 管理 | 管理员 |
| Admin MCP 管理 | `/admin/mcp` | 管理列表 | 内容管理 | Admin 仪表盘 | MCP 编辑 | 管理员 |
| Admin MCP 编辑 | `/admin/mcp/[id]/edit` | 编辑表单 | 内容编辑 | Admin MCP 管理 | Admin MCP 管理 | 管理员 |

页面类型对应设计规范的组合模式（-> DS:6）：
- `列表` -> DS:6.1 ListingPage
- `详情` -> DS:6.2 DetailPage（工具）/ DS:6.3 ArticlePage（文章）
- `静态` -> DS:6.4 StaticPage
- `管理列表` / `编辑表单` -> DS:6.5 AdminListPage / AdminEditPage
- `组合页` -> 首页专用，多 section 组合
- `仪表盘` -> Admin 专用

### 4.2 页面状态矩阵

> 每个页面在每种状态下用户看到什么。

#### 列表页（Skills / Articles / MCP）

| 状态 | 用户看到什么 | 组件 |
|------|------------|------|
| 首次加载 | 6 个 Skeleton 卡片 | Skeleton -> DS:4.7 |
| 有数据 | Grid 卡片 + Toolbar + Pagination | SkillCard/ArticleCard/MCPCard |
| 空数据（无筛选） | EmptyState："暂无内容" | EmptyState -> DS:4.7 |
| 空数据（有筛选） | EmptyState："没有找到匹配的结果" + 清除筛选 Button | EmptyState -> DS:4.7 |
| 加载更多（翻页） | Skeleton 替换 Grid 区域（Suspense 边界） | Skeleton |
| 错误 | Next.js 默认错误页（无自定义 error.tsx） | — |

#### 详情页（Skill / MCP / Article）

| 状态 | 用户看到什么 | 组件 |
|------|------------|------|
| 首次加载 | 服务端渲染，无客户端加载态（SSG/ISR） | — |
| 有数据 | 完整详情内容 + 侧边栏 + 相关推荐 | 各详情组件 |
| 不存在 | Next.js 404 页面 | not-found.tsx |
| 内容为空 | 仍展示页面骨架，内容区空白 | — |

#### 首页

| 状态 | 用户看到什么 | 组件 |
|------|------------|------|
| 正常 | Hero + StatsBar + EditorialHighlights + FeaturedTools + LatestArticles | 各 section 组件 |
| 无周刊 | EditorialHighlights 隐藏周刊大卡，只显示编辑精选文章 | EditorialHighlights |
| 无编辑精选 | EditorialHighlights 整个 section `return null` | — |
| 数据库不可用 | 回退到 mock 数据 | DAL fallback |

#### Admin 页面

| 状态 | 用户看到什么 | 组件 |
|------|------------|------|
| 未认证 | 重定向到 `/admin/login` | — |
| 已认证 | Admin nav + 对应页面内容 | Admin layout |
| 登录失败 | 表单内错误提示 | Input + 错误文字 |
| 编辑保存成功 | Toast："保存成功" | Toast -> DS:4.7 |
| 编辑保存失败 | Toast："保存失败" + 错误信息 | Toast -> DS:4.7 |

### 4.3 页面间数据流

| 来源页面 | 目标页面 | 传递数据 | 传递方式 |
|---------|---------|---------|---------|
| 首页搜索 | Skills 列表 | `q: string` | URL 参数 `/skills?q=` |
| 场景标签 | Skills 列表 | `category: string` | URL 参数 `/skills?category=` |
| 列表页 | 详情页 | `slug: string` | Path 参数 `/skills/[slug]` |
| 详情页 | 相关详情页 | `slug: string` | Path 参数（Link 组件） |
| Admin 列表 | Admin 编辑 | `id: string` | Path 参数 `/admin/articles/[id]/edit` |
| Admin 编辑 | Admin 列表 | — | `redirect()` 或 `router.back()` |

规则：传 slug/id，不传完整对象——目标页面自行从数据库获取。

---

## 5. 用户状态与权限

### 5.1 用户状态机

> SkillNav 当前无用户注册系统，只有两种角色。

#### 状态定义

| 状态 | 说明 | 可访问功能范围 |
|------|------|-------------|
| `visitor` | 未登录访客 | 所有公开页面：浏览、搜索、筛选、复制安装命令、阅读文章、评论（GitHub 登录） |
| `admin` | 管理员（密码登录） | visitor 功能 + Admin 后台：内容管理、批量操作、数据统计 |

#### 状态转换

```
visitor + 输入管理员密码 -> admin  [设置 auth cookie]
admin   + 退出登录       -> visitor [清除 auth cookie]
```

### 5.2 权限矩阵

| 功能/页面 | visitor | admin |
|----------|---------|-------|
| 浏览公开页面 | 是 | 是 |
| 搜索/筛选 | 是 | 是 |
| 复制安装命令 | 是 | 是 |
| 社交分享 | 是 | 是 |
| Giscus 评论 | 是（需 GitHub 登录） | 是 |
| 查看 Admin 仪表盘 | 否 -> 重定向到登录 | 是 |
| 编辑/发布/删除内容 | 否 | 是 |
| 批量操作 | 否 | 是 |

#### 权限拒绝行为

| 拒绝原因 | 用户看到什么 | 操作 |
|---------|------------|------|
| 未登录访问 `/admin/*` | 重定向到 `/admin/login` | 登录后重定向回请求页面 |
| 登录密码错误 | 表单内错误消息 | 重新输入 |

---

## 7. 异常旅程与边界场景

### 7.1 异常目录

| 异常 | 触发条件 | 用户看到什么 | 恢复路径 |
|------|---------|------------|---------|
| 页面不存在 | 404 slug 不匹配 | 自定义 not-found.tsx：回首页链接 | 点击回首页 |
| 数据库不可用 | Supabase 连接失败 | 回退到 mock 数据（开发）/ 构建缓存（ISR） | 自动恢复 |
| 搜索无结果 | 查询/筛选无匹配 | EmptyState + 清除筛选按钮 | 清除筛选或修改关键词 |
| 网络超时 | 请求超过超时阈值 | Next.js 默认错误页 | 刷新页面 |
| 复制失败 | 浏览器不支持 Clipboard API | 无视觉反馈（静默失败） | 手动选择文本复制 |
| Admin 会话过期 | Auth cookie 过期/无效 | 重定向到登录页 | 重新登录 |
| Admin 保存冲突 | 并发编辑同一条记录 | 最后保存者覆盖（无冲突检测） | — |
| README 加载失败 | GitHub API 限流/不可用 | MCP 详情页 README 区域空白 | 提供 GitHub 直链 |

### 7.2 降级策略

| 功能 | 降级行为 | 用户影响 |
|------|---------|---------|
| Supabase 查询 | DAL 回退到 mock 数据（本地开发） | 数据不是最新，但页面可用 |
| SSG 页面 | ISR 缓存（24h），即使数据库短暂不可用也能提供内容 | 数据最多延迟 24h |
| Giscus 评论 | 加载失败时隐藏评论区 | 轻微——核心功能不受影响 |
| Umami 统计 | 静默失败 | 无——用户不可见 |
| 图片加载 | FallbackImage：展示 ImageOff 占位图标 | 轻微——布局保持 |
| Newsletter 订阅 | 当前为"即将推出"状态 | 无——用户知晓 |

### 7.3 数据边界

| 边界情况 | 条件 | 处理方式 |
|---------|------|---------|
| 空列表 | 实体 0 条记录（含筛选后） | EmptyState + 清除筛选或引导文案 -> DS:4.7 |
| 大数据量 | MCP 5,172 条、Skills 309 条 | 分页（每页 24 条）+ Suspense 流式加载 |
| 长描述 | 描述超出卡片空间 | `line-clamp-2` 截断 -> DS:4.3 |
| 长标题 | 标题超出一行 | `line-clamp-1` 截断（需要时） |
| 缺失字段 | 可选字段（nameZh、descriptionZh）为空 | 回退到英文原文（name、description） |
| Markdown 内容过长 | Skill/MCP README 超出视口 | 折叠到 600px + "展开更多"按钮 |
| Stars 为 0 | 新工具无 Stars 数据 | 显示 "0"，不隐藏 Stars 区域 |
| 无安装命令 | installCommand 为空 | 隐藏安装命令区域 |

---

## 8. 数据分析（轻量）

### 8.1 北极星指标

| 指标 | 定义 | 追踪 |
|------|------|------|
| 周活跃访客 | 每周至少访问 1 个详情页的独立访客 | Umami |

### 8.2 核心事件

| 事件 | 触发点 | 追踪方式 |
|------|--------|---------|
| 页面浏览 | 所有页面 | Umami 自动采集 |
| 搜索提交 | Toolbar 搜索框 / Hero 搜索框 | Umami 事件（`search_submit`, `{query, page}`） |
| 安装命令复制 | CopyButton 点击 | Umami 事件（`install_copy`, `{slug, type}`） |
| 分享点击 | ShareButtons 点击 | Umami 事件（`share_click`, `{slug, platform}`） |
| 外部链接点击 | GitHub/npm 链接 | Umami 事件（`outbound_click`, `{slug, target}`） |
| Newsletter 订阅 | InlineNewsletterCta 提交 | [FILL: Resend API 接入后] |

### 8.3 事件命名规范

| 规则 | 约定 | 示例 |
|------|------|------|
| 格式 | `snake_case`，`名词_动词` | `install_copy`、`search_submit` |
| 页面浏览 | Umami 自动采集，不手动埋点 | — |
| 用户操作 | `{对象}_{动作}` | `share_click`、`filter_change` |

---

## 9. 走查清单

### 信息架构
- [x] 所有页面已在站点地图（-> PS:2.1）和页面注册表（-> PS:4.1）中登记
- [x] 每个页面都有明确的前置/后续页面连接
- [x] 导航深度 <= 3 层
- [x] 无孤立页面
- [x] 路由命名符合规范（-> PS:2.3）

### 用户旅程
- [x] 核心旅程已覆盖：首次体验（两种画像）+ 主价值循环
- [x] 每个旅程阶段都定义了页面、行为和系统响应
- [x] 旅程入口/出口已映射（-> PS:3.6）
- [x] 筛选/分页中断有恢复策略（URL params）
- [ ] 转化/付费旅程——当前无，待商业化阶段补充

### 页面状态
- [x] 列表页定义了全部 6 种状态（-> PS:4.2）
- [x] 空状态有上下文相关的文案和操作入口
- [x] 加载状态使用 Skeleton
- [ ] 缺少自定义 error.tsx 错误边界——使用 Next.js 默认

### 权限
- [x] 用户状态机覆盖所有状态和转换（-> PS:5.1）
- [x] 权限矩阵覆盖所有功能（-> PS:5.2）
- [x] 权限拒绝有明确行为（重定向到登录）

### 异常
- [x] 所有已知异常已编目（-> PS:7.1）
- [x] 非核心功能定义了降级策略（-> PS:7.2）
- [x] 数据边界已处理（-> PS:7.3）

### 跨规范一致性
- [x] 组件名称与共享词汇表一致（-> PS:0.2 和 DS:4）
- [x] 页面类型与组合模式对应（-> PS:4.1 和 DS:6）
- [x] 错误/空/加载状态使用 design-spec 定义的组件

---

## 10. 国际化（i18n）

### 10.1 范围

| 问题 | 答案 |
|------|------|
| v1 是否需要 i18n？ | 是（部分） |
| 支持的语言 | zh-CN（默认）、en |
| 默认语言 | zh-CN |
| 语言检测 | URL 前缀（`/en/`） |

### 10.2 当前实现

| 领域 | 实现状态 |
|------|---------|
| 路由 | `/en/skills`、`/en/mcp` 有英文版；文章、周刊、关于无英文版（中文编辑内容为护城河） |
| 内容模型 | 字段后缀策略：`name/nameZh`、`description/descriptionZh` |
| hreflang | Skill 和 MCP 详情页设置了 `zh-CN` <-> `en` 互指 |
| 页面差异 | 英文版精简：无 Toolbar/筛选（EN Skills）、无编辑点评、无评论、无 README |
| 日期/数字 | 中文页用 `zh-CN` locale 格式化，英文页用默认格式 |

---

## 11. 版本管理

### 11.1 变更日志

```
## [1.0.0] - 2026-03-15

### 新增
- 初始版本：完整站点产品规格
- 覆盖 23 个页面的信息架构和状态矩阵
- 3 条核心旅程 + 3 条支线旅程
- 共享组件词汇表（14 基础 + 17 自定义）
```
