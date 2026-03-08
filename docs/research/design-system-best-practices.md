# Design System 最佳实践调研：Next.js + Tailwind CSS v4 + shadcn/ui

> 日期: 2026-03-08
> 用途: 为 SkillNav 设计规范提供技术依据

---

## 一、Design Token 架构（Tailwind CSS v4）

### 核心范式转变

Tailwind CSS v4 从 JavaScript 配置（`tailwind.config.ts`）彻底转向 **CSS-first 配置**，所有 design tokens 通过 `@theme` 指令在 CSS 中定义。SkillNav 已经在使用这个模式。

### 三层 Token 架构（业界共识）

```
Primitive (原始值) → Semantic (语义化) → Component (组件级)
```

**层级 1: Primitive Tokens** — 原始值，不直接用于组件：
```css
:root {
  --indigo-50: oklch(0.985 0.005 260);
  --indigo-900: oklch(0.16 0.02 260);
  --teal-500: oklch(0.65 0.2 185);
  --spacing-unit: 4px;
}
```

**层级 2: Semantic Tokens** — 表达意图，自动适配主题：
```css
:root {
  --background: oklch(0.985 0.005 260);
  --primary: oklch(0.45 0.18 260);
  --brand: oklch(0.45 0.18 260);
}
.dark {
  --background: oklch(0.14 0.02 260);
  --primary: oklch(0.65 0.18 260);
  --brand: oklch(0.65 0.18 260);
}
```

**层级 3: Component Tokens（可选）** — 组件级别 CSS 变量：
```css
.skill-card {
  --card-hover-shadow: var(--shadow-md);
  --card-padding: var(--spacing-4);
}
```

### `@theme` vs `:root` 的区别

| 定义位置 | 作用 | 示例 |
|---------|------|------|
| `@theme inline { }` | 生成 utility class + 暴露为 CSS 变量 | `--color-primary` → 可用 `bg-primary` |
| `:root { }` | 仅定义 CSS 变量，不生成 utility | `--brand` 用于 `var(--brand)` |

SkillNav 当前的模式是正确的：`:root` 定义语义值，`@theme inline` 桥接到 Tailwind。

### 完整 Token 分类

SkillNav 目前有 **颜色** 和 **圆角** 两类 token。可补充的完整 token 体系：

```css
@theme inline {
  /* === Colors (SkillNav 已有) === */
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-primary: var(--primary);

  /* === Border Radius (SkillNav 已有) === */
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
}

@theme {
  /* === Shadows (品牌化阴影) === */
  --shadow-card: 0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.06);
  --shadow-card-hover: 0 4px 6px -1px rgb(0 0 0 / 0.08), 0 2px 4px -2px rgb(0 0 0 / 0.06);

  /* === Motion / Animation === */
  --ease-bounce: cubic-bezier(0.34, 1.56, 0.64, 1);
  --ease-spring: cubic-bezier(0.175, 0.885, 0.32, 1.275);
  --animate-fade-in: fade-in 0.2s ease-out;
  --animate-slide-up: slide-up 0.3s ease-out;

  @keyframes fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes slide-up {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }
}
```

**对 SkillNav 的建议**：Tailwind v4 的默认 spacing、typography、shadow scales 已经足够好。只在以下情况定义自定义 token：
- 品牌色（已有）
- 自定义圆角（已有）
- 品牌化 shadow（card hover 等复用模式）
- 动画/过渡 token（统一交互感）

---

## 二、shadcn/ui 主题系统

### 核心工作原理

shadcn/ui 的主题系统基于 **background/foreground 对偶约定**：

```
--primary         → 组件背景色
--primary-foreground → 该背景上的文字色
```

使用时：`<div className="bg-primary text-primary-foreground">` 即自动获得正确配色。

### 添加新 Token 的正确流程

以添加 `warning` 色为例：

```css
/* Step 1: 在 :root 定义浅色值 */
:root {
  --warning: oklch(0.84 0.16 84);
  --warning-foreground: oklch(0.28 0.07 46);
}

/* Step 2: 在 .dark 定义深色值 */
.dark {
  --warning: oklch(0.41 0.11 46);
  --warning-foreground: oklch(0.99 0.02 95);
}

/* Step 3: 在 @theme inline 桥接到 Tailwind */
@theme inline {
  --color-warning: var(--warning);
  --color-warning-foreground: var(--warning-foreground);
}
```

### OKLCH 色彩空间

shadcn/ui + Tailwind v4 已全面转向 OKLCH。好处：
- 感知均匀的亮度阶梯
- VS Code / Chrome DevTools 颜色选择器可正常工作
- 比 HSL 更好的跨色调一致性

---

## 三、组件模式库

### 核心原则：不要过早抽象

> "Before you assume you need to extract a component, make sure you're actually using it more than once."

### CVA（Class Variance Authority）模式

适用于 2+ 维度变体的组件（如 Button 的 variant x size）。单一展示组件用简单 props + `cn()` 即可。

### 推荐的可复用模式（不过度抽象）

**模式 1: 页面容器** — 用 Tailwind class 约定，不创建 `<PageShell>` 组件：
```tsx
<main className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
```

