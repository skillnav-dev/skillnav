# 标杆站点设计拆解

> 分析日期: 2026-03-08
> 目标: 为 SkillNav (skillnav.dev) 的视觉升级提供设计灵感与可执行建议
> SkillNav 定位: 中文开发者的 AI 智能体工具站（Skills / MCP / 实战资讯）

---

## 分析概要

- **分析站点**: 9 个，覆盖 3 种类型 — 开发者工具站(4)、开发者内容/社区站(3)、工具目录/市场(2)
- **核心发现**:
  1. 2025-2026 开发者工具站的设计主旋律是「暗色优先 + 极简信息层级 + 微动效」，Linear 风格已成行业标配
  2. 工具导航/市场类站点的核心挑战是「信息密度 vs 可浏览性」的平衡，Raycast Store 和 npm 代表两个极端
  3. 混合型站点（工具 + 内容）最适合的范式是「首页聚合 + 垂直频道」，参考 daily.dev + Supabase 的组合模式
  4. 搜索体验是工具导航站的第一竞争力，`Cmd+K` 全局搜索已成标配

---

## 站点逐一拆解

### 1. Vercel

**设计哲学**: 极简主义 + 性能即美学。以「速度感」为核心隐喻，一切视觉元素服务于「快」的心智。设计系统 Geist 是其灵魂 — 受瑞士设计运动启发，追求几何纯净与功能优先。

**首页架构**:
- **首屏**: 大标题 + 渐变动画背景 + 单一 CTA（"Start Deploying"），极端克制
- **模块组织**: Hero → 功能特性（分块卡片，大量留白）→ 客户 Logo 社会证明 → 代码演示（交互式）→ 底部 CTA + 页脚
- **滚动深度**: 约 5-6 屏，每屏聚焦单一信息

**导航**:
- 顶部粘性导航，Logo + 产品/方案/资源/企业/价格 + 搜索 + 登录/注册
- 下拉 Mega Menu，分列展示子项
- 无侧边栏，无面包屑（首页/营销页）；文档页有侧边导航

**搜索**: 全局 `Cmd+K` 快捷键，即时模糊搜索，覆盖文档/产品/模板

**配色 & 排版**:
- **主色**: 纯黑 `#000` + 纯白 `#fff`，品牌蓝极少使用（仅 accent）
- **暗色模式**: 默认暗色，高对比度色彩系统
- **字体**: Geist Sans（无衬线，几何感）+ Geist Mono（代码），受 Inter/Univers/SF Pro 影响
- **排版层级**: 清晰的 5 级层级（Hero 72px → H1 48px → H2 32px → Body 16px → Caption 14px）
- **间距**: 大量留白，section 间距 120px+，元素间距 24-32px

**卡片设计**: 极简白卡（暗模式下深灰卡），薄边框 1px，大圆角 12-16px，hover 时边框发光

**动效**: 非常克制 — 页面滚动渐显、hover 边框发光、代码预览动画、主题切换过渡。无华丽 3D 或粒子效果

**可借鉴点**:
- Geist 设计系统的严谨度和一致性
- 「少即是多」的首屏策略 — 一个标题、一个 CTA
- 大留白创造呼吸感和高端感
- `Cmd+K` 全局搜索模式

---

### 2. Linear

**设计哲学**: 「暗色 = 高端」的极致演绎。2025 版进一步削减色彩，从暗蓝灰转向纯黑白 + 极少量品牌色点缀。核心理念是「工具的品质体现在每一个像素的打磨」。

**首页架构**:
- **首屏**: 暗色满屏 + 发光文字标题 + 产品截图 + 轨道渐变动画
- **模块组织**: 垂直线性布局（名副其实），每个 section 完整一屏，滚动触发展示
- **滚动深度**: 8-10 屏，深度长页，但每屏信息量极低（1 特性 / 屏）

**导航**:
- 极简顶部导航：Logo + Features/Method/Customers/Changelog/Pricing/Company + 登录/注册
- 导航栏半透明毛玻璃效果
- 产品内部使用侧边栏 + 面包屑

