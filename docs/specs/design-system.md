# SkillNav 设计规范 v1

> 日期: 2026-03-08
> 状态: 待审批
> 依据: 3 份并行调研（最佳实践 + 竞品分析 + 项目现状审计）交叉验证

---

## 一、设计原则

| # | 原则 | 说明 | 参考 |
|---|------|------|------|
| 1 | **搜索即导航** | 搜索框是第一入口，不是辅助功能 | Raycast Store |
| 2 | **3 秒可扫描** | 列表页信息密度服务于快速扫描，详情页服务于信息完整 | daily.dev, npm |
| 3 | **品牌色即锚点** | Deep Indigo 占视觉面积 <5%，仅出现在 CTA / 活跃态 / 选中态 | Supabase 绿色策略 |
| 4 | **克制的动效** | Vercel 级别的克制：`transition-*` 优先，keyframe 极少使用 | Vercel |
| 5 | **中文一等公民** | 16px 正文 + 1.75 行高 + Noto Sans SC 优先字体栈 | — |
| 6 | **暗色一等公民** | 每个新组件必须同时有浅/深色适配，用亮度层级区分 elevation | Linear, Supabase |

---

## 二、色彩系统

### 2.1 色彩空间

所有颜色使用 **OKLch**，感知均匀，暗/亮模式切换时对比度一致。

### 2.2 语义 Token（已有，保持）

| Token | 用途 | 浅色 | 深色 |
|-------|------|------|------|
| `--background` | 页面背景 | oklch(0.985 0.005 260) | oklch(0.14 0.02 260) |
| `--foreground` | 主文字 | oklch(0.16 0.02 260) | oklch(0.94 0.01 260) |
| `--primary` | 主交互色 | oklch(0.45 0.18 260) | oklch(0.65 0.18 260) |
| `--accent` | 辅助强调 | oklch(0.65 0.2 185) | oklch(0.65 0.2 185) |
| `--muted` | 弱背景 | oklch(0.95 0.005 260) | oklch(0.21 0.02 260) |
| `--card` | 卡片背景 | oklch(1 0 0) | oklch(0.17 0.015 260) |
| `--border` | 边框 | oklch(0.90 0.005 260) | oklch(0.30 0.015 260) |
| `--brand` | 品牌色 | = primary | = primary |
| `--cta` | CTA 按钮 | oklch(0.65 0.2 185) | oklch(0.65 0.2 185) |
| `--destructive` | 危险操作 | oklch(0.55 0.2 25) | oklch(0.55 0.2 25) |

### 2.3 品牌色使用规则

| 场景 | 允许 | 禁止 |
|------|------|------|
| 主 CTA 按钮背景 | `bg-primary` | — |
| 导航高亮 / 活跃态 | `text-primary` | 用于大面积背景 |
| 选中的 Tab / Filter | `bg-primary text-primary-foreground` | — |
| 链接 hover | `hover:text-primary` | 默认态用 primary |
| 卡片大面积背景 | — | `bg-primary`（改用 `bg-primary/5`） |
| Hero 渐变 | `from-primary/5` | `from-primary/50`+ |

**规则**: primary 色用于**点缀**，不用于**填充**。大面积着色用 `primary/5` ~ `primary/10`。

### 2.4 边框透明度层级（统一）

当前存在 `border-border` / `border-border/40` / `border-border/50` 混用。统一为两级：

| 层级 | Class | 用途 |
|------|-------|------|
| **Default** | `border-border` | 卡片、输入框、分割线 |
| **Subtle** | `border-border/40` | Header/Footer 分割线、微弱分割 |

**废弃**: `border-border/50` 统一改为 `border-border/40`。

### 2.5 功能色（已有，保持）

| Token | 色相 | 用途 |
|-------|------|------|
| `--safe` | green 145° | 安全评分 A |
| `--warning` | yellow 75° | 安全评分 B |
| `--danger` | red 25° | 安全评分 C/D |
| `--unscanned` | gray | 未扫描 |

---

## 三、排版阶梯

### 3.1 七级排版 Token

