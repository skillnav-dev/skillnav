# Handoff — 内容管线搭建 + Articles 模块升级

## Objective
搭建自动化内容管线（RSS → 翻译 → 入库），让 Articles 模块从空壳变为有持续内容流入的引流引擎。

## Current State

### Completed
- **Articles 列表页升级**:
  - `src/lib/articles-search-params.ts` — nuqs 参数定义 (q, category, page)
  - `src/components/articles/articles-toolbar.tsx` — 搜索 + 7 类分类过滤
  - `src/components/articles/articles-grid.tsx` — 数据加载 + 卡片网格
  - `src/components/articles/articles-pagination.tsx` — 分页导航
  - `src/components/articles/articles-empty.tsx` — 空状态提示
  - `src/components/articles/articles-skeleton.tsx` — 骨架屏
  - `src/app/articles/page.tsx` — Suspense 流式 + 参数解析
  - `src/lib/data/articles.ts` — 新增 `getArticlesWithCount()` + `getArticleCategories()`
- **内容管线基础设施**:
  - `scripts/lib/llm.mjs` — 多 provider LLM 模块（deepseek/gemini/anthropic/openai）
  - `scripts/sync-articles.mjs` — RSS 同步管线（抓取 → 去重 → 提取 → 翻译 → 入库）
  - 4 个 RSS 源配置：Anthropic、OpenAI、LangChain、Simon Willison
  - `--dry-run` 已验证管线流程正确（RSS 抓取 + 内容提取 + 去重）
  - `source_url` 唯一约束已在 Supabase 创建
  - npm script: `sync:articles`
- **文档**:
  - `docs/plans/content-pipeline.md` — 项目方案存档
  - `/Users/apple/WeChatProjects/tishici/docs/playbook/content-pipeline-pattern.md` — 通用 playbook

### In Progress
- **LLM provider 配置**：DeepSeek 余额不足、Gemini 配额耗尽，需要充值或换 provider 后才能正式跑管线

## Next Actions

### 优先级 1：打通管线（差最后一步）
1. 充值 LLM provider（DeepSeek 充 10 元最便宜 / Gemini 开计费 / Anthropic 创建 key）
2. 运行 `LLM_PROVIDER=<provider> node scripts/sync-articles.mjs --limit 3` 验证端到端
3. 确认文章出现在 skillnav.dev/articles

### 优先级 2：搜索体验优化
4. `src/components/skills/skills-toolbar.tsx` — 搜索结果高亮匹配关键词
5. 考虑 Orama 客户端搜索替代 Supabase 全文搜索

### 优先级 3：数据补全
6. 删除 `idx_skills_dedup` 约束，重跑丢失的约 500 条 skills 记录

### 优先级 4：自动化
7. GitHub Actions 定时运行 `sync:articles`（每日/每周）
8. 添加翻译质量人工审核工作流（draft → publish）

## Risks & Decisions
- **LLM 成本**：DeepSeek ~$0.001/篇 最便宜，Gemini 有免费额度但限制严，Anthropic ~$0.005/篇
- **Anthropic RSS**：官方无 RSS，使用社区维护的 GitHub 源，依赖第三方更新
- **DB article_type**：只有 5 个值（缺 analysis/release），LLM 返回的类型需映射
- **Workers 冷启动**：首次请求约 2.8s
- **LLM_PROVIDER 默认 deepseek**：如需切换，设置 `LLM_PROVIDER=gemini|anthropic|openai` 环境变量

## Verification
- `npm run lint` — 零错误
- `npm run build` — 零错误，1010 静态页
- `node scripts/sync-articles.mjs --dry-run --limit 2` — 验证管线流程（不需要 API key）

## Modified Files (本次会话)
- `src/lib/articles-search-params.ts` — **新建**，nuqs 参数定义
- `src/lib/data/articles.ts` — 修改，+getArticlesWithCount +getArticleCategories
- `src/components/articles/articles-toolbar.tsx` — **新建**
- `src/components/articles/articles-grid.tsx` — **新建**
- `src/components/articles/articles-pagination.tsx` — **新建**
- `src/components/articles/articles-empty.tsx` — **新建**
- `src/components/articles/articles-skeleton.tsx` — **新建**
- `src/app/articles/page.tsx` — 修改，Suspense 流式改造
- `scripts/lib/llm.mjs` — **新建**，多 provider LLM 模块
- `scripts/sync-articles.mjs` — **新建**，RSS 同步管线
- `docs/plans/content-pipeline.md` — **新建**，方案存档
- `package.json` — 修改，+sync:articles +4 新依赖

## Key References
- 产品方案：`/Users/apple/WeChatProjects/tishici/docs/playbook/skillnav-product-plan.md`
- 通用 playbook：`/Users/apple/WeChatProjects/tishici/docs/playbook/content-pipeline-pattern.md`
- LLM 模块：`scripts/lib/llm.mjs`（支持 deepseek/gemini/anthropic/openai）
- 同步脚本：`scripts/sync-articles.mjs`
- DAL 代码：`src/lib/data/skills.ts`、`src/lib/data/articles.ts`
- Supabase 项目：`caapclmylemgbrtgfszd`
- Worker URL：`skillnav.wh759705.workers.dev`
- 自定义域名：`skillnav.dev`