**搜索**: 产品内 `Cmd+K` 命令面板，网站端无独立搜索

**配色 & 排版**:
- **主色**: 接近纯黑背景 `#0A0A0B` + 白色文字 + 品牌紫/蓝作为渐变 accent
- **2025 变化**: 大幅削减彩色，更单色化
- **字体**: 自定义无衬线（接近 Inter 风格），极细到中粗多种字重
- **排版**: 标题超大（80-96px），行高紧凑（1.1-1.2），字间距略负

**动效**: Linear 式动效 = 行业标杆
- 滚动触发的元素渐显（fade + slide up）
- 产品截图的视差滚动
- 渐变色流动动画
- 鼠标跟随的发光效果
- 关键帧精准的 easing（非线性缓动）
- 技术栈: CSS transitions + Framer Motion

**可借鉴点**:
- 渐变光效作为品牌识别（无需 Logo 也能识别）
- 滚动触发动效让长页不无聊
- 暗色模式下的色彩层级处理（用亮度区分层级，非颜色）
- 对字间距和行高的极致打磨

**注意**: Linear 风格已被过度模仿（所谓 "Linear-style SaaS landing page"），直接照搬会显得跟风

---

### 3. Raycast

**设计哲学**: 「搜索即导航」。作为 launcher + extension store，整个产品体验围绕搜索栏构建。网站设计延续产品的「快速、精准、高密度」气质。

**首页架构**:
- **首屏**: 产品 demo 动画 + 核心价值主张 + 下载 CTA
- **模块组织**: Hero → 功能展示（AI/搜索/扩展/自动化）→ Extension Store 入口 → 用户评价 → 定价

**Store 页面**（核心参考对象）:
- **布局**: 顶部搜索栏（极大、居中）→ 分类标签横向滚动 → 网格卡片列表
- **搜索**: 中央大搜索栏，支持即时模糊匹配（item title + keywords），右侧下拉筛选器
- **分类**: Design Tools / Developer Tools / Productivity / AI 等，横向标签切换
- **卡片**: 图标 + 名称 + 描述 + 作者 + 安装数，紧凑排列
- **分页**: 无限滚动 + 懒加载

**配色 & 排版**:
- **主色**: 暗色背景 + 彩色渐变 accent（品牌橙红/粉紫）
- **字体**: 系统字体栈，重视可读性
- **排版**: 紧凑但不拥挤，充分利用图标辅助扫描

**动效**: 产品级流畅 — 搜索结果即时更新、列表项 hover 高亮、侧滑详情面板

**可借鉴点**:
- **Extension Store 是 SkillNav Skills 列表页的最佳参考** — 搜索优先 + 分类标签 + 网格卡片
- 搜索栏的突出位置和大尺寸，传达「搜索是第一入口」
- 图标在卡片中的关键作用（快速视觉识别）
- 暗/亮主题需要分别配置图标

---

### 4. Supabase

**设计哲学**: 「开发者信赖感」。在暗色潮流中走出自己的路 — 标志性翠绿色 + 暗色背景，暗示「终端成功信号」，传达技术可靠性。基于 Radix + shadcn/ui 构建设计系统。

**首页架构**:
- **首屏**: 代码片段 + 产品价值主张 + Start Project / 查看文档双 CTA
- **模块组织**: Hero → 产品矩阵（Database/Auth/Storage/Edge Functions/Realtime/AI）→ 客户案例 → 社区/GitHub Star 数 → 定价

**导航**:
- 顶部: Logo + Product(Mega Menu) / Developers / Pricing / Blog + 搜索 + Dashboard
- 文档: 左侧固定侧边栏 + 右侧 TOC
- Dashboard: 侧边栏 + cmd+K 命令面板
- **2026 新增**: 每个文档页「Copy as Markdown」+ 直接丢给 ChatGPT/Claude 的按钮

**搜索**: 全局 `Cmd+K`，搜索覆盖文档/Dashboard/API Reference