| Level | Name | Size | Weight | Line Height | Letter Spacing | 用途 |
|-------|------|------|--------|-------------|----------------|------|
| **1** | Display | text-4xl → text-5xl → text-6xl | bold | tight (1.1) | -0.02em | Hero 主标题 |
| **2** | H1 | text-2xl → text-3xl | bold | snug (1.375) | -0.01em | 页面主标题 / Section 标题 |
| **3** | H2 | text-xl → text-2xl | semibold | snug (1.375) | normal | 子区域标题 |
| **4** | H3 | text-lg | semibold | normal (1.5) | normal | 卡片内标题 / Sidebar 标题 |
| **5** | Body | text-base (16px) | normal | relaxed (1.75) | normal | 正文 / 描述 |
| **6** | Small | text-sm (14px) | normal | normal (1.5) | normal | 卡片描述 / 辅助文字 |
| **7** | Caption | text-xs (12px) | normal | normal (1.5) | normal | 元信息 / Badge / 时间戳 |

### 3.2 字体栈

```
正文: Inter, "Noto Sans SC", "PingFang SC", "Microsoft YaHei", "Hiragino Sans GB", sans-serif
等宽: Geist Mono, "Noto Sans Mono", "SF Mono", Menlo, Consolas, monospace
```

### 3.3 排版约定

| 约定 | 规则 |
|------|------|
| 中文正文行高 | `leading-relaxed` (1.625) 或 1.75，绝不低于 1.5 |
| 卡片标题 | `text-base font-semibold`，不用 `text-lg`（保持紧凑） |
| 元信息 | `text-xs text-muted-foreground`，始终用 Caption 级 |
| 链接默认色 | `text-foreground`，hover 用 `hover:text-primary` |
| 截断 | 卡片描述统一 `line-clamp-2`，标题 `line-clamp-1`（需要时） |

---

## 四、间距系统

### 4.1 基准: 8pt 网格

所有间距使用 Tailwind 默认的 4px 基础单位，优先使用 8 的倍数：

| Token | px | Tailwind | 主要用途 |
|-------|-----|----------|---------|
| 1 | 4px | `1` | 图标与文字间距 |
| 2 | 8px | `2` | Badge 内边距、紧凑元素间距 |
| 3 | 12px | `3` | 按钮内边距 (px-3)、小组件间距 |
| 4 | 16px | `4` | 卡片 Grid gap、移动端页面 px |
| 6 | 24px | `6` | 卡片内边距 (px-6)、桌面端页面 px、Toolbar 与内容间距 |
| 8 | 32px | `8` | Section 组间距、Footer Grid gap |
| 12 | 48px | `12` | 页面内容 py |
| 16 | 64px | `16` | Section py |
| 20 | 80px | `20` | Hero py (mobile) |
| 28 | 112px | `28` | Hero py (desktop) |

### 4.2 容器宽度

| 容器 | Class | 用途 |
|------|-------|------|
| **Standard** | `mx-auto max-w-6xl px-4 sm:px-6` | 所有列表页、首页 |
| **Reading** | `mx-auto max-w-3xl px-4 sm:px-6` | 文章详情页正文 |
| **Narrow** | `mx-auto max-w-2xl` | Hero 内容居中 |

**统一**: Skill 详情页从 `max-w-5xl` 改为 `max-w-6xl`（与列表页一致）。

### 4.3 Section 间距

| 场景 | Class | 说明 |
|------|-------|------|
| Hero | `py-20 sm:py-28` | 最大间距，仅首页 Hero |
| 首页 Section | `py-16` | Featured Skills / Latest Articles / Newsletter |
| 列表页内容 | `py-12` | Skills / Articles / MCP 列表页 |
| 详情页内容 | `py-12` | Skill / Article 详情页 |
| Toolbar → Content | `mt-6` | 工具栏到内容区 |
| SectionHeader → Content | `mt-6` | 标题到内容 |

### 4.4 卡片内间距

统一 shadcn/ui Card 组件的内部间距：

```
CardHeader:  px-6 pb-3       (标题区，下间距 12px)
CardContent: px-6             (内容区)
CardFooter:  px-6 pt-3        (底部区，上间距 12px)
```

---

## 五、圆角 & 阴影

### 5.1 圆角体系（已有，保持）

基础值 `--radius: 0.625rem` (10px)，所有圆角从此派生：

