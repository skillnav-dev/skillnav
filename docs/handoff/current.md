# Handoff — 分类体系修复完成 + 后续优化待启动

## Objective
修复 Skills 分类数据质量，将"其他"占比从 89.1% 降至 30% 以下，提升分类过滤器的实用价值。

## Current State

### Completed
- **分类体系修复**（本次会话核心成果）:
  - `scripts/lib/categorize.mjs` — **新建**共享分类模块
    - 16 个分类（原 9 个 + 金融/写作/通讯/DevOps/教育/自动化/AI）
    - ~470 个关键词（原 23 个）
    - 三层加权评分算法：tags(×3) → name(×2) → description(×1)
    - 全词匹配满分 + 子串匹配半分 + 最低置信度阈值 2
  - `scripts/recategorize-skills.mjs` — **新建**一次性迁移脚本
    - 支持 `--dry-run` / `--sample N` / `--limit N`
    - 分页读取 + 50 并发批量更新 + 进度条
  - `scripts/sync-clawhub.mjs` — 替换旧 `inferCategory()` 为新 `categorize()`
  - **数据库迁移已执行**：4,224 条 skills 更新，零错误
  - **"其他"占比：89.1% → 26.9%** ✓（目标 < 30%）
- **前序完成项**:
  - skillnav.dev 已上线（Cloudflare Workers）
  - Skills 列表页 `/skills` — Suspense 流式 + nuqs 分页/搜索/分类过滤
  - Skills 详情页 `/skills/[slug]` + SkillMeta 组件
  - Articles 列表页 + 详情页
  - ClawHub 全量同步 6,424 skills
  - Supabase DAL 完整
  - CI/CD（GitHub Actions → lint → typecheck → build → deploy）

### In Progress
- 无（工作区干净，本地领先 origin 1 commit 待 push）

## Next Actions

### 优先级 1：搜索体验优化
1. `src/components/skills/skills-toolbar.tsx` — 搜索结果高亮匹配关键词
2. 考虑 Orama 客户端搜索替代 Supabase 全文搜索

### 优先级 2：Articles 列表页升级
3. `src/app/articles/page.tsx` — 参考 skills 实现添加分页 + 分类过滤
4. 复用 nuqs + Suspense 模式

### 优先级 3：数据补全
5. 删除 `idx_skills_dedup` 约束，重跑丢失的约 500 条记录

### 优先级 4：分类进一步优化（可选）
6. 对剩余 1,725 个"其他"skills 用 LLM 批量分类（调 API）
7. 考虑为分类添加 icon/color 元数据提升 UI 视觉区分度

## Risks & Decisions
- **分类精度**：规则引擎已覆盖 73.1%，剩余 26.9% 多为命名模糊的 skills，可后续用 LLM 补充
- **"token" 关键词冲突**：同时出现在金融和安全分类中，依靠累积分数消歧，实测效果可接受
- **Workers 冷启动**：首次请求约 2.8s，后续正常
- **CI 构建差异**：CI 上只生成 25 个静态页（本地 1010 个），不影响功能
- **本地 1 commit 未 push**：`7e50665 feat(data): expand skill categorization...`

## Verification
- `npm run build` — 零错误，8 个路由，1010 静态页
- `npm run lint` — 零错误
- `node scripts/recategorize-skills.mjs --dry-run` — 确认分类分布
- `skillnav.dev` — push 后验证 `/skills` 页面 16 个分类 tab

## Modified Files (本次会话)
- `scripts/lib/categorize.mjs` — **新建**，共享分类模块（~470 关键词 + 加权评分算法）
- `scripts/recategorize-skills.mjs` — **新建**，一次性迁移脚本
- `scripts/sync-clawhub.mjs` — 删除旧 CATEGORY_MAP + inferCategory，引入共享 categorize()

## Key References
- 产品方案：`/Users/apple/WeChatProjects/tishici/docs/playbook/skillnav-product-plan.md`
- 分类模块：`scripts/lib/categorize.mjs`
- DAL 代码：`src/lib/data/skills.ts`、`src/lib/data/articles.ts`
- 同步脚本：`scripts/sync-clawhub.mjs`
- Supabase 项目：`caapclmylemgbrtgfszd`
- Worker URL：`skillnav.wh759705.workers.dev`
- 自定义域名：`skillnav.dev`
