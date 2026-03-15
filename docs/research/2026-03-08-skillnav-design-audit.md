# SkillNav 设计系统现状审计

> 日期: 2026-03-08
> 用途: 摸底 SkillNav 当前隐含的设计系统，识别一致性和缺口

---

## 一、CSS 架构 & 色彩 Token

**文件**: `src/app/globals.css`

项目使用 **Tailwind CSS v4 CSS-based 配置**（无 `tailwind.config.ts`）。所有 design tokens 定义为 CSS 自定义属性。

### 色彩系统（OKLch 色彩空间）

- **主题**: Deep Indigo (hue 260°) — "深海导航"概念
- **Token 分类**:
  - **UI 基础**: background, foreground, card, card-foreground, popover, input, border
  - **交互**: primary, secondary, accent, muted, destructive
  - **品牌语义**: brand, brand-foreground, cta, cta-foreground
  - **安全评分**: safe (green 145°), warning (yellow 75°), danger (red 25°), unscanned (gray)
  - **图表**: 5 个独立颜色
  - **侧边栏**: 完整 token 集

### 浅色模式 (`:root`)

```css
--primary: oklch(0.45 0.18 260)          /* Deep indigo */
--accent: oklch(0.65 0.2 185)             /* Cyan/teal */
--background: oklch(0.985 0.005 260)      /* Off-white */
--foreground: oklch(0.16 0.02 260)        /* Dark indigo */
```

### 深色模式 (`.dark`)

```css
--primary: oklch(0.65 0.18 260)           /* Lighter indigo */
--accent: oklch(0.65 0.2 185)             /* Same teal */
--background: oklch(0.14 0.02 260)        /* Very dark indigo */
--foreground: oklch(0.94 0.01 260)        /* Off-white text */
```

### 圆角体系

```css
--radius: 0.625rem                        /* 10px base */
--radius-sm: calc(var(--radius) - 4px)    /* 6px */
--radius-md: calc(var(--radius) - 2px)    /* 8px */
--radius-lg: var(--radius)                /* 10px */
--radius-xl: calc(var(--radius) + 4px)    /* 14px */
--radius-2xl: calc(var(--radius) + 8px)   /* 18px */
--radius-3xl: calc(var(--radius) + 12px)  /* 22px */
--radius-4xl: calc(var(--radius) + 16px)  /* 26px */
```

### 代码语法高亮

- highlight.js GitHub 色系（浅色）
- 自定义 GitHub-dark-dimmed（深色）
- Inline code: `0.15em 0.4em` padding, `0.875em` font-size, pill 样式

---

## 二、Tailwind 配置 & shadcn/ui

**文件**: `components.json`

```json
{
  "style": "new-york",
  "rsc": true,
  "tailwind": {
    "config": "",
    "css": "src/app/globals.css",
    "baseColor": "neutral",
    "cssVariables": true
  },
  "iconLibrary": "lucide"
}
```

- **New York style** — 简洁、极简美学
- **CSS variables** 启用
- **RSC** 启用
- **Lucide icons**，尺寸: size-3, size-3.5, size-4, size-5, size-6, size-10

---

## 三、排版 & 字体

**文件**: `src/lib/fonts.ts`

```typescript
// English: Inter + Geist Mono
inter: Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" })
geistMono: Geist_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" })

// Chinese fallback:
"Noto Sans SC", "PingFang SC", "Microsoft YaHei", "Hiragino Sans GB", sans-serif
```

### 排版阶梯（实际使用情况）

| 元素 | 尺寸 | 字重 | 用途 |
|------|------|------|------|
| Hero H1 | text-4xl → text-5xl → text-6xl | font-bold | 首页 Hero |
| Section Heading | text-2xl → text-3xl | font-bold | 板块标题 |
| Card Title | text-base | font-semibold | 卡片标题 |
| Card Subtext | text-sm | default | 描述/摘要 |
| Meta/Label | text-xs | default | 作者/日期/阅读时间 |
| Badge Text | text-xs | default | 内联 badge |
| Footer Text | text-sm | default | 页脚链接 |

行高: `leading-snug` (1.375), `leading-relaxed` (1.625)

---

## 四、间距模式

### 容器宽度

```
mx-auto max-w-6xl px-4 sm:px-6  — 标准页面容器
mx-auto max-w-5xl px-4 sm:px-6  — Skill 详情页（略窄）
mx-auto max-w-2xl               — Hero 内容居中
```

### 垂直间距 (py-)

- Hero: `py-20 sm:py-28` (80-112px)
- Sections: `py-16` (64px)
- Page Content: `py-12` (48px)
- Cards: `py-6` (default), `py-2` (metadata 行)

### 水平间距 (px-)

- 标准: `px-4 sm:px-6` (16px mobile, 24px desktop)
- 卡片内: `px-6` (24px)
- 紧凑: `px-3` (12px) 按钮

### Gap/spacing

- Grid gaps: `gap-4` (卡片), `gap-8` (section 组)
- Flex gaps: gap-1, gap-1.5, gap-2, gap-2.5, gap-3, gap-4, gap-6, gap-8
- Section 间距: mt-3, mt-4, mt-6, mt-8

---

## 五、组件模式 & 设计一致性

### Card 基础组件 (`components/ui/card.tsx`)

```tsx
<Card>              // flex flex-col gap-6 rounded-xl border bg-card py-6
  <CardHeader />    // @container grid auto-rows-min px-6
  <CardContent />   // px-6
  <CardFooter />    // flex items-center px-6
</Card>
```

