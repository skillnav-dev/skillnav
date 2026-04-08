# 感知层 + 热度看板评审发现与修复

Date: 2026-04-08
Context: Phase 0-2 实现后两轮多 agent 评审（5+3 agents）

## 发现与修复

### F1: HN 关键词子串匹配假阳性 (P0)

**症状**: `"ai"` 用 `String.includes()` 匹配到 `"maintain"`, `"certain"` 等词
**根因**: `matchesKeywords` 用 `lower.includes(kw)` 做子串匹配，短关键词（ai, phi, mcp）会产生大量假阳性
**修复**: 改为 `\b` 词边界正则匹配，预编译 + 缓存 regex 对象
**文件**: `scripts/scrape-hn-signals.mjs`

### F2: page.tsx 645 行违反 300 行规则 (P1)

**症状**: 所有数据获取、UI 组件、类型定义塞在一个文件
**修复**: 拆为 4 文件 — `page.tsx` (117) + `trending-data.ts` (243) + `track-components.tsx` (259) + `source-health-bar.tsx` (41)

### F3: URL XSS 风险 (P1)

**症状**: community_signals 的 url 字段直接用于 `<a href>`，`javascript:` 协议可注入
**修复**: 采集端过滤非 `https://` URL + 展示端 `isSafeUrl()` 校验
**文件**: `scrape-x-signals.mjs`, `scrape-hn-signals.mjs`, `track-components.tsx`

### F4: Supabase 类型 hack (P1)

**症状**: `community_signals` 未加入 types.ts，所有查询用 `as "skills"` + `as unknown as` 绕过类型系统
**修复**: 手动添加 `community_signals` 到 types.ts + 用 `.returns<T>()` 替代所有 `as unknown as`
**文件**: `src/lib/supabase/types.ts`, `src/lib/trending-data.ts`

### F5: 串行查询 waterfall (P1)

**症状**: `crossRefTranslated` 和 `fetchSourceHealth` 在 4 路并行查询之后串行执行
**修复**: 合入第二个 `Promise.all` 并行执行
**文件**: `src/lib/trending-data.ts`

## 预防

- 新增 HN 关键词时使用 `\b` 词边界匹配，短词（≤3 字符）必须加词边界
- 新建 DB 表后立即更新 `src/lib/supabase/types.ts`，不要用 `as "skills"` hack
- 外部 URL 渲染前必须校验协议（`https://` 或 `http://`）
