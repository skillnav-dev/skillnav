# CF Worker 1102: 论文页面超时

Date: 2026-04-06

## 症状

- 12 万字论文翻译页（Latent Space）返回 503 (error 1102: Worker exceeded resource limits)
- 所有论文页面不稳定，19K-29K 的文章也间歇 503

## 根因（三层）

### 1. ISR 缓存未配置（主因）

`wrangler.jsonc` 缺少 R2 bucket 和 Durable Object 绑定，`open-next.config.ts` 是空配置。虽然代码层声明了 `export const revalidate = 3600`，但没有缓存后端 → 每次请求都重新 SSR → 12 万字每次序列化都超时。

**验证**：所有页面 `cache-control: private, no-cache, no-store`（注意：OpenNext 的 ISR 是内部 R2 存储，不改 HTTP 头，但当时完全没配 R2）。

### 2. getArticleBySlug SELECT * 拉全量

即使 ISR 配好，首次渲染仍超时。原因是 `getArticleBySlug` 用 `SELECT *` 从 Supabase 拉 120K 字符串到 Worker 内存。JSON.parse 膨胀 2-4x，并发时逼近 128MB 内存上限。

### 3. ar5iv 图片 URL 拼接错误（附带发现）

`translate-paper.mjs` 的 `baseUrl` 拼接导致图片 URL 多了一层路径：
- 错误：`https://arxiv.org/html/2604.01658/2604.01658v1/x2.png` (404)
- 正确：`https://arxiv.org/html/2604.01658v1/x2.png` (200)

## 修复

### Fix 1: ISR 缓存配置

```jsonc
// wrangler.jsonc
"r2_buckets": [{ "binding": "NEXT_INC_CACHE_R2_BUCKET", "bucket_name": "skillnav-cache" }],
"durable_objects": { "bindings": [{ "name": "NEXT_CACHE_DO_QUEUE", "class_name": "DOQueueHandler" }] }
```

```typescript
// open-next.config.ts
incrementalCache: withRegionalCache(r2IncrementalCache, { mode: "long-lived" }),
queue: doQueue,
```

### Fix 2: 列裁剪 + 客户端加载

- `getArticleBySlug` 改为只查元数据列（不含 content/content_zh）
- 所有文章内容由浏览器直接从 Supabase REST API 加载（绕过 CF Worker）
- `ArticleContent` 组件用 `useEffect` fetch Supabase，骨架屏过渡

### Fix 3: 图片 URL 修正

`translate-paper.mjs` 的 `baseUrl` 从 `https://arxiv.org/html/${arxivId}` 改为 `https://arxiv.org/html`。已批量修复 DB + Vault 中 6 篇论文的图片 URL。

## 预防

- 新增 SSR 页面必须验证 content 传输大小，超过 20K 考虑客户端加载
- 翻译新论文后验证图片 URL 可访问性
- ISR 配置纳入部署检查清单