**配色 & 排版**:
- **品牌色**: Jungle Green `#34B27B`（主角色）+ Bunker `#11181C`（暗背景）+ Athens Gray `#F8F9FA`（亮背景）
- **暗色模式 token**: `oklch(0.13 0.02 160)` 背景 + `oklch(0.70 0.18 155)` 绿色 accent
- **字体**: 自定义无衬线 + 等宽字体
- **排版**: 开发者友好的信息密度，不过分留白

**可借鉴点**:
- **品牌色即身份** — 看到翠绿色就知道是 Supabase，SkillNav 的 Deep Indigo 也应该做到这一点
- 基于 shadcn/ui 的设计系统 — 与 SkillNav 技术栈完全一致，可直接学习其 token 映射方式
- 产品矩阵卡片的展示方式（图标 + 标题 + 一句话描述 + 入口）
- 文档的「Copy as Markdown」功能 — AI 时代的文档设计前瞻性

---

### 5. daily.dev

**设计哲学**: 「个性化信息流」。核心交互模型是 Feed（信息流），而非传统的目录/列表。通过标签/源/算法三重维度实现千人千面。

**首页/Feed 架构**:
- **首屏**: 个性化 Feed 即首页（登录后），新用户看到 onboarding 引导选择感兴趣的标签
- **模块组织**: 搜索/筛选栏 → 信息流卡片（无限滚动）→ 侧边栏（趋势/推荐）
- **Feed 类型**: My Feed（个性化）/ Popular（算法排序）/ Most Upvoted / Best Discussions

**导航**:
- 左侧固定侧边栏: Feed 切换 / Bookmarks / History / Squads（社区小组）
- 顶部: 搜索 + 通知 + 个人菜单
- 无面包屑（信息流模式不需要层级）

**搜索**: 顶部搜索栏，搜索文章标题/标签/源

**卡片设计**（关键参考）:
- **文章卡片**: 封面图 + 标题 + 来源 icon + 阅读时间 + upvote/comment 数
- **信息密度**: 中等 — 每行 2-3 张卡片（响应式）
- **交互**: hover 放大、点击展开摘要/跳转原文
- **标签**: 每张卡片底部 2-3 个技术标签 badge

**配色 & 排版**:
- **主色**: 暗色背景优先 + 品牌紫色 accent
- **卡片**: 暗灰背景卡片，微妙边框
- **字体**: 系统字体，标题 16-18px，正文 14px

**可借鉴点**:
- **SkillNav 资讯频道的最佳参考** — Feed 式布局 + 标签筛选 + upvote 机制
- 个性化 onboarding（选标签 → 生成定制 Feed）
- 卡片上的「阅读时间」标签 — 简单但有效的用户体验提升
- 左侧固定导航 + 右侧趋势面板的三栏布局

---

### 6. dev.to

**设计哲学**: 「社区优先的极简主义」。有意保持低技术感的外观（类似 Reddit/HN 的朴素），降低社区创作门槛。性能优先 — 极少 JavaScript，接近纯 HTML/CSS 渲染。

**首页架构**:
- **首屏**: 顶部导航 + 搜索 → Feed 列表（左主栏 + 右侧边栏）
- **模块组织**: 主栏 = 文章 Feed（按热度/最新排序）；右侧栏 = 标签列表/活动/广告
- **滚动深度**: 无限滚动 Feed

**导航**:
- 顶部: Logo + 搜索栏（居中/左置）+ 登录/注册
- 左侧: 标签/主题导航（可折叠）
- 无 Mega Menu，无复杂层级

**搜索**: 中央搜索栏，搜索文章/标签/人，结果页列表展示

**卡片设计**:
- **极简卡片**: 标题（大字）+ 作者头像/名 + 标签 badge + 反应数/评论数 + 阅读时间
- **可选封面图**: 有则全宽展示，无则纯文字
- **信息密度**: 高 — 卡片纵向排列，视觉接近博客归档页
- **交互**: hover 仅标题变色，无放大/阴影

**配色 & 排版**:
- **主色**: 白色背景 + 深灰文字 + 品牌蓝/靛蓝 accent
- **暗色模式**: 支持，暗灰背景
- **字体**: 系统字体栈，大标题 24px+，正文 16-18px，行高宽松 1.6+
- **风格**: 故意的「朴素感」— 无渐变、无阴影、无动画