**模式 2: 卡片模板** — 各类卡片保持结构相似但允许分化：
```tsx
<Card className="group overflow-hidden transition-shadow hover:shadow-md">
  <CardHeader className="pb-3">...</CardHeader>
  <CardContent>...</CardContent>
  <CardFooter className="text-muted-foreground text-xs">...</CardFooter>
</Card>
```

**模式 3: Toolbar 布局** — Skills 和 Articles 各自维护，共享布局模式：
```tsx
<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
  <SearchInput />
  <div className="flex gap-2">
    <FilterSelect />
    <SortSelect />
  </div>
</div>
```

### 何时抽象

| 情况 | 建议 |
|------|------|
| 完全相同的 UI 出现 3+ 次 | 提取组件 |
| 相似但有差异的 UI | 保持分开，用一致的 class 模式 |
| 只有 class 重复 | 不抽象，保持 inline |
| 有复杂交互逻辑 | 提取为组件 |

---

## 四、响应式 Design Token

### Mobile-First Breakpoints

Tailwind 的 mobile-first 模式已经足够：
```tsx
<h1 className="text-2xl font-bold sm:text-3xl lg:text-4xl">
```

### Fluid Typography

可用 `clamp()` 实现，但 **SkillNav 暂不需要**。断点模式更可预测，Fluid typography 适合大型营销站。

### 响应式 Spacing

继续使用 `py-12 sm:py-16` 断点模式，比 CSS 变量 workaround 更清晰。

---

## 五、Dark Mode

### SkillNav 已正确实现

1. `:root` + `.dark` 模式 — 所有语义 token 都有 dark 变体
2. `@custom-variant dark (&:is(.dark *))` — Tailwind v4 dark mode 声明
3. `@theme inline` — 桥接到 Tailwind utility class
4. OKLCH 色彩 — 深色模式值略微提亮
5. ThemeProvider + next-themes — 在 providers.tsx 中

### 防闪烁检查清单

| 项目 | 要求 |
|------|------|
| `<html>` 上 `suppressHydrationWarning` | 防止 hydration 警告 |
| `ThemeProvider` 包裹 `attribute="class"` | 使用 class 模式 |
| `defaultTheme="system"` | 尊重系统偏好 |
| `enableSystem` | 监听系统切换 |
| `disableTransitionOnChange` | 防止切换闪烁 |

---

## 六、开源项目参考

### Supabase

- **架构**：monorepo，`packages/ui` (Radix + Tailwind 原语) + `packages/ui-patterns` (复合模式)
- **Token 管线**：Figma Variables → JSON → Style Dictionary → CSS Variables + Tailwind Config
- **色彩系统**：集成 Radix UI Colors，12 级色阶
- **启示**：token 管线太重，但 ui + ui-patterns 分层思路值得参考

### shadcn/ui 自身

- 组件代码复制到项目中，你拥有完全所有权
- CSS 变量 background/foreground 对偶约定
- v4 参考仓库：github.com/shadcn/app-tailwind-v4

---

## 七、对 SkillNav 的建议总结

### 立即可做（高 ROI）

1. **Motion Token** — 统一过渡/动画体验
2. **Card Shadow Token** — 统一卡片悬浮效果

### 保持不变

- 颜色 token 体系（OKLCH + semantic naming）
- 圆角 token 体系
- Dark mode 实现
- 组件目录结构
- CVA 在 Button 上的使用
- 容器布局模式

### 不建议做（过度工程化）

- Style Dictionary / Token Studio 工具链
- 把 token 拆分成多个文件
- Fluid Typography
- Component Token 层
- `@apply` 定义组件样式
- Tailwind Variants 库

---

## Sources

- [Tailwind CSS Theme Variables](https://tailwindcss.com/docs/theme)
- [Tailwind CSS v4.0 Blog](https://tailwindcss.com/blog/tailwindcss-v4)
- [Tailwind CSS v4 @theme: The Future of Design Tokens](https://medium.com/@sureshdotariya/tailwind-css-4-theme-the-future-of-design-tokens-at-2025-guide-48305a26af06)
- [Design Tokens That Scale in 2026](https://www.maviklabs.com/blog/design-tokens-tailwind-v4-2026)
- [Typesafe Design Tokens in Tailwind 4](https://dev.to/wearethreebears/exploring-typesafe-design-tokens-in-tailwind-4-372d)
- [shadcn/ui Theming Docs](https://ui.shadcn.com/docs/theming)
- [shadcn/ui Tailwind v4 Guide](https://ui.shadcn.com/docs/tailwind-v4)
- [shadcn/ui Dark Mode](https://ui.shadcn.com/docs/dark-mode)
- [Theming Shadcn with Tailwind v4](https://medium.com/@joseph.goins/theming-shadcn-with-tailwind-v4-and-css-variables-d602f6b3c258)
- [CSS Variables Guide](https://www.frontendtools.tech/blog/css-variables-guide-design-tokens-theming-2025)
- [Tailwind CSS Best Practices 2025-2026](https://www.frontendtools.tech/blog/tailwind-css-best-practices-design-system-patterns)
- [Supabase Design System](https://deepwiki.com/supabase/supabase/2.5-design-system-and-ui-library)
- [CVA Docs](https://cva.style/docs)
- [Scalable Design System in Next.js with Tailwind CSS and CVA](https://www.freecodecamp.org/news/how-a-design-system-in-next-js-with-tailwind-css-and-class-variance-authority/)
