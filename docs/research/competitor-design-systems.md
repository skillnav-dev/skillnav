# 竞品设计系统技术分析

> 日期: 2026-03-08
> 用途: 为 SkillNav 设计规范提供竞品参考依据

---

## 一、六大标杆站点分析

### 1. Supabase (supabase.com)

**色彩体系**:
- 基于 **Radix Colors**，所有颜色通过 CSS 变量存储
- 三色品牌体系: Jungle Green `#34B27B`（主色）、Bunker `#11181C`（暗底）、Athens Gray `#F8F9FA`（亮底）
- 灰阶 12 级，暗/亮模式分别用 Radix gray / Radix slate
- 语义色分组: 背景色(2级)、组件背景(3级: default/hover/active)、边框(3级)、高对比度(2级)

**排版**: 自定义无衬线 + 等宽字体，基于 Tailwind 工具类

**间距**: Container 分 4 级: Small 768px / Default 1200px / Large 1600px / Full

**卡片**: 图标 + 标题 + 描述 + 入口，薄边框，中等圆角

**暗色模式**: Tailwind `dark:` variant，CSS 变量层切换

**凝聚力来源**: 品牌绿极其克制（仅关键交互点），95%+ 面积灰阶，绿色成为视觉锚点

---

### 2. Vercel (vercel.com) — Geist Design System

**色彩体系**:
- **10 个色阶**: Backgrounds, Gray, Gray Alpha, Blue, Red, Amber, Green, Teal, Purple, Pink
- 每个色阶按功能分组: 背景(2级)、组件背景(3级)、边框(3级)、高对比度(2级)
- 支持 P3 广色域
- 品牌核心色: Blue Ribbon `#0070F3` + Cod Gray `#171717` + Alabaster `#FAFAFA`

**排版**:
- **Geist 字体家族**: Geist Sans + Geist Mono + Geist Pixel
- 层级: Hero ~72px / H1 ~48px / H2 ~32px / Body 16px / Caption 14px
- 受瑞士设计运动启发: 精确、清晰、功能至上

**间距**: 大量留白，Section 间距 120px+，元素间距 24-32px

**卡片**: 极简，深灰底/白底，1px 薄边框，12-16px 大圆角，hover 边框发光

**暗色模式**: 默认暗色，高对比度系统，纯黑/纯白作为极端值

**凝聚力来源**: Geist 字体族统一文字气质；极端克制——品牌蓝几乎不出现；每个元素都遵循相同间距和圆角

---

### 3. Linear (linear.app)

**色彩体系**:
- 基于 **LCH 色彩空间**，感知均匀
- 主题仅需 3 个变量: base + accent + contrast
- 2025 版大幅削减彩色，转向纯黑白 + 极少量品牌色
- 使用黑白不透明度构建表面、文字、图标层级

**排版**:
- **Inter** (正文) + **Inter Display** (标题)
- 标题超大: 80-96px，行高紧凑 1.1-1.2，负字间距
- 正文标准 16px

**间距**: 基于 8pt 网格 (4pt 半步用于小元素)，单屏单信息原则

**卡片**: 暗灰卡片，微妙边框，glassmorphism 效果

**暗色模式**: 暗色是唯一官方网站模式，表面层级通过亮度区分（elevation by lightness）

**凝聚力来源**: 极致色彩克制；LCH 保证数学级视觉一致；负字间距 + 大标题创造品牌印记

---

### 4. Raycast (raycast.com/store)

**色彩体系**:
- 暗色背景 + 彩色渐变 accent (橙红/粉紫)
- 动态对比度调整: 自动确保文字在任何背景上可读
- 每色定义 light + dark 两个值

**排版**: 系统字体栈，紧凑但不拥挤

**间距**: Store 网格 8/5/3 列(响应式)，卡片间距紧凑

**卡片（Store 核心）**: 图标(方形圆角) + 名称 + 描述 + 作者 + 安装数。图标是视觉识别第一要素

**暗色模式**: 默认暗色 + 渐变装饰