**可借鉴点**:
- 纯内容卡片的极简设计 — 证明好内容不需要华丽包装
- 标签系统的设计（多色 badge，点击跳转标签聚合页）
- 高可读性排版（大字号 + 宽行高 + 充足段间距）
- 社区参与机制（heart/unicorn/bookmark 反应按钮）

**注意**: dev.to 的「朴素」是有意为之的社区策略，不适合工具导航站的「专业/权威」定位

---

### 7. Product Hunt

**设计哲学**: 「每日发现的仪式感」。以日期为分界的列表设计创造"每天都有新东西"的期待。投票机制是核心互动 — 简单的 upvote 驱动产品排名。

**首页架构**:
- **首屏**: Today's Products 列表（按投票排序）
- **模块组织**: 日期分隔 → 产品列表（每日 15-20 个）→ 分类入口 / 精选集合
- **滚动深度**: 1 天的列表约 3-5 屏

**导航**:
- 顶部: Logo + Launches/Products/News/Community + 搜索 + Submit + 登录
- 分类: Topics / Collections 入口
- 产品详情: 通过列表项点击进入独立页面

**搜索**: 顶部搜索，搜索产品/主题/用户

**卡片/列表设计**（关键参考）:
- **列表项**: 产品图标（方形，圆角）+ 名称 + 一行描述 + 标签 + **右侧 upvote 按钮（三角 + 数字）**
- **信息层级**: 图标 → 名称（加粗）→ 描述（浅色）→ 标签 → 投票数
- **upvote 按钮**: 右对齐，上三角 + 计数，视觉独立于内容区
- **详情页**: 产品截图/视频 + 描述 + 评论（算法排序）+ Maker 信息 + 相关产品

**配色 & 排版**:
- **主色**: 白色背景 + 品牌橙红 `#DA552F`(upvote/accent)
- **暗色模式**: 2025 版支持暗色
- **字体**: 系统字体，标题 16-18px，描述 14px
- **间距**: 列表项间距较紧，emphasis 在可浏览性

**动效**: 投票按钮点击动画（数字递增 + 颜色变化），页面切换平滑

**可借鉴点**:
- **upvote 列表模式** — 如果 SkillNav 未来加入社区投票，PH 是经典参考
- 「图标 + 名称 + 一行描述」的极简列表项，信息完备但不冗余
- 每日/每周排行榜的时间维度设计
- 标签和集合（Collections）的内容组织方式

**注意**: PH 最近的 redesign 收到负面反馈（信息层级过平，新品被淹没），是反面教材

---

### 8. VS Code Marketplace

**设计哲学**: 「功能优先的实用主义」。微软企业级设计语言，重信息完整性，轻视觉表现力。设计目标是让开发者快速找到并评估扩展。

**列表页架构**:
- **搜索**: 顶部搜索栏 + 排序（Install Count / Rating / Name / Date）+ 筛选（Category / 平台）
- **列表**: 竖向列表，每行一个扩展 — 图标 + 名称 + 发布者 + 描述 + 安装数 + 星级评分
- **分类**: 左侧分类树（Themes / Snippets / Language / Debuggers 等）

**详情页**:
- **Header**: 图标 + 名称 + 发布者 + 安装数 + 评分 + Install 按钮
- **Tabs**: README / Feature Contributions / Changelog / Dependencies
- **右侧 Sidebar**: Extension ID / Version / 发布日期 / Repository 链接 / License
- **README**: 主内容区，markdown 渲染，包含截图和说明

**配色 & 排版**:
- **主色**: VS Code 蓝 + 白色背景（亮模式）或暗灰背景（暗模式）
- **排版**: 标准微软字体栈，信息密度偏高，间距较紧

**可借鉴点**:
- **详情页 Tab 模式** — README / Changelog / Dependencies 的标签切换适合 Skill 详情页
- 安装数 + 评分的信任指标组合
- 右侧元数据 Sidebar 的信息组织（版本/许可证/仓库链接）
- 排序维度设计（安装数 / 评分 / 更新日期 / 名称）

