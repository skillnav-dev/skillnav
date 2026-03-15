# SkillNav Design Spec v1.0

> Visual design contract: tokens, components, interaction patterns, composition patterns.
> Companion to `product-spec.md` — this file defines "how it looks", that file defines "how it works".
>
> AI must reference this file before generating any UI code.

---

## 0. Usage

### 0.1 How This File Works

- `[DEFAULT: value]` — Recommended default; override if needed
- Every rule includes a correct/incorrect example where applicable
- Cross-references: `-> DS:x.x` (this file), `-> PS:x.x` (product-spec.md)
- Shared component vocabulary: -> PS:0.2

### 0.2 Shared Component Vocabulary

See -> PS:0.2 for the canonical vocabulary table shared between both specs.

When this file writes "use EmptyState" or "render Skeleton", it refers to the component defined in PS:0.2 with all visual rules from this spec.

### 0.3 Version

- Template version: 1.0.0
- Project spec version: 1.0.0
- Last updated: 2026-03-15

---

## 1. Design Principles

| # | Principle | Description | Reference |
|---|-----------|-------------|-----------|
| 1 | **Search as Navigation** | Search box is the primary entry point, not a secondary feature | Raycast Store |
| 2 | **3-Second Scannable** | Listing pages optimized for quick scanning; detail pages for completeness | daily.dev, npm |
| 3 | **Brand Color as Anchor** | Deep Indigo covers <5% visual area, only at CTA / active / selected states | Supabase green strategy |
| 4 | **Restrained Motion** | Vercel-level restraint: `transition-*` first, keyframes rarely | Vercel |
| 5 | **Chinese First-Class** | 16px body + 1.75 line-height + Noto Sans SC priority font stack | — |
| 6 | **Dark Mode First-Class** | Every new component must have light/dark adaptation; elevation by lightness | Linear, Supabase |

### 1.1 Priority Order

Function > Clarity > Aesthetics > Animation

When trade-offs arise (e.g., a beautiful animation slows perceived performance), follow this priority order.

---

## 2. Token System

### 2.1 Color Space

All colors use **OKLch** for perceptual uniformity. Contrast ratios remain consistent across light/dark mode switches.

### 2.2 Semantic Color Tokens

| Token | Purpose | Light | Dark |
|-------|---------|-------|------|
| `--background` | Page background | oklch(0.985 0.005 260) | oklch(0.14 0.02 260) |
| `--foreground` | Primary text | oklch(0.16 0.02 260) | oklch(0.94 0.01 260) |
| `--primary` | Primary interactive | oklch(0.45 0.18 260) | oklch(0.65 0.18 260) |
| `--accent` | Secondary emphasis | oklch(0.65 0.2 185) | oklch(0.65 0.2 185) |
| `--muted` | Subdued background | oklch(0.95 0.005 260) | oklch(0.21 0.02 260) |
| `--card` | Card background | oklch(1 0 0) | oklch(0.17 0.015 260) |
| `--border` | Borders | oklch(0.90 0.005 260) | oklch(0.30 0.015 260) |
| `--brand` | Brand color | = primary | = primary |
| `--cta` | CTA buttons | oklch(0.65 0.2 185) | oklch(0.65 0.2 185) |
| `--destructive` | Dangerous actions | oklch(0.55 0.2 25) | oklch(0.55 0.2 25) |

### 2.3 Brand Color Usage Rules

| Context | Allowed | Prohibited |
|---------|---------|------------|
| Primary CTA button bg | `bg-primary` | — |
| Nav highlight / active | `text-primary` | Large area backgrounds |
| Selected Tab / Filter | `bg-primary text-primary-foreground` | — |
| Link hover | `hover:text-primary` | Default state using primary |
| Card large area bg | — | `bg-primary` (use `bg-primary/5`) |
| Hero gradient | `from-primary/5` | `from-primary/50`+ |

**Rule**: Primary is for **accenting**, not **filling**. Large areas use `primary/5` ~ `primary/10`.

### 2.4 Border Opacity Levels

Two levels only:

| Level | Class | Usage |
|-------|-------|-------|
| **Default** | `border-border` | Cards, inputs, dividers |
| **Subtle** | `border-border/40` | Header/Footer dividers, faint separators |

**Deprecated**: `border-border/50` — replace with `border-border/40`.

### 2.5 Functional Colors

| Token | Hue | Usage |
|-------|-----|-------|
| `--safe` | green 145° | Security score A, SecurityBadge "safe" |
| `--warning` | yellow 75° | Security score B, SecurityBadge "warning" |
| `--danger` | red 25° | Security score C/D, SecurityBadge "danger" |
| `--unscanned` | gray | Unscanned state |

### 2.6 Typography Scale

Seven-level type ramp:

