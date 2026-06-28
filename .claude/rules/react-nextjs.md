---
paths: ["src/**/*.tsx", "src/**/*.ts"]
---
# React / Next.js Pitfalls

- `useEffect(() => { setMounted(true) }, [])` triggers `react-hooks/set-state-in-effect` — use `useSyncExternalStore` or suppress with care
- shadcn/ui components must be installed before import: `npx shadcn@latest add <component>`
- Next.js 15 uses async `params` in dynamic routes — destructure with `await` in server components
- New SSR pages MUST set `export const revalidate` — without it, CF Worker renders on every request → 1102 errors
- After editing an ISR page/API (`export const revalidate = N`), a successful deploy does NOT mean the live response updated. OpenNext on CF Workers serves stale-while-revalidate from R2 + edge cache. Don't curl the live URL right after deploy and conclude the fix failed — verify via deployed headSha + git remote code, then wait out the `revalidate` window (`?t=` query param does NOT bypass path-level ISR)
- Heavy client-only libraries (KaTeX, chart libs) must use `lazy()` / dynamic import — never import at top level in server components
- `getArticleBySlug` does NOT select content/content_zh — article content loads client-side via Supabase REST API to avoid CF Worker CPU timeout. Never re-add `content` to the server query
- `remark-math` multiline `$$` display math: `\\` + newline inside inline `$$content$$` is treated as markdown hard break. Fix: `normalizeMath()` in `article-content.tsx` converts all `$$` to fenced format