**注意**: VS Code Marketplace 的视觉设计较为陈旧，不适合直接模仿其样式

---

### 9. npm

**设计哲学**: 「数据密度至上」。作为全球最大的包管理平台（200万+ packages），npm 的设计完全服务于信息检索效率。斯巴达式的朴素中蕴含极高的信息密度。

**搜索页**:
- **搜索栏**: 顶部居中，大尺寸，支持包名/关键词/作者搜索
- **结果列表**: 包名（链接）+ 描述 + 关键词标签 + 作者 + 发布日期 + 版本号
- **排序**: Relevance / Popularity / Quality / Maintenance
- **筛选**: 左侧 — 作者/关键词/日期范围

**详情页**:
- **两栏布局**: 左主栏（README 渲染）+ 右 Sidebar（元数据）
- **右侧 Sidebar**: Weekly Downloads（含图表）/ Version / License / 文件数&大小 / Dependencies / Dependents / Repository
- **Tabs**: Readme / Code / N Dependencies / N Dependents / N Versions
- **信息密度**: 极高 — 一个页面内可获取包的全部关键决策信息

**配色 & 排版**:
- **主色**: 白色背景 + npm 红 `#CB3837` accent
- **字体**: 系统字体，紧凑排版
- **风格**: 极度功能主义，无装饰性元素

**可借鉴点**:
- **详情页右侧 Sidebar 的信息架构** — 最佳实践：将 "决策辅助信息" 固定在 Sidebar（Downloads/Stars/License/Dependencies）
- Weekly Downloads 图表 — 简单有效地展示趋势
- 搜索结果的四维排序（Relevance / Popularity / Quality / Maintenance）— 可映射为 SkillNav 的 Stars / 质量评分 / 更新频率
- 作者页高信息密度布局 — 一页展示所有维护的包

---

## 设计范式提炼

### 适合 SkillNav 的设计原则

1. **搜索即导航** — 搜索栏不是辅助功能，而是第一入口。参考 Raycast Store 的中央搜索设计，`Cmd+K` 全局搜索必须实现
2. **信息密度分层** — 列表页追求「可扫描性」（每卡 3 秒内判断是否点击），详情页追求「信息完整性」（一页获取全部决策信息）
3. **品牌色即身份** — Deep Indigo 是 SkillNav 的 Jungle Green。在暗色模式下，品牌色应是视觉焦点（参考 Supabase 的翠绿色策略）
4. **克制的动效** — Vercel 级别的克制，而非 Linear 级别的华丽。工具站的用户来这里做事，不是来看动画的
5. **内容优先的排版** — 中文内容需要更大的字号和行高（参考 dev.to 的阅读体验优化），16px 正文 + 1.75 行高 + 适当段间距
6. **暗色模式不是可选的** — 82.7% 用户使用暗色模式，暗色必须是一等公民。SkillNav 已有暗色 token，需确保每个新组件都有暗色适配

### 配色方案建议

SkillNav 当前配色: Deep Indigo（oklch hue 260）+ Teal accent（oklch hue 185）

**建议保持现有方向，微调优化**:

| Token | 当前 | 建议调整 | 理由 |
|-------|------|---------|------|
| --primary | `oklch(0.45 0.18 260)` | 保持不变 | Deep Indigo 品牌色已确立 |
| --accent/cta | `oklch(0.65 0.2 185)` | `oklch(0.68 0.18 175)` | 稍偏青绿色，增加与 Indigo 的对比度 |
| --card (dark) | `oklch(0.19 0.025 260)` | `oklch(0.17 0.02 260)` | 略深一点，增加与背景的层级区分 |
| --border (dark) | `oklch(1 0 0 / 10%)` | `oklch(1 0 0 / 8%)` | 更微妙的边框，减少视觉噪音 |
| 新增: --surface | - | `oklch(0.15 0.018 260)` dark / `oklch(0.975 0.004 260)` light | 介于 background 和 card 之间的中间层，用于 toolbar/sidebar |