| Level | Name | Size | Weight | Line Height | Letter Spacing | Usage |
|-------|------|------|--------|-------------|----------------|-------|
| 1 | Display | text-4xl -> text-5xl -> text-6xl | bold | tight (1.1) | -0.02em | Hero headline |
| 2 | H1 | text-2xl -> text-3xl | bold | snug (1.375) | -0.01em | Page title / Section title |
| 3 | H2 | text-xl -> text-2xl | semibold | snug (1.375) | normal | Sub-section title |
| 4 | H3 | text-lg | semibold | normal (1.5) | normal | Card title / Sidebar title |
| 5 | Body | text-base (16px) | normal | relaxed (1.75) | normal | Body text / descriptions |
| 6 | Small | text-sm (14px) | normal | normal (1.5) | normal | Card descriptions / helper text |
| 7 | Caption | text-xs (12px) | normal | normal (1.5) | normal | Metadata / Badge / timestamps |

### 2.7 Font Stacks

```
Body:  Inter, "Noto Sans SC", "PingFang SC", "Microsoft YaHei", "Hiragino Sans GB", sans-serif
Mono:  Geist Mono, "Noto Sans Mono", "SF Mono", Menlo, Consolas, monospace
```

### 2.8 Typography Rules

| Rule | Value |
|------|-------|
| Chinese body line-height | `leading-relaxed` (1.625) or 1.75; never below 1.5 |
| Card title | `text-base font-semibold`; not `text-lg` (keep compact) |
| Metadata | `text-xs text-muted-foreground`; always Caption level |
| Link default color | `text-foreground`; hover uses `hover:text-primary` |
| Truncation | Card description: `line-clamp-2`; title: `line-clamp-1` (when needed) |

### 2.9 Spacing System

Base: 8pt grid using Tailwind's 4px unit. Prefer multiples of 8:

| Token | px | Tailwind | Primary Usage |
|-------|-----|----------|--------------|
| 1 | 4px | `1` | Icon-to-text gap |
| 2 | 8px | `2` | Badge padding, tight element gaps |
| 3 | 12px | `3` | Button padding (px-3), small gaps |
| 4 | 16px | `4` | Card grid gap, mobile page px |
| 6 | 24px | `6` | Card padding (px-6), desktop page px, toolbar-to-content |
| 8 | 32px | `8` | Section component gap, Footer grid gap |
| 12 | 48px | `12` | Page content py |
| 16 | 64px | `16` | Section py |
| 20 | 80px | `20` | Hero py (mobile) |
| 28 | 112px | `28` | Hero py (desktop) |

### 2.10 Border Radius

Base value: `--radius: 0.625rem` (10px). All radii derived from this:

| Token | Value | Usage |
|-------|-------|-------|
| `rounded-sm` | 6px | Badge, small buttons |
| `rounded-md` | 8px | Buttons, inputs, code blocks |
| `rounded-lg` | 10px | Cards, dropdowns |
| `rounded-xl` | 14px | Large cards, modals |
| `rounded-2xl` | 18px | Newsletter CTA, Hero decorations |

**Rule**: Card components use `rounded-xl` (shadcn/ui default). Do not use `rounded-lg` or `rounded-2xl` on cards.

### 2.11 Shadows

| Token | Value | Usage |
|-------|-------|-------|
| `shadow-xs` | Tailwind default | Button outline |
| `shadow-sm` | Tailwind default | Card default state |
| `shadow-md` | Tailwind default | Card hover state |

Rules:
- Cards: default `shadow-sm`, hover `shadow-md`
- Never use `shadow-lg` / `shadow-xl` (over-decorative)
- Dark mode: shadows naturally weaken; no extra handling needed

---

## 3. Layout System

### 3.1 Page Structure

```
+-- Header -----------------------------------------------+
|  sticky h-14 border-b bg-background/80                  |
|  backdrop-blur-lg z-50                                   |
|  inner: max-w-6xl mx-auto px-4 sm:px-6                  |
+----------------------------------------------------------+
|                                                          |
|  <main>                                                  |
|    Homepage: multiple <section> each py-16               |
|    Listing:  max-w-6xl mx-auto px-4 py-12               |
|    Detail:   max-w-6xl mx-auto px-4 py-12               |
|    Article:  max-w-3xl mx-auto                           |
|                                                          |
+-- Footer -----------------------------------------------+
|  border-t bg-muted/30                                    |
|  inner: max-w-6xl mx-auto px-4 py-12                    |
|  Grid: grid-cols-2 -> md:grid-cols-4 gap-8              |
+----------------------------------------------------------+
```

### 3.2 Container Widths

| Container | Class | Usage |
|-----------|-------|-------|
| **Standard** | `mx-auto max-w-6xl px-4 sm:px-6` | All listing pages, homepage |
| **Reading** | `mx-auto max-w-3xl px-4 sm:px-6` | Article detail body |
| **Narrow** | `mx-auto max-w-2xl` | Hero content centering |

### 3.3 Grid System