**凝聚力来源**: 搜索栏是最大 UI 元素；图标系统统一所有卡片视觉入口；暗色 + 渐变创造高端感

---

### 5. daily.dev

**色彩体系**:
- 暗色优先: 暗灰背景 ~`#0E1217` + 品牌紫色 accent
- 卡片比背景略亮 ~`#1C1F26`，微妙边框
- 避免纯黑 `#000`，用深灰减少视觉疲劳

**排版**: 系统字体栈，标题 16-18px，正文 14px，偏紧凑

**间距**: Feed 式布局，每行 2-3 张卡片，中等信息密度

**卡片（核心竞争力）**: 封面图(可选) + 标题 + 来源 icon + 阅读时间 + upvote/comment + 技术标签

**暗色模式**: 暗色是默认和主要体验

**凝聚力来源**: Feed 是唯一核心交互；所有内容统一卡片形态；紫色 accent + 暗色主题创造沉浸感

---

### 6. npm (npmjs.com)

**色彩体系**:
- 极简: 白色背景 + npm 红 `#CB3837` 作为唯一品牌色
- 功能主义到极致——色彩仅用于区分信息层级

**排版**: Source Sans Pro，紧凑排版，高信息密度

**间距**: 容器居中 ~1200px，列表间距紧凑

**卡片/列表**: 纯信息列表，包名+描述+关键词+作者+日期+版本。详情页两栏: 主内容 + Sidebar

**暗色模式**: 白底为主，暗色非优先

**凝聚力来源**: 纯功能主义——无装饰性元素；npm 红仅 Logo + 极少 accent；信息架构的一致性

---

## 二、综合对比表

| 维度 | Supabase | Vercel | Linear | Raycast Store | daily.dev | npm |
|------|----------|--------|--------|--------------|-----------|-----|
| **色彩数量** | 12级灰+5语义+品牌绿 | 10色阶+P3 | 3变量生成(LCH) | 暗底+渐变accent | 暗底+品牌紫 | 白底+1品牌红 |
| **语义命名** | Radix 功能分组 | 功能分组 | 算法生成 | light/dark双值 | 主题变量 | 极简无体系 |
| **主字体** | 自定义无衬线 | Geist Sans/Mono | Inter+Display | 系统字体栈 | 系统字体栈 | Source Sans Pro |
| **标题最大** | ~48px | ~72px | 80-96px | ~36px | ~24px | ~24px |
| **正文字号** | 14-16px | 16px | 16px | 14-16px | 14px | 14-16px |
| **间距基础** | Tailwind 4px | 大留白120px+ | 8pt网格 | 紧凑Grid | 中等 | 紧凑 |
| **Container** | 768/1200/1600/Full | ~1200px | ~1200px | 响应式Grid | Feed响应式 | ~1200px |
| **卡片风格** | 薄边框+中圆角 | 1px边+大圆角+hover发光 | 暗灰+glass | 紧凑图标卡 | 封面图+标签 | 无卡片/纯列表 |
| **暗模式方式** | CSS变量+dark: | 默认暗+token映射 | LCH亮度层级 | 默认暗 | CSS-in-JS | 白底为主 |
| **网格列数** | 3列 | 2-3列 | 单列为主 | 3/5/8列 | 2-3列 | 单列列表 |
| **圆角** | 中等(8-12px) | 大(12-16px) | 中等(8-12px) | 小-中(6-10px) | 中等(8-12px) | 极小(4px) |
| **品牌色占比** | ~5% | <3% | <2% | ~8%(渐变) | ~5% | <2% |

---

## 三、关键设计模式对比

### A. 色彩系统架构模式

| 模式 | 代表 | 原理 | 适用场景 |
|------|------|------|---------|
| **Radix 功能分组** | Supabase, Vercel | 12级色阶按功能分: 背景→组件→边框→高对比度 | 组件库/设计系统级 |
| **LCH 3变量生成** | Linear | 仅 base/accent/contrast，算法生成全部 | 需要主题自定义的产品 |
| **双值动态色** | Raycast | 每色定义 light+dark 两个值 | 原生应用/跨主题 |
| **极简品牌单色** | npm | 白底+1品牌色 | 功能主义信息工具 |

