# Handoff — GPT Provider 接入 + 内容管线打通

## Objective
接入 GPT 代理 API（OpenAI Responses API），打通内容管线端到端流程，完成首批文章同步入库。

## Current State

### Completed
- **GPT Provider 接入**:
  - `scripts/lib/llm.mjs` — 新增 `gpt` provider（OpenAI Responses API 格式）
  - `callOpenAIResponses()` — 支持 `input` 数组格式（developer/user message）
  - `openai` provider 支持 `OPENAI_BASE_URL` 环境变量覆盖
  - `.env.local` — 配置 `GPT_API_KEY`
  - 代理地址：`https://gmn.chuangzuoli.com/v1`，模型：`gpt-5.3-codex`
- **速率限制**:
  - `scripts/sync-articles.mjs` — `createRateLimiter(10)` 限速 10 次/分钟
  - 智能补齐：扣除 LLM 调用耗时，只补差额等待
- **文章同步完成**:
  - 已入库 **29 篇文章**（来自 4 个 RSS 源）
  - 运行命令：`LLM_PROVIDER=gpt node scripts/sync-articles.mjs --limit 10`
- **文章详情页中文显示修复**:
  - `src/app/articles/[slug]/page.tsx` — `article.content` → `article.contentZh ?? article.content`
- **已部署**：commit `03b0e2e` 已推送并触发 CI/CD

### In Progress
- 无（本次会话任务全部完成）

## Next Actions

### 优先级 1：继续同步更多文章
1. 网络稳定后运行 `LLM_PROVIDER=gpt node scripts/sync-articles.mjs --limit 20` 扩大同步范围
2. 部分文章因网络 TLS 断连失败（OpenAI/LangChain RSS 源不稳定），重跑即可

### 优先级 2：搜索体验优化
3. `src/components/skills/skills-toolbar.tsx` — 搜索结果高亮匹配关键词
4. 考虑 Orama 客户端搜索替代 Supabase 全文搜索

### 优先级 3：数据补全
5. 删除 `idx_skills_dedup` 约束，重跑丢失的约 500 条 skills 记录

### 优先级 4：自动化
6. GitHub Actions 定时运行 `sync:articles`（每日/每周），需配置 `GPT_API_KEY` secret
7. 添加翻译质量人工审核工作流（draft → publish）

### 优先级 5：内容质量
8. 部分文章翻译标题过短（如"交互式解释"、"二月赞助者专属通讯"），考虑优化 prompt 要求标题更具信息量
9. `ArticleContent` 组件的 markdown 渲染较简陋，考虑引入 `react-markdown` + `remark-gfm`

## Risks & Decisions
- **网络不稳定**：OpenAI/LangChain/GitHub RSS 源频繁 TLS 断连，可能需要代理或重试机制
- **GPT 代理限制**：10 次/分钟限速已在代码中实现，代理本身可能有额外限制
- **Anthropic RSS**：官方无 RSS，使用社区维护的 GitHub 源，依赖第三方更新
- **DB article_type**：只有 5 个值（缺 analysis/release），LLM 返回的类型需映射到 news
- **重复文章**：多次运行可能产生 slug 不同但 source_url 相同的记录，依赖 `source_url` 唯一约束去重
- **LLM_PROVIDER 默认仍为 deepseek**：运行管线时需显式指定 `LLM_PROVIDER=gpt`

## Verification
- `npm run lint` — 零错误
- `npm run build` — 零错误
- `LLM_PROVIDER=gpt node scripts/sync-articles.mjs --dry-run --limit 2` — 验证管线流程
- `LLM_PROVIDER=gpt node scripts/sync-articles.mjs --limit 1` — 端到端验证（需 API key）

## Modified Files (本次会话)
- `scripts/lib/llm.mjs` — 修改，+gpt provider +callOpenAIResponses +baseUrlEnv 支持
- `scripts/sync-articles.mjs` — 修改，+createRateLimiter(10) +llmThrottle
- `src/app/articles/[slug]/page.tsx` — 修改，contentZh 优先显示
- `.env.local` — 修改，+GPT_API_KEY（未提交）

## Key References
- 产品方案：`/Users/apple/WeChatProjects/tishici/docs/playbook/skillnav-product-plan.md`
- 通用 playbook：`/Users/apple/WeChatProjects/tishici/docs/playbook/content-pipeline-pattern.md`
- LLM 模块：`scripts/lib/llm.mjs`（支持 deepseek/gemini/anthropic/openai/gpt）
- 同步脚本：`scripts/sync-articles.mjs`
- 代理文档：飞书 `https://ycn0fzzbzq3b.feishu.cn/wiki/T1hEweoPZiyMqkkhgwicsEo9nMe`
- DAL 代码：`src/lib/data/skills.ts`、`src/lib/data/articles.ts`
- Supabase 项目：`caapclmylemgbrtgfszd`
- Worker URL：`skillnav.wh759705.workers.dev`
- 自定义域名：`skillnav.dev`