**品牌色使用规则**（借鉴 Vercel/Supabase）:
- Primary Indigo: 仅用于主 CTA、活跃状态、选中态
- Accent Teal: 用于次级 CTA、链接、代码高亮、成功状态
- 中性色: 构成页面 95% 的视觉面积
- 品牌色占视觉面积 < 5%，但出现在所有关键交互点

### 排版系统建议

**字体**: 当前 Inter + Geist Mono + 中文回退栈是合理选择。

**层级建议**（基于 Geist 系统 + 中文优化）:

| 层级 | 用途 | 字号 | 字重 | 行高 | 字间距 |
|------|------|------|------|------|--------|
| Display | 首页 Hero | 48-56px | 700 | 1.1 | -0.02em |
| H1 | 页面标题 | 32-36px | 700 | 1.2 | -0.015em |
| H2 | Section 标题 | 24-28px | 600 | 1.3 | -0.01em |
| H3 | 卡片标题 | 18-20px | 600 | 1.4 | 0 |
| Body | 正文 | 16px | 400 | 1.75 | 0 |
| Body Small | 描述/标签 | 14px | 400 | 1.6 | 0 |
| Caption | 元数据 | 12-13px | 500 | 1.4 | 0.01em |

**中文特殊处理**:
- 中文正文行高建议 1.75（比英文的 1.5 更宽），避免汉字拥挤
- 段间距至少 1em（英文可 0.75em）
- 标题字重 600-700（中文细字重难以识别）
- 避免中文等宽字体（可读性差）

### 导航模式建议

**推荐: Raycast/Supabase 混合模式**

```
┌─────────────────────────────────────────┐
│ Logo  Skills  MCP  资讯  关于  [🔍 ⌘K]  │  ← 顶部粘性导航 (5 项)
├─────────────────────────────────────────┤
│                                         │
│  列表页内容（无侧边栏）                    │  ← 移动端友好
│                                         │
└─────────────────────────────────────────┘
```

- **顶部**: 5 个主导航项（当前已有）+ 全局搜索入口（`Cmd+K`），不超过 7 项
- **列表页**: 无侧边栏，筛选在内容区上方（toolbar 模式），参考 Raycast Store
- **详情页**: 两栏 — 主内容 + 右侧固定 Sidebar（元数据），参考 npm 详情页
- **移动端**: 底部 Tab Bar（首页/Skills/MCP/资讯/更多）+ 顶部搜索
- **`Cmd+K`**: 全局快捷搜索，搜索 Skills + MCP + 文章，参考 Vercel/Supabase

### 卡片设计范式

**Skill 卡片**（参考 Raycast Store + VS Code Marketplace）:

```
┌──────────────────────────────────┐
│  [Icon]  Skill 名称              │  ← 图标 + 名称 (H3, 600)
│          一行描述文字 ...         │  ← 描述 (Body Small, muted)
│                                  │
│  [claude] [编码开发]  ★ 142      │  ← 平台 badge + 分类 + Stars
│  by author            2 天前     │  ← 作者 + 更新时间
└──────────────────────────────────┘
```

关键决策:
- 图标位置: 左上角（参考 Raycast），快速视觉锚点
- 信息层级: 名称 > 描述 > 元数据（Stars/平台/分类）
- hover: 边框颜色加深 + 微上移 translate(-1px)，无放大
- 暗色模式: 卡片背景比页面背景亮一个 token 层级

**文章卡片**（参考 daily.dev + dev.to）:

```
┌──────────────────────────────────┐
│  ┌──────────────────────────┐    │
│  │     封面图 (16:9)        │    │  ← 可选封面，有则显示
│  └──────────────────────────┘    │
│  文章标题（最多 2 行）            │  ← H3, 600
│  摘要文字一行 ...                │  ← Body Small, muted
│                                  │
│  [news] [Anthropic]  ·  5 分钟   │  ← 类型 + 来源 + 阅读时间
│  2026-03-05                      │  ← 发布日期
└──────────────────────────────────┘
```

