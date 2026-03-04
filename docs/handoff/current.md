# Handoff — Skill Content 回填完成

## Objective
将 6447 条 skill 的 SKILL.md 原始内容（content 字段）从 GitHub 回填到 Supabase，为 skill 详情页提供完整内容展示。

## Current State

### Completed
- **Content 回填达到 98.9%**：6378/6447 skills 有 content
- **`--backfill-content` 模式**：`sync-clawhub.mjs` 新增独立回填流程
  - `backfillContentFromDb()`: 从 DB 查 NULL-content skills 的 `{slug, github_url}` → 提取 GitHub 路径 → fetch SKILL.md → `.update()` content 字段
  - 避免了 slug 格式不一致问题（旧 `name-only` vs 新 `author--name`）
  - 避免了 upsert 唯一约束冲突（只更新 content 字段，不触碰 name/author/source）
- **并发 fetch**：CI 10 并发 / 本地 3 并发（`Promise.allSettled` 分块）
- **Workflow 支持**：`sync-skills.yml` 新增 `backfill_content` 手动触发输入
- **两轮回填**：
  - 第一轮：基于 slug 过滤，upsert 5191 条（507 → 5232，81.2%）
  - 第二轮：基于 DB github_url，update 1146 条（5232 → 6378，98.9%）
- **自动化系统**（上一会话完成）：3 个 cron workflow + health check + Slack 通知

### Remaining NULL Content (69 条)
- 49 条 — GitHub 仓库已删除 SKILL.md（404 孤儿数据）
- 16 条 — anthropic 源，不走 ClawHub 同步
- 3 条 — 无 `github_url` 的手工录入
- 1 条 — 边界情况

### Not Started (后续任务)
- T4: `scripts/translate-skill-content.mjs` — content_zh 批量翻译（content 回填已完成，可启动）
- T5: `scripts/enrich-skills.mjs` — GPT 丰富化（有流量数据后启用）
- T7: `scripts/check-links.mjs` — 死链检测（数据稳定后启用）
- 清理 49 条 404 孤儿 skill 记录（可选）

## Next Actions
1. 启动 T4：`scripts/translate-skill-content.mjs` — 用 LLM 批量翻译 skill content 为 content_zh
2. 监控 Slack 通知确认 cron 稳定运行
3. 可选：清理 49 条 GitHub 已删除的孤儿 skill 记录
4. 可选：为 16 条 anthropic 源 skill 补充 content（需单独抓取 anthropic docs）

## Risks & Decisions
- **数据同步应跑 GitHub Actions**：本地到 GitHub/Supabase 的网络延迟高（国内），CI 同网络快 30x+
- **slug 格式不一致是历史债务**：DB 中存在 `name-only`、`author-name`、`author--name` 三种格式，回填通过 DB github_url 绕过了此问题
- **upsert ignoreDuplicates 陷阱**：`true` 时不更新已有记录，需 `false` 才能更新；但 `false` 可能触发 (name,author,source) 唯一约束冲突，因此回填改用 `.update()` 只更新 content 字段
- **GPT 代理已验证可用于 CI**：`LLM_PROVIDER=gpt`，访问 `gmn.chuangzuori.com` 正常

## Verification
- `npm run lint` — 零错误
- `npm run build` — 构建通过（本地可能因 Supabase 网络失败，CI 正常）
- `node scripts/sync-clawhub.mjs --backfill-content --dry-run` — 回填 dry-run（需 DB 连接）
- `node scripts/sync-clawhub.mjs --dry-run --limit 3` — ClawHub 常规同步
- GitHub Actions: `gh workflow run "Sync Skills" --field backfill_content=true` — 远程回填

## Modified Files (本次会话)
- `scripts/sync-clawhub.mjs` — +backfillContentFromDb() +concurrent fetch +--backfill-content flag
- `.github/workflows/sync-skills.yml` — +backfill_content input +GITHUB_TOKEN +timeout 90min

## Key References
- 自动化方案：`docs/plans/automation-tasks.md`
- 内容管线方案：`docs/plans/content-pipeline.md`
- 同步脚本：`scripts/sync-clawhub.mjs`（backfill 核心）
- LLM 模块：`scripts/lib/llm.mjs`（5 providers）
- Supabase 项目：`caapclmylemgbrtgfszd`
- Worker URL：`skillnav.wh759705.workers.dev`
- 域名：`skillnav.dev`
