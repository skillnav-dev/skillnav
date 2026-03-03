# Handoff — 部署管线完成 + 分类体系修复已规划

## Objective
搭建 Cloudflare Workers 部署管线，让 skillnav.dev 正式上线；随后修复 Skills 分类数据质量。

## Current State

### Completed
- **部署管线搭建**（本次会话核心成果）:
  - `@opennextjs/cloudflare@1.17.1` + `wrangler@4.69.0` 安装为 devDependencies
  - `wrangler.jsonc` — Worker 配置（name: skillnav, nodejs_compat, ASSETS binding）
  - `open-next.config.ts` — 最简 OpenNext 配置（无 R2 缓存）
  - `next.config.ts` — 添加 `initOpenNextCloudflareForDev()`
  - `.github/workflows/deploy.yml` — CI/CD（lint → typecheck → build → deploy）
  - `public/_headers` — 静态资源 immutable 缓存
  - `eslint.config.mjs` — 添加 `.open-next/**` 到 globalIgnores
  - `.gitignore` — 添加 `.open-next`, `.dev.vars`, `cloudflare-env.d.ts`
  - `package.json` — 添加 preview/deploy/cf-typegen scripts
  - GitHub Secrets 配置完成（CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY）
  - Cloudflare Pages 自动构建已暂停，切换为 Workers 部署
  - **skillnav.dev 已上线可访问**，Worker URL: `skillnav.wh759705.workers.dev`
- **前序完成项**（之前会话）:
  - Skills 列表页 `/skills` — Suspense 流式 + nuqs 分页/搜索/分类过滤
  - Skills 详情页 `/skills/[slug]` + SkillMeta 组件
  - Articles 列表页 + 详情页
  - ClawHub 全量同步 6,424 skills
  - Supabase DAL 完整

### In Progress
- 无（工作区干净）

## Next Actions

### 优先级 1：Skills 分类体系修复（已完成数据分析和方案设计）

**问题数据**：6,424 skills 中 5,722 个（89.1%）分类为"其他"，根因是 95.7% 的 skills 无 tags，`inferCategory()` 仅 23 个关键词。

**已批准方案**（见 `.claude/plans/spicy-gathering-pine.md`）：
1. `scripts/recategorize-skills.mjs` — **新建**一次性迁移脚本
   - 扩展关键词映射：23 → 150+
   - 三层匹配 + 评分制：tags(权重3) → name(权重2) → description(权重1)
   - 新增"金融"分类（crypto/trading/defi 占比高）
   - 批量更新数据库
   - 目标："其他"从 89% 降至 30% 以下
2. `scripts/sync-clawhub.mjs:inferCategory()` — 替换为新版分类逻辑
3. 运行迁移 → `npm run build` → 验证 `/skills` 分类过滤器

### 优先级 2：搜索体验优化
4. `src/components/skills/skills-toolbar.tsx` — 搜索结果高亮匹配关键词
5. 考虑 Orama 客户端搜索

### 优先级 3：Articles 列表页升级
6. `src/app/articles/page.tsx` — 参考 skills 实现添加分页 + 分类过滤

### 优先级 4：数据补全
7. 删除 `idx_skills_dedup` 约束，重跑丢失的约 500 条记录

## Risks & Decisions
- **分类精度 vs 覆盖率权衡**：规则引擎可覆盖 60-70%，剩余可后续用 LLM 补充
- **Workers 冷启动**：首次请求约 2.8s，后续正常（Cloudflare 预热机制会改善）
- **CI 构建差异**：CI 上只生成 25 个静态页（本地 1010 个），因动态路由在 CI 无 Supabase 完整连接时回退为动态渲染，不影响功能
- **Cloudflare Pages 项目**：已暂停但未删除，保留为紧急回滚备选

## Verification
- `npm run build` — 零错误，8 个路由
- `npm run lint` — 零错误
- `skillnav.dev` — 首页/skills/articles 全部 HTTP 200
- GitHub Actions — push main 自动触发部署

## Modified Files (本次会话)
- `package.json` / `package-lock.json` — 添加 @opennextjs/cloudflare + wrangler + scripts
- `wrangler.jsonc` — **新建**，Workers 配置
- `open-next.config.ts` — **新建**，OpenNext 配置
- `next.config.ts` — 添加 initOpenNextCloudflareForDev()
- `.github/workflows/deploy.yml` — **新建**，CI/CD 流水线
- `public/_headers` — **新建**，静态资源缓存
- `eslint.config.mjs` — 添加 .open-next 忽略
- `.gitignore` — 添加 .open-next / .dev.vars / cloudflare-env.d.ts

## Key References
- 产品方案：`/Users/apple/WeChatProjects/tishici/docs/playbook/skillnav-product-plan.md`
- 分类修复方案：`.claude/plans/spicy-gathering-pine.md`
- DAL 代码：`src/lib/data/skills.ts`、`src/lib/data/articles.ts`
- 同步脚本：`scripts/sync-clawhub.mjs`（含当前 inferCategory）
- Supabase 项目：`caapclmylemgbrtgfszd`
- Worker URL：`skillnav.wh759705.workers.dev`
- 自定义域名：`skillnav.dev`