| Context | Grid | Gap |
|---------|------|-----|
| Skills listing | `sm:grid-cols-2 lg:grid-cols-3` | `gap-4` |
| Articles listing | `sm:grid-cols-2` (2-col, articles need width) | `gap-4` |
| MCP listing | `sm:grid-cols-2 lg:grid-cols-3` | `gap-4` |
| Featured (homepage) | `sm:grid-cols-2 lg:grid-cols-3` | `gap-4` |
| Stats Bar | `grid-cols-2 md:grid-cols-4` | `gap-4` |
| Footer | `grid-cols-2 md:grid-cols-4` | `gap-8` |

### 3.4 Responsive Breakpoints

| Breakpoint | Width | Primary Changes |
|------------|-------|-----------------|
| base | 0px | Single column, px-4 |
| sm | 640px | 2-column grid, px-6 |
| md | 768px | 4-column Stats/Footer |
| lg | 1024px | 3-column card grid, detail sidebar visible |

### 3.5 Section Spacing

| Context | Class | Notes |
|---------|-------|-------|
| Hero | `py-20 sm:py-28` | Maximum spacing, homepage only |
| Homepage sections | `py-16` | FeaturedTools / LatestArticles / Newsletter |
| Listing page content | `py-12` | Skills / Articles / MCP pages |
| Detail page content | `py-12` | Skill / Article detail |
| Toolbar -> Content | `mt-6` | Toolbar to grid area |
| SectionHeader -> Content | `mt-6` | Title to content |

### 3.6 Card Internal Spacing

Unified shadcn/ui Card padding:

```
CardHeader:  px-6 pb-3       (title area, bottom spacing 12px)
CardContent: px-6             (content area)
CardFooter:  px-6 pt-3        (footer area, top spacing 12px)
```

---

## 4. Component Specs

### 4.1 Button

Variants from shadcn/ui `Button`:

| Variant | Usage | States |
|---------|-------|--------|
| `default` | Primary CTA | bg-primary, hover: bg-primary/90 |
| `outline` | Secondary action, filters | border-border, hover: bg-accent |
| `ghost` | Tertiary, icon buttons | transparent, hover: bg-accent |
| `destructive` | Delete, dangerous actions | bg-destructive, hover: bg-destructive/90 |

Sizes:

| Size | Class | Height | Usage |
|------|-------|--------|-------|
| `default` | `h-10 px-4` | 40px | Standard buttons |
| `sm` | `h-8 px-3` | 32px | Compact buttons, filters, tab pills |
| `lg` | `h-11 px-8` | 44px | Hero CTA |
| `icon` | `h-10 w-10` | 40px | Icon-only buttons |

States:
- **Default**: as defined per variant
- **Hover**: background lightens/darkens per variant
- **Active/Pressed**: slightly darker than hover
- **Disabled**: `opacity-50 pointer-events-none`
- **Loading**: [DEFAULT: not implemented, use disabled state]

CopyButton special behavior:
- Default: clipboard icon (`size-4`)
- After copy: checkmark icon + green tint, reverts after 2s
- Touch target: `h-9 w-9` minimum -> DS:3.6/M3

### 4.2 Input & Form Controls

#### Input

```
h-10 rounded-md border-border bg-background px-3
focus: ring-2 ring-ring ring-offset-2
```

States:
- **Default**: border-border, placeholder text-muted-foreground
- **Focus**: ring-2 ring-ring (primary-derived)
- **Disabled**: opacity-50, pointer-events-none
- **Error**: [DEFAULT: not implemented for public pages; admin forms show inline text]

Search Input specifics:
- Left icon: Search (`size-4`), absolutely positioned at `left-3`
- Right icon: X clear button (when value present), `size-4`
- Height: `h-10` matching toolbar Select height
- Padding: `pl-9 pr-9` (room for icons)

#### Select

shadcn/ui Select:
- Trigger: `h-10 w-[140px]` (sort) or `w-[120px]` (filter)
- Content: dropdown with SelectItems
- Mobile: `w-full sm:w-[140px]`

#### Checkbox

shadcn/ui Checkbox:
- Used exclusively in admin tables for batch selection
- States: unchecked / checked / indeterminate (header "select all")

### 4.3 Card

Three card specializations sharing a common structure -> PS:0.2:

**Common structure:**

```tsx
<Card className="group relative overflow-hidden transition-shadow hover:shadow-md">
  <CardHeader className="px-6 pb-3">
    {/* Layer 1: Identity — title + type badge */}
    <h3 className="text-base font-semibold">{title}</h3>
  </CardHeader>
  <CardContent className="px-6">
    {/* Layer 2: Understanding — description/summary */}
    <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
  </CardContent>
  <CardFooter className="px-6 pt-3 text-xs text-muted-foreground">
    {/* Layer 3: Decision — category/stars/author/date */}
  </CardFooter>
</Card>
```