| Token | 值 | 用途 |
|-------|-----|------|
| `rounded-sm` | 6px | Badge, 小按钮 |
| `rounded-md` | 8px | 按钮, 输入框, 代码块 |
| `rounded-lg` | 10px | 卡片, 下拉菜单 |
| `rounded-xl` | 14px | 大卡片, Modal |
| `rounded-2xl` | 18px | Newsletter CTA, Hero 装饰 |

**规则**: Card 组件统一用 `rounded-xl`（shadcn/ui 默认）。不要在卡片上用 `rounded-lg` 或 `rounded-2xl`。

### 5.2 阴影体系

| Token | 值 | 用途 |
|-------|-----|------|
| `shadow-xs` | Tailwind 默认 | 按钮 outline |
| `shadow-sm` | Tailwind 默认 | 卡片默认态 |
| `shadow-md` | Tailwind 默认 | 卡片 hover 态 |

**规则**:
- 卡片: 默认 `shadow-sm`，hover `shadow-md`
- 不使用 `shadow-lg` / `shadow-xl`（过度装饰）
- 深色模式下阴影自然弱化，不需要额外处理

---

## 六、动效 & 过渡

### 6.1 过渡 Token（Tailwind utility）

| Utility | 时长 | 用途 |
|---------|------|------|
| `transition-colors` | 150ms | 文字/背景色变化（链接 hover、按钮 hover） |
| `transition-shadow` | 150ms | 卡片 hover 阴影变化 |
| `transition-all` | 150ms | 需要多属性同时过渡时 |

### 6.2 Keyframe 动画（新增，在 globals.css `@theme` 中定义）