关键决策:
- 封面图可选 — 有则展示（增加视觉吸引力），无则纯文字（参考 dev.to）
- 阅读时间估算 — 字数 / 400 分钟（中文），简单有效
- 文章类型使用彩色 badge（news=蓝、tutorial=绿、analysis=紫、review=橙）

### 搜索体验范式

**推荐: Vercel/Supabase 的 `Cmd+K` 模式**

```
┌───────────────────────────────────────────┐
│  🔍  搜索 Skills、MCP 服务、文章...   ⌘K  │  ← 全局搜索入口
├───────────────────────────────────────────┤
│  最近搜索                                  │
│  · claude code skills                      │
│  · mcp server                              │
│                                            │
│  Skills                                    │  ← 按类型分组结果
│  ┌ [icon] Commit Message Writer       ★52  │
│  └ [icon] Code Review                ★38  │
│                                            │
│  文章                                      │
│  ┌ Claude Code 最佳实践指南                 │
│  └ MCP 协议 2026 年发展趋势                 │
│                                            │
│  MCP                                       │
│  ┌ Supabase MCP Server                    │
│  └ GitHub MCP Server                      │
└───────────────────────────────────────────┘
```

关键特性:
- 全局 `Cmd+K` 快捷键触发（参考 Vercel/Supabase/Raycast）
- 模糊搜索，即时结果（debounce 200ms）
- 结果按类型分组: Skills / MCP / 文章
- 最近搜索记录（localStorage）
- 键盘导航: 上下箭头 + Enter 直达
- 技术实现: 可用当前 Orama 客户端搜索，未来迁移 Meilisearch

---

## 推荐设计方向

### 方向 A: 「Supabase 式 — 品牌识别力」

**核心理念**: 用 Deep Indigo 品牌色 + 技术信赖感打造差异化视觉。暗色优先，但不是 Linear 的"纯黑"，而是带有 Indigo 色调的深色。

**参考**: Supabase (品牌色策略) + Raycast (Store 交互) + npm (信息密度)

**优势**:
- 品牌辨识度最强 — 暗蓝色调在中文开发者工具站中独一无二
- 与 SkillNav 现有 token 系统完全一致，改动最小
- Supabase 基于 shadcn/ui，设计模式可直接复用
- 开发者「信赖感」气质与工具导航站的定位吻合

**劣势**:
- 暗色优先需要所有组件双主题验证
- 需要足够的 Indigo 色阶（5-10 级）来构建层次
- 对图标/插图的要求更高（暗色背景上需要精心设计的图形）

**适用场景**: 想要建立「专业 + 权威 + 中国原创」品牌印象

**实施难度**: 低（基于现有 token 优化，不需大规模重构）

---

### 方向 B: 「Raycast Store 式 — 搜索驱动」

**核心理念**: 整个体验围绕搜索构建。首页不是展示页，而是搜索入口 + 精选推荐。核心交互模式是「搜 → 筛 → 选」。

**参考**: Raycast Store (搜索优先) + VS Code Marketplace (详情页) + Product Hunt (投票排序)

**优势**:
- 最符合工具导航站用户的核心行为模式（来了就是找东西）
- 搜索优先的设计自然引导用户探索更多内容
- 可以逐步叠加投票/评论等社区功能
- 技术实现路径清晰（Orama → Meilisearch）

**劣势**:
- 对搜索质量要求极高（搜索不好用 = 网站不好用）
- 纯搜索导向可能弱化内容(资讯)板块的存在感
- 需要足够的数据量才能撑起搜索体验（168 个 curated skills 是否足够？）

**适用场景**: 工具数据量达到 500+ 后，搜索体验优势才会显现

**实施难度**: 中（需要实现 Cmd+K 全局搜索、搜索索引、模糊匹配）

---

### 方向 C: 「daily.dev 式 — 内容驱动 Feed」

**核心理念**: 首页是个性化信息流，混合展示 Skills 更新、新文章、MCP 动态。用户每天来看"今天 AI Agent 生态有什么新鲜事"。

**参考**: daily.dev (Feed 设计) + dev.to (社区卡片) + Product Hunt (时间维度排序)