**Full-card clickable**: Title `<Link>` with `after:absolute after:inset-0` pseudo-element.

**Card variants:**

| Dimension | SkillCard | ArticleCard | MCPCard |
|-----------|-----------|-------------|---------|
| Identity | name + PlatformBadge | title | name + featured badge |
| Understanding | Chinese description | Chinese summary | description + install command |
| Decision | category + Stars + author | type + source + date | author + GitHub link |
| Special | FreshnessBadge, SecurityBadge | read time | tools count, CopyButton |

States:
- **Default**: `shadow-sm`, border-border
- **Hover**: `shadow-md` (transition-shadow 150ms)
- **In grid**: `overflow-hidden` mandatory (-> DS:3.6/M1)

### 4.4 Badge System

All badges use shadcn/ui `Badge` with variant customization:

#### SecurityBadge

| Score | Color | Icon | Label |
|-------|-------|------|-------|
| safe | green bg | ShieldCheck | "Safe" |
| warning | yellow bg | ShieldAlert | "Warning" |
| danger | red bg | ShieldX | "Danger" |
| unscanned | gray bg | Shield | "Unscanned" |

#### FreshnessBadge

Priority order: Trending > New > Stale > Archived. Fresh/Active = no badge displayed.

| Level | Color | Icon | Trigger |
|-------|-------|------|---------|
| Trending | orange/amber | Flame | weeklyStarsDelta > threshold |
| New | blue | Sparkles | discoveredAt within 14 days |
| Stale | yellow | AlertTriangle | pushedAt > 6 months ago |
| Archived | gray | Archive | isArchived = true |

#### PlatformBadge

| Platform | Color | Usage |
|----------|-------|-------|
| Claude | indigo bg | Claude Desktop / Claude Code skills |
| Codex | green bg | OpenAI Codex skills |
| Universal | gray bg | Cross-platform skills |

#### Content Badges

| Badge | Usage | Color |
|-------|-------|-------|
| Article type (tutorial/analysis/guide) | ArticleCard, ArticleMeta | Colored by type |
| Source label (anthropic/openai/...) | ArticleMeta | muted variant |
| Quality tier (S/A/B) | Admin, MCPCard | S=gold, A=blue, B=gray |

### 4.5 Navigation Components

#### Header (SiteHeader)

```
sticky top-0 h-14 border-b border-border/40 bg-background/80 backdrop-blur-lg z-50
inner: max-w-6xl mx-auto px-4 sm:px-6
```

Contents:
- Left: Logo (link to `/`)
- Center: NavLinks (desktop, hidden on mobile)
- Right: ThemeToggle + MobileNav trigger (mobile only)

#### NavLinks

Active state detection via `usePathname()`:
- Active: `text-foreground font-medium`
- Inactive: `text-muted-foreground hover:text-foreground`
- Transition: `transition-colors`

#### MobileNav

- Trigger: hamburger icon button (Sheet trigger)
- Panel: Sheet from right -> DS:4.6
- Items: vertical list with active highlight
- Auto-close on navigation

#### Breadcrumb (PageBreadcrumb)

```
Home > [Section] > [Current Page]
```

- Uses shadcn/ui Breadcrumb primitives
- Separator: `/` or chevron
- Current page: `BreadcrumbPage` (no link, muted)
- Used on all detail pages

#### Pagination

```
[< Prev] [1] [2] [3] ... [N] [Next >]
```

- Current page: `bg-primary text-primary-foreground`
- Other pages: `variant="outline"`
- Ellipsis: `...` when > 7 pages
- Disabled at boundaries: `opacity-50 pointer-events-none`

### 4.6 Overlay Components

#### Sheet (Mobile Navigation)

shadcn/ui Sheet:
- Direction: from right
- Content: navigation items list
- Must include `SheetTitle` for accessibility
- Backdrop: dimmed overlay

#### DropdownMenu (Admin Status)

shadcn/ui DropdownMenu:
- Trigger: current status badge or button
- Items: status options with icons
- Used in admin tables for status changes

### 4.7 Feedback Components

#### Skeleton

Animated pulse placeholder matching content shape:
- Cards: 6 skeleton cards per listing page (first screen coverage)
- Structure mirrors actual card layout (header + content + footer areas)
- Animation: `animate-pulse` (Tailwind built-in)

```tsx
// Skeleton card pattern
<Card className="overflow-hidden">
  <CardHeader className="px-6 pb-3">
    <div className="h-5 w-3/4 rounded bg-muted animate-pulse" />
  </CardHeader>
  <CardContent className="px-6">
    <div className="space-y-2">
      <div className="h-4 w-full rounded bg-muted animate-pulse" />
      <div className="h-4 w-2/3 rounded bg-muted animate-pulse" />
    </div>
  </CardContent>
</Card>
```

#### EmptyState

Centered layout for no-data / no-results states:

```tsx
<div className="flex flex-col items-center justify-center py-16 text-center">
  <Icon className="mb-4 size-10 text-muted-foreground/50" />
  <h3 className="text-lg font-semibold">{title}</h3>
  <p className="mt-2 text-sm text-muted-foreground">{description}</p>
  <Button variant="outline" className="mt-6">{action}</Button>
</div>
```

Variants by context:
- Search no results: SearchX icon + "No matching results" + "Clear filters" button
- Empty listing: FileText icon + "No content yet" + contextual CTA
- -> PS:4.2 for page-specific empty state content

#### Toast (Sonner)

- Position: [DEFAULT: bottom-right]
- Duration: [DEFAULT: 3 seconds], auto-dismiss
- Types: success (copy confirmation), error (save failure)
- Non-blocking: does not obstruct content

### 4.8 Icon System

Lucide React icons exclusively. Size conventions:

| Size | Class | Usage |
|------|-------|-------|
| 12px | `size-3` | Extra-small: Badge inline icons |
| 14px | `size-3.5` | Small: metadata prefix icons (date, read time) |
| 16px | `size-4` | Standard: button icons, nav icons |
| 20px | `size-5` | Medium: toolbar icons, header buttons |
| 24px | `size-6` | Large: empty state secondary icons |
| 40px | `size-10` | Extra-large: empty state primary icons, Hero decoration |

### 4.9 Project-Specific Components

#### SectionHeader

Reusable section title + description block:
- Heading tag configurable: `as="h1"` / `as="h2"` / `as="h3"`
- Optional "View all" link on the right
- Spacing: bottom `mt-6` to content

#### Toolbar

Unified search + filter bar for listing pages:

```tsx
<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
  {/* Left: search input */}
  <div className="relative flex-1">
    <Input className="h-10 pl-9 pr-9" placeholder="Search..." />
  </div>
  {/* Right: filters/sort */}
  <div className="flex gap-2">
    <Select className="h-10 w-[140px]">...</Select>
    <Select className="h-10 w-[120px]">...</Select>
  </div>
</div>
```

All interactive elements: `h-10` unified height.

#### ScrollFade

Horizontal scroll container with gradient fade indicators:
- Container: `relative overflow-hidden`
- Scroll area: `overflow-x-auto flex gap-2`
- Fade masks: absolute-positioned gradient pseudo-elements
- Behavior: dynamically show left/right/both fades based on scroll position
- Desktop (sm+): `sm:contents` makes container transparent, children wrap with `flex-wrap`

#### CodeBlock

Pre-formatted code with language label and copy button:
- Background: `bg-muted rounded-md`
- Font: mono stack, `text-xs sm:text-sm`
- Overflow: `overflow-x-auto`
- Language label: top-right, `text-xs text-muted-foreground`
- CopyButton: top-right, appears on hover

#### ShareButtons

Social share button row:
- Copy link: CopyButton variant + Toast "Link copied"
- Twitter/X: prefilled share text with URL
- Layout: `flex gap-2`

#### GiscusComments

GitHub Discussions embed:
- Theme-aware: syncs with `next-themes` (light/dark)
- Lazy loaded: only renders when scrolled into view
- Repository: `skillnav-dev/discussions`

#### InlineNewsletterCta

Compact newsletter signup card:
- Layout: Card with email input + submit button
- State: currently "coming soon" (Resend not integrated)
- Placement: article detail page, after main content

---

## 5. Interaction Patterns

### 5.1 Search Pattern

| Step | User Action | System Response | Component |
|------|-------------|-----------------|-----------|
| Focus | Click/tap search input | Focus ring appears | Input |
| Type | Enter search text | Debounce 300ms, update URL `?q=` | Input |
| Results | — | Suspense boundary re-renders grid with filtered results | Skeleton -> Grid |
| Clear | Click X button or clear text | Remove `?q=`, show full results | Input, Button(ghost) |
| No results | — | Show EmptyState with "Clear filters" | EmptyState |

URL-driven: all search state lives in URL params (nuqs). Browser back/forward preserves search state.

### 5.2 Filter & Sort Pattern

| Step | User Action | System Response | Component |
|------|-------------|-----------------|-----------|
| Select filter | Choose category/source/tier | Update URL param, Suspense re-render | Select, ScrollFade pills |
| Change sort | Select sort option | Update `?sort=`, re-render grid | Select |
| Reset | Click "Clear filters" in EmptyState | Remove all filter params | Button |
| Combine | Multiple filters active | AND logic; result count updates | Toolbar |

Mobile: category pills in ScrollFade horizontal scroll; Select dropdowns go `w-full`.

### 5.3 Loading Pattern

| Trigger | Loading State | Completion | Component |
|---------|--------------|------------|-----------|
| Initial page load | Skeleton cards (6 items) | Fade-in to real content | Skeleton -> `animate-fade-in` |
| Filter/sort change | Skeleton replaces grid (Suspense key change) | New grid appears | Skeleton |
| Page navigation | Full page load (Next.js) | New page renders | — |
| Detail page | No loading state (SSG/ISR, server-rendered) | Immediate render | — |