```css
@theme {
  --animate-fade-in: fade-in 0.2s ease-out;
  --animate-slide-up: slide-up 0.25s ease-out;

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

| 动画 | Class | 用途 |
|------|-------|------|
| `animate-fade-in` | 页面元素入场 | Suspense fallback → 内容出现 |
| `animate-slide-up` | 卡片列表入场 | Grid 内容加载完成时 |

### 6.3 动效约定

| 约定 | 规则 |
|------|------|
| hover 效果 | 仅 `transition-*`，不用 keyframe |
| 页面切换 | 无动画（Next.js 默认） |
| Skeleton → 内容 | `animate-fade-in`（0.2s） |
| 下拉菜单/弹窗 | shadcn/ui 内置动画，不覆盖 |
| 禁止 | bounce, wiggle, pulse（用于工具站太花哨） |

---

## 七、布局系统

### 7.1 页面结构模板

```
┌─ Header ──────────────────────────────────────┐
│  sticky h-14 border-b bg-background/80        │
│  backdrop-blur-lg z-50                         │
│  内部: max-w-6xl mx-auto px-4 sm:px-6         │
├────────────────────────────────────────────────┤
│                                                │
│  <main>                                        │
│    首页: 多个 <section> 各自 py-16             │
│    列表页: max-w-6xl mx-auto px-4 py-12       │
│    详情页: max-w-6xl mx-auto px-4 py-12       │
│    文章正文: max-w-3xl mx-auto                 │
│                                                │
├─ Footer ──────────────────────────────────────┤
│  border-t bg-muted/30                          │
│  内部: max-w-6xl mx-auto px-4 py-12           │
│  Grid: grid-cols-2 → md:grid-cols-4 gap-8     │
└────────────────────────────────────────────────┘
```

### 7.2 Grid 系统

| 场景 | Grid | Gap |
|------|------|-----|
| Skills 列表 | `sm:grid-cols-2 lg:grid-cols-3` | `gap-4` |
| Articles 列表 | `sm:grid-cols-2` (2-col, 文章更宽) | `gap-4` |
| MCP 列表 | `sm:grid-cols-2 lg:grid-cols-3` | `gap-4` |
| Featured Skills (首页) | `sm:grid-cols-2 lg:grid-cols-3` | `gap-4` |
| Stats Bar | `grid-cols-2 md:grid-cols-4` | `gap-4` |
| Footer | `grid-cols-2 md:grid-cols-4` | `gap-8` |

### 7.3 响应式断点

| 断点 | 宽度 | 主要变化 |
|------|------|---------|
| base | 0px | 单列布局, px-4 |
| sm | 640px | 2 列 Grid, px-6 |
| md | 768px | 4 列 Stats/Footer |
| lg | 1024px | 3 列 Card Grid |

### 7.4 移动端模式

#### 模式 M1: 溢出防御

所有 CSS Grid 的直接子项必须添加 `overflow-hidden`，防止内容撑宽 grid 列（CSS Grid 子项默认 `min-width: auto`，不会缩小到比内容小）。

| 场景 | Class | 说明 |
|------|-------|------|
| Card 在 Grid 内 | `overflow-hidden` | 防止 monospace/长文本撑宽 |
| Flex 子项有长文本 | `min-w-0` | 允许 flex 子项缩小 |
| 页面根容器 | 不加 `overflow-x-hidden` | 溢出应该在源头修复，不掩盖 |

#### 模式 M2: 横滚容器 + 渐变遮罩

移动端分类/标签筛选栏使用横滚时，需要渐变遮罩提示可滚动：

```
结构: 外层容器 (relative) → 渐变伪层 (absolute, gradient) → 内层滚动区 (overflow-x-auto)
行为: 根据滚动位置动态切换左/右/双侧渐变
桌面端: sm:contents 使外层消失，子级 flex-wrap 折行，渐变隐藏
```

已提取为共享组件 `<ScrollFade>`（`src/components/shared/scroll-fade.tsx`）。

#### 模式 M3: 触控目标最小尺寸

```
规则: 所有可交互元素的触控区域 ≥ 36px (h-9 w-9)
参考: Apple HIG 44px / Material Design 48dp / 取中间值 36px
实现: 小图标按钮通过 padding 扩大热区，而非放大图标本身
```

| 元素 | 最小尺寸 | 实现方式 |
|------|---------|---------|
| 图标按钮 (CopyButton 等) | `h-9 w-9` (36px) | 按钮尺寸，图标保持 `size-4` |
| 内联清除按钮 | `p-2` (含图标 32px+) | 用 padding 扩大热区 |
| Tab/Filter 按钮 | `h-8` (32px) min | Button size="sm" 默认值 |

#### 模式 M4: 等宽文本溢出处理

| 场景 | 策略 | Class |
|------|------|-------|
| 单行命令 | truncate | `overflow-hidden text-ellipsis whitespace-nowrap` |
| 代码块 | 横滚 + 缩小字号 | `overflow-x-auto text-xs sm:text-sm` |
| 内联代码 | 断词 | `break-all` 或 `max-w-full` |

#### 模式 M5: 详情页双列响应式

```
规则: < lg 时 sidebar 信息自然堆叠在主内容下方
不做: order 调换 / 移动端精简 sidebar
原因: 安装命令已在顶部，sidebar 在下方是合理的阅读流
```

---

## 八、组件模式

### 8.1 卡片统一规范

**结构模板**（三类卡片共用）：

```tsx
<Card className="group relative overflow-hidden transition-shadow hover:shadow-md">
  <CardHeader className="px-6 pb-3">
    {/* 层 1: 识别层 — 标题 + 类型标识 */}
    <h3 className="text-base font-semibold">{title}</h3>
  </CardHeader>
  <CardContent className="px-6">
    {/* 层 2: 理解层 — 描述/摘要 */}
    <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
  </CardContent>
  <CardFooter className="px-6 pt-3 text-xs text-muted-foreground">
    {/* 层 3: 决策层 — 分类/Stars/作者/日期 */}
  </CardFooter>
</Card>
```

**整卡可点击**: 标题 `<Link>` 添加 `after:absolute after:inset-0` 伪元素。

**各卡片差异点**:

| 维度 | Skill Card | Article Card | MCP Card |
|------|------------|--------------|----------|
| 识别层 | 名称 + 平台 badge | 标题 | 名称 + featured badge |
| 理解层 | 中文描述 | 中文摘要 | 描述 + install 命令 |
| 决策层 | 分类 + Stars + 作者 | 类型 + 来源 + 日期 | 作者 + GitHub link |
| 特殊 | quality badge (A-tier) | 阅读时间 | — |

### 8.2 工具栏统一规范

三个列表页（Skills / Articles / MCP）统一布局：

```tsx
<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
  {/* 左侧: 搜索框 */}
  <div className="relative flex-1">
    <Input className="h-10 pl-9 pr-9" placeholder="搜索..." />
  </div>
  {/* 右侧: 筛选/排序 */}
  <div className="flex gap-2">
    <Select className="h-10 w-[140px]">...</Select>
    <Select className="h-10 w-[120px]">...</Select>
  </div>
