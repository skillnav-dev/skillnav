# Handoff — Skill 详情页内容层 + 双栏重设计

## Objective
将 Skill 详情页从"放大版名片"升级为内容丰富的详情页，补全 SKILL.md 完整文档、安装命令、依赖信息，支撑"大众点评"定位和 SEO 长尾页面价值。

## Current State

### Completed
- **DB 迁移已执行**：skills 表新增 7 列（content, content_zh, install_command, requires_env, requires_bins, editor_rating, editor_review_zh）
- **sync-clawhub.mjs 升级**：保存 SKILL.md body + 解析 openclaw metadata（requires.env/bins、install）+ 50K 截断保护
- **详情页双栏重构**：`src/app/skills/[slug]/page.tsx` — Hero 区 + 主内容/侧边栏双栏布局
- **SkillContent 组件**：`src/components/skills/skill-content.tsx` — react-markdown 渲染 + 中英文切换
- **SkillInstall 组件**：`src/components/skills/skill-install.tsx` — 安装命令一键复制 + 依赖展示
- **SkillSidebar 组件**：`src/components/skills/skill-sidebar.tsx` — 右侧 sticky 元数据面板
- **类型系统更新**：`src/data/types.ts`、`src/lib/supabase/types.ts`、`src/lib/supabase/mappers.ts` 全部同步
- **npm 包安装**：react-markdown、remark-gfm、rehype-highlight
- **部分数据同步**：507/6447 条 skills 已回填 content

### In Progress
- **数据回填未完成**：6447 条中只有 507 条有 content，需串行重跑 sync-clawhub.mjs
  - 并行 4 批触发 GitHub API rate limit，~60% fetch failed
  - Supabase upsert 也因网络问题部分失败（`idx_skills_dedup` 约束冲突 + fetch failed）

## Next Actions

### 优先级 1：完成数据回填
1. **串行重跑同步**：`node scripts/sync-clawhub.mjs --offset 0 --limit 2000`，一批跑完再跑下一批
2. 间隔运行避免 rate limit：每批之间等 1-2 分钟
3. 用 `--skip-existing` 跳过已有数据的 slug

### 优先级 2：验证详情页效果
4. `npm run dev` 打开有 content 的 skill 详情页，确认 markdown 渲染正常
5. 检查中英文切换、安装命令复制、侧边栏 sticky 行为
6. 移动端响应式验证

### 优先级 3：内容翻译
7. `scripts/translate-batch.mjs` — 增加 content 字段到 LLM 翻译管线
8. 热门 Top 200 skills 优先翻译 content → content_zh

### 优先级 4：编辑评测层
9. 首批 50 个精选 skill 人工评分（editor_rating A/B/C/D）+ 中文点评（editor_review_zh）
10. 评测内容直接写入 DB，详情页 `editorReviewZh` 条件渲染已就绪

### 优先级 5：生态关联
11. 详情页底部增加"关联文章"区块（交叉链接 articles 表）
12. 程序化 SEO 页面：`/compare/[a]-vs-[b]`、`/alternatives/[skill]`

## Risks & Decisions
- **GitHub API rate limit**：并行同步不可行，必须串行（100ms 间隔）。8432 文件串行约需 40-50 分钟
- **`idx_skills_dedup` 约束**：name+author+source 唯一约束，部分同名 skill 被拒。现有 `ignoreDuplicates: true` 应该能处理，但 batch upsert 失败会跳过整批
- **网络不稳定**：从中国访问 GitHub Raw 和 Supabase 都可能断连，重跑即可
- **content 字段体积**：平均 2-5KB/条，6400 条约 15-30MB，Supabase Free Tier 500MB 够用
- **react-markdown bundle size**：约 40KB gzipped，对 Cloudflare Workers 部署可能需要关注

## Verification
- `npm run lint` — 零错误
- `npm run build` — 零错误，1037 页
- `node scripts/sync-clawhub.mjs --dry-run --limit 3` — 验证 content 解析

## Modified Files (本次会话)
- `docs/migrations/002-skill-content.sql` — 新增，7 列 ALTER TABLE
- `scripts/sync-clawhub.mjs` — 修改，+body 保存 +openclaw metadata 解析 +截断保护
- `src/app/skills/[slug]/page.tsx` — 重构，双栏布局 + 新组件整合
- `src/components/skills/skill-content.tsx` — 新增，markdown 渲染 + 中英切换
- `src/components/skills/skill-install.tsx` — 新增，安装命令 + 一键复制
- `src/components/skills/skill-sidebar.tsx` — 新增，sticky 元数据面板
- `src/data/types.ts` — 修改，+7 个新字段
- `src/lib/supabase/types.ts` — 修改，+7 个 DB 列类型
- `src/lib/supabase/mappers.ts` — 修改，+7 个字段映射
- `package.json` — 修改，+react-markdown +remark-gfm +rehype-highlight

## Key References
- 产品方案：`/Users/apple/WeChatProjects/tishici/docs/playbook/skillnav/product-plan.md`
- 商业化路线图：`/Users/apple/WeChatProjects/tishici/docs/playbook/skillnav/monetization-roadmap.md`
- 竞品调研：`/Users/apple/WeChatProjects/tishici/docs/playbook/skillnav/competitive-research.md`
- 同步脚本：`scripts/sync-clawhub.mjs`
- LLM 模块：`scripts/lib/llm.mjs`
- DAL：`src/lib/data/skills.ts`
- Supabase 项目：`caapclmylemgbrtgfszd`
- Worker URL：`skillnav.wh759705.workers.dev`
- 域名：`skillnav.dev`