Rule: Never show a blank page or spinner. Always use Skeleton that matches content shape.

### 5.4 Error Handling Pattern

| Error Type | User Sees | Recovery | Component |
|------------|-----------|----------|-----------|
| 404 Not Found | Custom not-found page with home link | Click "Back to home" | not-found.tsx |
| Server error | Next.js default error page | Refresh browser | — |
| DB unavailable | Fallback to mock data (dev) or ISR cache (prod) | Automatic | DAL fallback |
| Copy failure | No feedback (silent fail) | Manual text selection | — |
| Admin save error | Toast with error message | Fix and retry | Toast |

### 5.5 Copy-to-Clipboard Pattern

| Step | User Action | System Response | Duration |
|------|-------------|-----------------|----------|
| Click | Tap CopyButton | Write to clipboard via Clipboard API | Instant |
| Confirm | — | Icon changes to checkmark, Toast "Copied!" | 2 seconds |
| Reset | — | Icon reverts to clipboard | — |

### 5.6 Navigation Pattern

| Action | Behavior | Component |
|--------|----------|-----------|
| Logo click | Navigate to `/` | SiteHeader |
| Nav item click | Navigate to route, highlight active | NavLinks |
| Card click | Navigate to detail page (full-card clickable) | Card with `after:absolute` |
| Breadcrumb click | Navigate to parent | PageBreadcrumb |
| Back (browser) | Restore URL params (search, filter, page) | nuqs |
| Language switch | Navigate to `/en/` or `/` equivalent | hreflang link |

### 5.7 Mobile Interaction Patterns

| Pattern | Description | Implementation |
|---------|-------------|----------------|
| M1: Overflow defense | Grid children must have `overflow-hidden` | Prevent monospace/long text from widening grid |
| M2: ScrollFade | Horizontal scroll + gradient fade indicators | `<ScrollFade>` component for category pills |
| M3: Touch targets | All interactive elements >= 36px (h-9) | Padding expands hit area, not icon size |
| M4: Monospace overflow | Single-line: truncate; block: horizontal scroll + smaller font | `text-xs sm:text-sm overflow-x-auto` |
| M5: Detail sidebar | Sidebar stacks below main content on < lg | Natural flow, no order swap |

---

## 6. Composition Patterns

### 6.1 ListingPage

```
+-- Container (max-w-6xl mx-auto px-4 py-12 sm:px-6) ----+
|                                                          |
|  SectionHeader (as="h1")                                 |
|    title + description + optional result count           |
|                                                          |
|  Toolbar (mt-6)                                          |
|    [Search Input] [Category Filter] [Sort Select]        |
|                                                          |
|  <Suspense fallback={<Skeleton />}>                      |
|    Grid (mt-6)                                           |
|      gap-4 sm:grid-cols-2 lg:grid-cols-3                 |
|      [Card] [Card] [Card]                                |
|      [Card] [Card] [Card]                                |
|      ...                                                 |
|    OR EmptyState (when no results)                       |
|                                                          |
|    Pagination (mt-8)                                     |
|      [< Prev] [1] [2] ... [N] [Next >]                  |
|  </Suspense>                                             |
|                                                          |
+----------------------------------------------------------+
```

Pages using this pattern: `/skills`, `/mcp`, `/articles`, `/en/skills`, `/en/mcp`

### 6.2 DetailPage (Tool)

```
+-- Container (max-w-6xl mx-auto px-4 py-12 sm:px-6) ----+
|                                                          |
|  PageBreadcrumb                                          |
|    Home > Skills > [Skill Name]                          |
|                                                          |
|  +-- Main (lg:grid lg:grid-cols-3 lg:gap-8) -----------+|
|  |  +-- Content (lg:col-span-2) ----------------------+||
|  |  |  <h1> Skill Name </h1>                          |||
|  |  |  SkillMeta (category, source, stars, security)  |||
|  |  |  SkillMobileMeta (mobile only)                  |||
|  |  |  SkillInstallTabs (install commands)             |||
|  |  |  SkillContent (markdown body)                    |||
|  |  +------------------------------------------------+||
|  |  +-- Sidebar (lg:col-span-1) ---------------------+||
|  |  |  SkillSidebar (GitHub, links, tags, dates)      |||
|  |  +------------------------------------------------+||
|  +-----------------------------------------------------+|
|                                                          |
|  Related Skills (grid)                                   |
|  Related MCP Servers (grid)                              |
|  Related Articles (grid)                                 |
|                                                          |
|  GiscusComments                                          |
|                                                          |
+----------------------------------------------------------+
```

Pages using this pattern: `/skills/[slug]`, `/mcp/[slug]`

### 6.3 ArticlePage