</div>
```

**统一**: 搜索框 `h-10`, Select `h-10`, Button `h-10` (size="lg")。

### 8.3 空状态

```tsx
<div className="flex flex-col items-center justify-center py-16 text-center">
  <Icon className="mb-4 size-10 text-muted-foreground/50" />
  <h3 className="text-lg font-semibold">{title}</h3>
  <p className="mt-2 text-sm text-muted-foreground">{description}</p>
  <Button variant="outline" className="mt-6">{action}</Button>
</div>
```

### 8.4 图标尺寸约定

| 尺寸 | Class | 用途 |
|------|-------|------|
| 12px | `size-3` | 极小：Badge 内图标 |
| 14px | `size-3.5` | 小：元信息前缀图标（日期、阅读时间） |
| 16px | `size-4` | 标准：按钮内图标、导航图标 |
| 20px | `size-5` | 中：工具栏 icon、Header 按钮 |
| 24px | `size-6` | 大：空状态图标（非主图标） |
| 40px | `size-10` | 特大：空状态主图标、Hero 装饰 |

---

## 九、暗色模式规则

### 9.1 亮度层级（elevation by lightness）

深色模式下，通过亮度区分层级，不用颜色：

| 层级 | Lightness | 用途 |
|------|-----------|------|
| Background | 0.14 | 页面底色 |
| Surface | 0.17 | 卡片背景 (--card) |
| Elevated | 0.21 | muted 背景 (--muted) |
| Overlay | 0.25 | Popover / Dialog |

### 9.2 新组件检查清单

每个新组件必须通过以下检查：

- [ ] 浅色模式下文字 vs 背景对比度 ≥ 4.5:1
- [ ] 深色模式下文字 vs 背景对比度 ≥ 4.5:1
- [ ] 品牌色/accent 色不直接用作大面积背景
- [ ] hover / active 状态在深色模式下可感知
- [ ] 边框在深色模式下可见（不要 `border-border/60`+ 透明度）
- [ ] 代码块 / 行内代码在深色模式下可读

---

## 十、不做什么

| 排除项 | 理由 |
|--------|------|
| Style Dictionary / Token Studio | 1-2 人团队过度工程化 |
| 把 token 拆分成多个 CSS 文件 | 项目规模不够大，单文件 globals.css 更可维护 |
| Fluid Typography (clamp) | 断点模式更可预测，工具站不是营销站 |
| Component Token 层 | 组件数量不够多，直接用 semantic token |
| `@apply` 定义组件样式 | 用 React 组件 + Tailwind class |
| Tailwind Variants 库 | CVA 已满足需求 |
| `<PageShell>` / `<GenericCard>` 抽象 | Tailwind class 约定即"设计语言"，不过度封装 |
| bounce / wiggle / pulse 动画 | 工具站用户来做事，不看动画 |
| 全站字体替换为 Geist | 当前 Inter + 中文字体栈已足够好 |
| P3 广色域支持 | 设备覆盖率不够高，OKLch sRGB 足够 |

---

## 十一、实施路径

本规范不需要一次性全部实现，而是作为**编码时的参考字典**：

1. **立即落地**（嵌入 UI/UX 重构 Phase 0-1）:
   - 边框透明度统一（2 级）
   - 动效 token 写入 globals.css
   - 卡片内间距统一

2. **渐进落地**（跟随各 Phase 自然实施）:
   - 排版阶梯在修改组件时同步校正
   - 图标尺寸在遇到时按约定调整
   - 新组件按暗色检查清单验收

3. **持续引用**:
   - 新页面/组件开发时，查阅本文档确定 token 选择
   - Code review 时，检查是否符合本规范

---

## 十二、调研报告索引

| 报告 | 路径 | 行数 |
|------|------|------|
| 设计系统最佳实践 | `docs/research/design-system-best-practices.md` | ~230 |
| 竞品设计系统分析 | `docs/research/competitor-design-systems.md` | ~260 |
| SkillNav 设计现状审计 | `docs/research/skillnav-design-audit.md` | ~260 |