### B. 排版层级模式

| 模式 | 代表 | 特点 |
|------|------|------|
| **巨标题+负字间距** | Linear, Vercel | 80-96px标题，-0.02em tracking，强品牌感 |
| **实用信息层级** | Supabase, Raycast | 标题适中(36-48px)，间距正常，开发者友好 |
| **内容优先紧凑** | daily.dev, npm | 小标题(18-24px)，高信息密度，扫描效率优先 |

### C. 卡片设计模式

| 模式 | 代表 | 核心元素 | SkillNav 适用 |
|------|------|---------|--------------|
| **图标锚点型** | Raycast | icon 为第一视觉元素 | Skills 列表页 |
| **封面图型** | daily.dev | 封面图占 50% 面积 | 文章列表页（已去掉封面图） |
| **纯文本列表型** | npm, dev.to | 无视觉装饰，纯信息 | 搜索结果页 |
| **产品截图型** | Linear | 大面积产品截图 | 不适用 |

---

## 四、为 SkillNav 构建设计系统的要点

### 1. 色彩: Supabase 模式（Radix 功能分组）

SkillNav 已用 oklch + CSS 变量，比 Radix 更先进。建议补充：
- 灰阶从 2 级扩展到 5 级: background / surface / card / elevated / overlay
- 组件背景: 3 级 (default / hover / active)
- 边框: 2 级 (subtle / default)
- 品牌 Deep Indigo 占总面积 <5%

### 2. 排版: 实用信息层级（Supabase/Raycast 式）

- 定义 7 级排版 token (Display/H1/H2/H3/Body/Small/Caption)
- 中文行高 1.75（比英文 1.5 更宽）——差异化优势

### 3. 间距: Linear 的 8pt 网格

- 间距刻度: 4/8/12/16/24/32/48/64/96/128
- Section 间距: 64-96px（比 Vercel 120px 更紧凑，适合工具站信息密度）

### 4. 卡片: 双模式

- Skills 卡片: Raycast 图标锚点模式
- 文章卡片: 纯文字信息卡（已去掉封面图）
- 统一: 相同圆角 (10px) + 相同边框 + 相同 hover 效果

### 5. 暗色模式: Supabase 方式 + Linear 亮度层级

- 用亮度区分 elevation，不用颜色
- 暗模式层级: 0.14(bg) / 0.15(surface) / 0.17(card) / 0.19(elevated) / 0.22(overlay)

### 6. 设计凝聚力三大杠杆（ROI 最高）

1. **统一圆角** — 全站所有元素使用同一 `--radius` 基础值（已有: 0.625rem）
2. **统一灰阶层级** — 从 2 级扩展到 5 级，每个组件找到「正确的灰」
3. **品牌色克制使用** — Indigo 仅出现在 CTA/活跃态/选中态

---

## Sources

- [Supabase Design System](https://supabase-design-system.vercel.app/)
- [How Design Works at Supabase](https://supabase.com/blog/how-design-works-at-supabase)
- [Vercel Geist Introduction](https://vercel.com/geist/introduction)
- [Vercel Geist Typography](https://vercel.com/geist/typography)
- [Vercel Geist Colors](https://vercel.com/geist/colors)
- [Vercel Geist Font](https://vercel.com/font)
- [Linear: How We Redesigned the Linear UI](https://linear.app/now/how-we-redesigned-the-linear-ui)
- [Linear Brand Guidelines](https://linear.app/brand)
- [Raycast Store - Prepare Extension](https://developers.raycast.com/basics/prepare-an-extension-for-store)
- [Raycast Colors API](https://developers.raycast.com/api-reference/user-interface/colors)
- [daily.dev Apps Monorepo](https://github.com/dailydotdev/apps)
- [npm Brand Colors](https://pickcoloronline.com/brands/npm/)
- [Evil Martians: 100 Dev Tool Landing Pages Study](https://evilmartians.com/chronicles/we-studied-100-devtool-landing-pages-here-is-what-actually-works-in-2025)