**优势**:
- 最符合 SkillNav「内容驱动增长」的核心战略
- 信息流天然适合 SEO（大量页面 + 频繁更新 + 长尾关键词）
- 「每日必看」的使用习惯黏性最强
- 273 篇文章 + 168 Skills 已可撑起初始 Feed

**劣势**:
- 信息流设计的「工具导航」属性较弱 — 用户可能不确定这是导航站还是资讯站
- 个性化需要用户登录 + 行为数据积累
- Feed 算法需要持续调优
- 与 SkillNav 当前的「独立频道」架构差异较大

**适用场景**: 如果内容生产量能稳定在每周 20+ 篇，Feed 模式效果最佳

**实施难度**: 高（需要统一内容模型、Feed 算法、个性化系统）

---

### 综合推荐

**短期 (当前阶段): 方向 A「Supabase 式品牌识别力」**
- 原因: 改动最小、品牌建设优先、与现有代码完全兼容
- 具体动作: 优化 token 色阶 → 统一组件视觉 → 加入 `Cmd+K` 搜索 → 打磨暗色模式

**中期 (数据量 500+ 后): 叠加方向 B「搜索驱动」能力**
- 原因: 工具导航站的核心价值是帮用户快速找到东西
- 具体动作: 实现全站搜索 → 搜索结果优化 → 搜索建议/热门搜索

**长期 (内容量充足后): 探索方向 C「Feed 首页」**
- 原因: 内容驱动增长的终极形态
- 具体动作: 统一 Feed 模型 → 混合内容流 → 个性化推荐

---

## 附录: 参考源

### 开发者工具站
- [Vercel Web Interface Guidelines](https://vercel.com/design/guidelines)
- [Geist Design System](https://vercel.com/geist/introduction)
- [Geist Typography](https://vercel.com/geist/typography)
- [Linear: How we redesigned the Linear UI](https://linear.app/now/how-we-redesigned-the-linear-ui)
- [The Linear Look - Frontend Horse](https://frontend.horse/articles/the-linear-look/)
- [Linear Design Trend - LogRocket](https://blog.logrocket.com/ux-design/linear-design/)
- [Raycast Store](https://www.raycast.com/store)
- [Raycast: A fresh look and feel](https://www.raycast.com/blog/a-fresh-look-and-feel)
- [Supabase Design System](https://supabase.com/design-system)
- [Supabase Brand Assets](https://supabase.com/brand-assets)
- [How Design Works at Supabase](https://supabase.com/blog/how-design-works-at-supabase)

### 开发者内容/社区站
- [daily.dev Feeds Documentation](https://docs.daily.dev/docs/key-features/feeds)
- [daily.dev on Product Hunt](https://www.producthunt.com/products/daily-dev)
- [Product Hunt](https://www.producthunt.com/)
- [OpenHunts: Future of Product Discovery](https://openhunts.com/blog/future-product-discovery-platforms-2025)
- [dev.to Web Design Trends 2026](https://dev.to/admiracreativos/web-design-trends-for-2026-what-developers-need-to-know-4n1g)

### 工具目录/市场
- [VS Code Extension Marketplace Docs](https://code.visualstudio.com/docs/configure/extensions/extension-marketplace)
- [npm](https://www.npmjs.com/)
- [npm Search & Discovery Docs](https://docs.npmjs.com/searching-for-and-choosing-packages-to-download/)

### 设计趋势
- [Figma: Web Design Trends 2026](https://www.figma.com/resource-library/web-design-trends/)
- [Web Design Trends 2026 - Devolfs](https://www.devolfs.com/blog/web-design-trends-2026)
- [10 Web Design Trends 2026 - Medium](https://medium.com/@arsalanmuhammadiqbal/10-web-design-trends-for-2026-that-will-make-your-website-look-outdated-if-ignored-b3c139ac22bf)
- [Supabase shadcn Theme](https://www.shadcn.io/theme/supabase)
- [Geist Design System Figma](https://www.figma.com/community/file/1330020847221146106/geist-design-system-vercel)
- [Supabase Brand Colors - Mobbin](https://mobbin.com/colors/brand/supabase)