```
+-- Container (max-w-6xl mx-auto px-4 py-12 sm:px-6) ----+
|                                                          |
|  PageBreadcrumb                                          |
|    Home > Articles > [Article Title]                     |
|                                                          |
|  +-- Narrow (max-w-3xl mx-auto) ----------------------+|
|  |  <h1> Article Title </h1>                           ||
|  |  ArticleMeta (type, source, date, read time)       ||
|  |  ArticleContent (markdown, max-w-3xl)               ||
|  |  ShareButtons                                       ||
|  |  Source attribution (for translated articles)       ||
|  +----------------------------------------------------+|
|                                                          |
|  InlineNewsletterCta                                     |
|                                                          |
|  Related Tools (mentioned_skills)                        |
|  Related Articles (same category)                        |
|                                                          |
|  GiscusComments                                          |
|                                                          |
+----------------------------------------------------------+
```

Pages using this pattern: `/articles/[slug]`, `/weekly/[slug]`

### 6.4 StaticPage

```
+-- Container (max-w-6xl mx-auto px-4 py-12 sm:px-6) ----+
|                                                          |
|  SectionHeader (as="h1")                                 |
|                                                          |
|  Content blocks (prose or custom layout)                 |
|                                                          |
+----------------------------------------------------------+
```

Pages using this pattern: `/about`, `/github`, `/weekly` (stub)

### 6.5 AdminPage

#### AdminListPage

```
+-- Admin Layout (nav + main) ----------------------------+
|  Tabs (status filter: all/published/draft)               |
|  AdminToolbar (search + filters)                         |
|  Table                                                   |
|    TableHeader (checkbox, name, status, ...)             |
|    TableBody                                             |
|      TableRow * N                                        |
|  AdminPagination                                         |
+----------------------------------------------------------+
```

#### AdminEditPage

```
+-- Admin Layout (nav + main) ----------------------------+
|  Back link                                               |
|  <h1> Edit [Entity] </h1>                                |
|  Form fields (Input, Textarea, Select)                   |
|  Action buttons (Save, Publish, Delete)                  |
|  [ArticlePreview / ArticleOriginal panels]               |
+----------------------------------------------------------+
```

### 6.6 HomepagePage

```
+-- Full Width -----------------------------------------------+
|                                                              |
|  HeroSection (py-20 sm:py-28)                                |
|    max-w-2xl mx-auto, centered                               |
|    Display heading + subtitle                                |
|    HeroSearch (Input -> /skills?q=)                          |
|    CTA buttons row                                           |
|                                                              |
|  StatsBar (py-8, bg-muted/30)                                |
|    max-w-6xl mx-auto                                         |
|    grid-cols-2 md:grid-cols-4 gap-4                          |
|    [Stat: icon + number + label] x 4                         |
|                                                              |
|  ScenarioShortcuts (py-8)                                    |
|    max-w-6xl mx-auto                                         |
|    flex flex-wrap gap-2, centered                            |
|    [Tag pill] x 10 -> /skills?category=                      |
|                                                              |
|  EditorialHighlights (py-16)                                 |
|    max-w-6xl mx-auto                                         |
|    SectionHeader                                             |
|    lg:grid-cols-3: [Weekly large card] + [ArticleCard] x 2   |
|    Conditional: return null if no editorial content           |
|                                                              |
|  FeaturedTools (py-16)                                       |
|    max-w-6xl mx-auto                                         |
|    SectionHeader + Tabs (Skills / MCP)                       |
|    Compact list rows with stars and tool counts              |
|                                                              |
|  LatestArticles (py-16)                                      |
|    max-w-6xl mx-auto                                         |
|    SectionHeader                                             |
|    Compact list: type badge + title + date                   |
|                                                              |
|  NewsletterCta (py-16)                                       |
|    max-w-6xl mx-auto                                         |
|    Centered card with CTA                                    |
|                                                              |
+--------------------------------------------------------------+
```

Homepage section components follow standard token rules (-> DS:2) and do not
define custom visual specs beyond what is shown in this wireframe. Each section
uses `SectionHeader` (-> DS:4.9) for its title and the standard container
`max-w-6xl mx-auto px-4 sm:px-6`.

Pages using this pattern: `/` (homepage only)

---

## 7. Motion & Transitions

### 7.1 Transition Tokens

| Utility | Duration | Usage |
|---------|----------|-------|
| `transition-colors` | 150ms | Text/background color changes (link hover, button hover) |
| `transition-shadow` | 150ms | Card hover shadow changes |
| `transition-all` | 150ms | Multiple properties transitioning simultaneously |

### 7.2 Keyframe Animations

Defined in `globals.css` `@theme` block:

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

| Animation | Class | Usage |
|-----------|-------|-------|
| `animate-fade-in` | Page element entrance | Suspense fallback -> content |
| `animate-slide-up` | Card list entrance | Grid content loaded |

### 7.3 Motion Rules

