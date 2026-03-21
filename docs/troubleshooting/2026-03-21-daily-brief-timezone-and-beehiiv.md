# Daily Brief 时区 Bug + Beehiiv 源 403

Date: 2026-03-21
Status: resolved
Tags: CI, signals, timezone, scraping

## 问题 1: Daily Brief 未生成

**现象**: CI 在 UTC 22:30（CST 06:30）运行 `generate-daily.mjs`，日志显示 "Brief for 2026-03-20 is already approved. Use --force to overwrite."，3/21 的 brief 未生成。

**根因**: `new Date()` 返回 UTC 日期。CI 在 UTC 22:53 运行时日期还是 3/20，但 3/20 的 brief 已 approved，所以跳过。应该用 CST 日期（3/21）。

**修复**: `generate-daily.mjs` 和 `scrape-signals.mjs` 都改用 CST 日期：
```js
function todayCST() {
  const now = new Date();
  const cst = new Date(now.getTime() + 8 * 3600 * 1000);
  return new Date(cst.toISOString().slice(0, 10));
}
```

**受影响文件**: `scripts/generate-daily.mjs`, `scripts/scrape-signals.mjs`

## 问题 2: Superhuman / Neuron 403

**现象**: CI 中 Superhuman 和 Neuron（均为 beehiiv 平台）返回 HTTP 403。本地正常。

**根因**: Cloudflare 对 GitHub Actions IP 段返回 JS Challenge / 403。beehiiv 全站开了 Cloudflare 防护，包括 `/feed` RSS 端点。

**修复**:
1. 新增 `BROWSER_HEADERS` 常量（补全 Sec-Fetch-* 等 headers），降低 CF 拦截率
2. 新增 `scrapeBeehiivHomepage()` 通用函数：只从首页解析，不访问文章详情页
   - Strategy 1: 从首页嵌入的 JSON（beehiiv SSR `"posts":[]`）提取文章标题和 ALSO 子话题
   - Strategy 2: Fallback 到 HTML 中 `/p/slug` 链接提取
3. Superhuman 和 Neuron 都改用此函数

**结果**: Superhuman 从 0 → 6 items，Neuron 从 0 → 3 items。Heat 2 话题从 2 → 5 个。

**教训**:
- beehiiv 平台的 Cloudflare 会封云 IP，RSS/feed 也不例外
- 首页 SSR HTML 包含足够的结构化数据（嵌入 JSON），不需要访问详情页
- TLDR 周末不发刊是正常的，不是 bug