### Skill Card (`skill-card.tsx`)

- Header: skill name (text-base font-semibold), author (text-xs)
- Content: description (text-sm line-clamp-2), editor comment (text-xs italic), category + stars
- Hover: `group transition-shadow hover:shadow-md`
- Quality badge: amber-200 自定义 dark mode 颜色

### Article Card (`article-card.tsx`)

- Header: metadata badges (text-xs), type/source/date/reading time
- Content: title (text-base font-semibold leading-snug), summary (text-sm line-clamp-2)
- Hover: 同 Skill Card

### MCP Card (`mcp-card.tsx`)

- Header: name (text-base font-semibold) + featured badge, author, GitHub link
- Content: description (text-sm), install command (rounded-md bg-muted px-3 py-2 text-xs)
- Hover: 同上

**一致性**: 三类卡片结构和 hover 行为完全一致。

### Sidebar (`skill-sidebar.tsx`)

- Container: `p-5`, `border-border/50`, `bg-card`
- Section header: `text-sm font-semibold mb-3`
- Metadata 行: `py-2`, `text-xs`, label 用 muted-foreground

---

## 六、按钮 & 交互元素

### Button 变体 (`components/ui/button.tsx`)

```
variant: default | destructive | outline | secondary | ghost | link
size: default(h-9) | xs(h-6) | sm(h-8) | lg(h-10) | icon(size-9) | icon-xs(size-6) | icon-sm(size-8) | icon-lg(size-10)
```

### Badge 变体

```
variant: default | secondary | destructive | outline | ghost | link
```

- Category: `variant="secondary"`
- Quality tier: 自定义 amber 色系
- Size: 始终 `text-xs`

---

## 七、布局模式

### Header

```tsx
<header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-lg">
  <div className="mx-auto flex h-14 max-w-6xl items-center px-4 sm:px-6">
```

- 高度: h-14 (56px)
- Sticky + z-50
- 毛玻璃: bg-background/80 backdrop-blur-lg

### Footer

```tsx
<footer className="border-t border-border/40 bg-muted/30">
  <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
    <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
```

- 微背景: bg-muted/30
- Grid: 2 cols mobile → 4 cols desktop

### Hero

```tsx
<section className="relative overflow-hidden py-20 sm:py-28">
  <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
```

- 微妙渐变遮罩
- 大间距: py-20 sm:py-28

### Newsletter CTA

- 大圆角: rounded-2xl (18px)
- 微品牌色: bg-primary/5

---

## 八、Grid 系统

```
gap-4 sm:grid-cols-2 lg:grid-cols-3      — Skills, Featured Skills
gap-4 sm:grid-cols-2                      — Articles (2-col)
gap-4 grid-cols-2 md:grid-cols-4          — Stats bar
```

---

## 九、边框 & 阴影

### 边框

- 标准: `border border-border`
- 微妙: `border border-border/40` (40% opacity)
- 微弱: `border border-border/50` (sidebar sections)

### 阴影

- 卡片默认: `shadow-sm`
- Hover: `hover:shadow-md`
- Button: `shadow-xs`

---

## 十、断点 & 响应式

- **Mobile first**: 基础类 = 移动端
- **sm:** 640px — 2 列
- **md:** 768px — 4 列 stats
- **lg:** 1024px — 3 列卡片

---

## 十一、动画 & 过渡

```
transition-colors          — 文字/背景色变化
transition-shadow          — 卡片 hover
transition-all             — 通用状态变化
hover:shadow-md            — 卡片抬起
hover:text-primary         — 链接色变
hover:bg-accent            — 按钮/交互背景
```

无 CSS keyframe 动画，全部通过 Tailwind transitions。

---

## 十二、一致性问题汇总

| 问题 | 位置 | 状态 |
|------|------|------|
| **边框透明度混用** | border-border vs border-border/40 vs border-border/50 | 不一致 |
| **卡片内间距** | Header pb-2/pb-3, Content 间距各异 | 轻微不一致 |
| **图标尺寸** | size-3, size-3.5, size-4, size-5, size-6, size-10 | 无统一规则 |
| **链接样式** | text-primary, hover 状态无统一文档 | 未文档化 |
| **表单输入高度** | h-10 硬编码在 toolbar | 未 token 化 |
| **代码块样式** | inline code 硬编码颜色 | 可用 token |
| **元信息文字色** | text-muted-foreground + 各种透明度 | 不一致 |
| **Section 间距** | py-16 为主, py-20/py-28 在 Hero | 有变化 |

---

## 十三、总结

### 已有的强基础

- 完整 OKLch 色彩方案 + 语义命名
- Dark mode 正确实现，对比度良好
- 中文支持字体栈
- 一致的 Card 组件结构（shadcn/ui）
- Tailwind 间距体系（虽然隐式）
- 圆角体系完整
- 响应式 Grid 模式
- Lucide 图标集

### 运作良好的部分

- 卡片组件高度一致
- 色彩系统 light/dark 处理优雅
- 页面布局遵循标准容器模式
- 元数据/详情区域层级清晰

### 需要显式化的部分

- 图标尺寸约定
- 边框透明度层级
- 输入组件高度标准
- 链接 hover 状态
- 元信息文字层级
- Section 间距指导
- 代码块样式 token

**结论**: 这是一个**隐含的良好设计系统**，色彩、排版、卡片、网格基础扎实，但需要在图标尺寸、边框规则、表单元素标准方面进行显式化。