| Rule | Value |
|------|-------|
| Hover effects | `transition-*` only, no keyframes |
| Page transitions | None (Next.js default) |
| Skeleton -> content | `animate-fade-in` (0.2s) |
| Dropdowns/modals | shadcn/ui built-in animations, do not override |
| **Prohibited** | bounce, wiggle, pulse (too flashy for a tool site) |

---

## 8. Dark Mode

### 8.1 Elevation by Lightness

In dark mode, distinguish layers by lightness, not color:

| Layer | Lightness | Usage |
|-------|-----------|-------|
| Background | 0.14 | Page base |
| Surface | 0.17 | Card background (--card) |
| Elevated | 0.21 | Muted background (--muted) |
| Overlay | 0.25 | Popover / Dialog |

### 8.2 New Component Checklist

Every new component must pass:

- [ ] Light mode: text vs background contrast >= 4.5:1
- [ ] Dark mode: text vs background contrast >= 4.5:1
- [ ] Brand/accent color not used as large-area background
- [ ] Hover/active states perceptible in dark mode
- [ ] Borders visible in dark mode (no `border-border/60`+ opacity)
- [ ] Code blocks / inline code readable in dark mode

### 8.3 Theme Toggle

Implementation: `useSyncExternalStore` to avoid hydration flicker (not `useEffect + setMounted`).

States: light -> dark -> system (3-way toggle via `next-themes`).

---

## 9. Accessibility

### 9.1 Color Contrast

| Element | Minimum Ratio | Standard |
|---------|--------------|----------|
| Body text (>= 16px) | 4.5:1 | WCAG AA |
| Large text (>= 18px bold or 24px) | 3:1 | WCAG AA |
| Interactive element borders | 3:1 against background | WCAG AA |
| Focus indicators | 3:1 against adjacent colors | WCAG AA |

### 9.2 Touch Targets

Minimum interactive target size: 36px x 36px (-> DS:5.7/M3).

| Element | Minimum Size | Implementation |
|---------|-------------|----------------|
| Icon buttons | `h-9 w-9` (36px) | Button size, icon stays `size-4` |
| Inline clear buttons | `p-2` (32px+ with icon) | Padding expands hit area |
| Tab/Filter pills | `h-8` (32px) min | Button `size="sm"` default |
| Card click area | Full card surface | `after:absolute after:inset-0` on link |

### 9.3 Keyboard Navigation

| Component | Keyboard Support |
|-----------|-----------------|
| NavLinks | Tab to focus, Enter to navigate |
| Button | Tab to focus, Enter/Space to activate |
| Select | Tab to focus, arrow keys to navigate options |
| Tabs | Tab to focus tab list, arrow keys between tabs |
| Sheet (MobileNav) | Escape to close |
| DropdownMenu | Escape to close, arrow keys between items |
| Card link | Tab to focus title link, Enter to navigate |

### 9.4 Semantic HTML

| Requirement | Implementation |
|-------------|----------------|
| Page landmark | `<header>`, `<main>`, `<footer>` in root layout |
| Heading hierarchy | h1 per page (SectionHeader `as="h1"`), h2/h3 nested correctly |
| Nav label | `<nav>` in SiteHeader with implicit landmark |
| Image alt | Not applicable (no content images; icons are decorative) |
| Sheet title | `<SheetTitle>` required by shadcn/ui for screen readers |
| Link purpose | Card titles are descriptive links; "View all" links have context |
| Skip to content | [DEFAULT: not implemented] |

---

## 10. Exclusions

| Exclusion | Rationale |
|-----------|-----------|
| Style Dictionary / Token Studio | Over-engineering for 1-2 person team |
| Multi-file token splitting | Project not large enough; single `globals.css` is maintainable |
| Fluid Typography (clamp) | Breakpoint model more predictable for a tool site |
| Component Token layer | Not enough components; use semantic tokens directly |
| `@apply` for component styles | Use React components + Tailwind classes |
| Tailwind Variants library | CVA already meets needs |
| `<PageShell>` / `<GenericCard>` abstractions | Tailwind class conventions ARE the design language |
| bounce / wiggle / pulse animations | Tool site users come to work, not watch animations |
| Full Geist font replacement | Current Inter + Chinese font stack is good enough |
| P3 wide gamut support | Device coverage insufficient; OKLch sRGB is enough |
| Skip-to-content link | Low traffic, no accessibility compliance requirement yet |

---

## 11. Version History

```
## [1.0.0] - 2026-03-15

### Added
- Initial version: full design specification
- Migrated from docs/specs/design-system.md with template structure
- New sections: Interaction Patterns (§5), Composition Patterns (§6), Accessibility (§9)
- Shared vocabulary linked to product-spec.md (-> PS:0.2)

### Source
- Original: docs/specs/design-system.md (v1, 2026-03-08)
- Research: 3 parallel studies (best practices + competitive analysis + project audit)
```
