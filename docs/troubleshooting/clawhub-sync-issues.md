# ClawHub 同步问题记录

## 1. Supabase Upsert 双重唯一约束冲突

- **时间**：2026-03-03
- **环境/版本**：Supabase PostgreSQL · @supabase/supabase-js · Next.js 16.1.6
- **问题描述**：`npm run sync:clawhub` 全量同步 8000+ skills 时，所有 batch 的 upsert 均报错 `duplicate key value violates unique constraint "idx_skills_dedup"`，0 条入库。
- **根本原因**：`skills` 表同时存在两个唯一约束：
  1. `slug TEXT UNIQUE NOT NULL` — 主键级唯一
  2. `idx_skills_dedup ON (lower(name), lower(coalesce(author, '')), source)` — 联合去重索引

  Supabase 的 `.upsert(data, { onConflict: "slug" })` 只能指定一个冲突目标。当 slug 不冲突但 `(name, author, source)` 冲突时，PostgreSQL 抛出约束违反错误，且整个 batch（500 条）全部回滚。
- **解决方案**：
  1. 批次内按 `slug` 和 `(lower(name), lower(author), source)` 双重去重
  2. upsert 改为 `ignoreDuplicates: true`，跳过跨批次的约束冲突而非整批失败
  ```js
  // Before
  .upsert(batch, { onConflict: "slug", ignoreDuplicates: false })
  // After
  .upsert(batch, { onConflict: "slug", ignoreDuplicates: true })
  ```
- **参考链接**：[Supabase Upsert 文档](https://supabase.com/docs/reference/javascript/upsert)
- **备注/注意事项**：`ignoreDuplicates: true` 意味着已存在记录不会被更新。如果后续需要"存在则更新"的语义，应考虑删除 `idx_skills_dedup` 约束（新 slug 格式已天然去重），或改用逐条 upsert + 错误处理。

---

## 2. Slug 冲突 — 不同 Author 的同名 Skill 覆盖

- **时间**：2026-03-03
- **环境/版本**：`scripts/sync-clawhub.mjs`
- **问题描述**：不同 author 发布的同名 skill（如 `web-search`）生成了相同的 slug，导致：
  1. 批次内同 slug 记录触发 `ON CONFLICT DO UPDATE command cannot affect row a second time`
  2. 后写入的记录覆盖先写入的，数据丢失
- **根本原因**：slug 仅由目录名 `slugify(dirName)` 生成，未包含 author 信息。ClawHub 仓库结构为 `skills/<author>/<skill-name>/SKILL.md`，不同 author 可以有同名 skill。
- **解决方案**：slug 格式改为 `author--skill-name`：
  ```js
  // Before
  const slug = slugify(dirName);
  // After
  const slug = slugify(`${author}--${dirName}`);
  ```
  示例：`web-search` → `anthropic--web-search`、`john--web-search`
- **参考链接**：无
- **备注/注意事项**：slug 格式变更是破坏性变化。已有数据（20 条旧格式 slug）需手动清理或保留。前端 URL 会从 `/skills/web-search` 变为 `/skills/anthropic--web-search`。

---

## 3. GitHub API 批量 Fetch 超时

- **时间**：2026-03-03
- **环境/版本**：GitHub Raw Content API (`raw.githubusercontent.com`) · Node.js 内置 `fetch`
- **问题描述**：Batch 4（offset 6000, limit 2367）在处理到约 2000 条时，后续请求连续返回 `fetch failed`，274 个文件无法下载，最终 0 条入库。
- **根本原因**：4 个批次并行运行，同时向 GitHub 发起大量请求。`raw.githubusercontent.com` 对未认证请求有隐性速率限制，累计请求过多后触发连接拒绝。单批 2000 条 × 4 并行 = 8000 并发请求流，超出限制。
- **解决方案**：
  1. 新增 `--skip-existing` 参数，重试时只处理未入库的 skill，避免重复请求
  2. 重试失败批次：`npm run sync:clawhub -- --offset 6000 --limit 2367 --skip-existing`
  ```js
  if (skipExisting && supabase) {
    const { data: rows } = await supabase.from("skills").select("slug");
    const existingSlugs = new Set(rows.map((r) => r.slug));
    filesToProcess = filesToProcess.filter((file) => {
      // compute slug from file path
      return !existingSlugs.has(slug);
    });
  }
  ```
- **参考链接**：[GitHub Rate Limiting](https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api)
- **备注/注意事项**：
  - 配置 `GITHUB_TOKEN` 可将 API 限额从 60 次/小时提升到 5000 次/小时
  - `raw.githubusercontent.com` 的限速规则不同于 API，无 `x-ratelimit-*` 头，难以精确检测
  - 建议避免 4 批次完全并行，改为串行或最多 2 并行

---

## 4. 同步脚本无进度反馈

- **时间**：2026-03-03
- **环境/版本**：`scripts/sync-clawhub.mjs` · `scripts/lib/logger.mjs`
- **问题描述**：全量同步 8000+ skills 需要 15+ 分钟，运行期间终端无任何输出，无法判断进度、速率、预计完成时间，也无法判断脚本是否卡死。
- **根本原因**：原始脚本只在开始和结束时打印日志，中间处理循环无任何输出。
- **解决方案**：在 `logger.mjs` 中新增 `progress()` 方法，支持单行刷新的进度条：
  ```
  [clawhub] [327/8364] 3.9% ████░░░░░░ 2.2/s ETA 10m52s Err:2  author/skill-name
  ```
  - TTY 环境：单行刷新（`stderr.clearLine + cursorTo`）
  - 非 TTY 环境（CI）：每 200 条打印一行，避免日志爆炸
- **参考链接**：无
- **备注/注意事项**：进度输出到 `stderr` 而非 `stdout`，不影响管道输出。

---

## 5. 同步中断后无法断点续传

- **时间**：2026-03-03
- **环境/版本**：`scripts/sync-clawhub.mjs`
- **问题描述**：上一次会话启动了 `npm run sync:clawhub` 全量同步 8364 skills，进程中断后数据库仍只有 3 条 ClawHub 数据，无法从断点恢复，必须从头开始。
- **根本原因**：脚本先抓取全部文件再一次性 upsert，中途中断则所有已解析数据丢失。无 checkpoint 机制，也无分段能力。
- **解决方案**：
  1. 新增 `--offset` + `--limit` 参数，支持分段采集
  2. 新增 `--skip-existing` 参数，重试时跳过已入库数据
  3. 使用方式：
  ```bash
  # 分段采集
  npm run sync:clawhub -- --offset 0 --limit 2000
  npm run sync:clawhub -- --offset 2000 --limit 2000

  # 重试失败
  npm run sync:clawhub -- --offset 6000 --limit 2367 --skip-existing
  ```
- **参考链接**：无
- **备注/注意事项**：upsert 使用 `ignoreDuplicates: true`，重复运行相同范围是安全的（幂等），不会产生重复数据。
