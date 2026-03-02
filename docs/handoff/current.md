# Handoff — SkillNav 工程化改进 (CLAUDE.md + Hooks)

## Objective
基于 ai-dev-lifecycle 方法论优化 SkillNav 的 AI 辅助开发基础设施：CLAUDE.md 重写 + Hooks 质量闸门。

## Current State

### Completed
- **CLAUDE.md 重写**: 按 WHAT/WHY/HOW 结构重组，新增 Architecture（目录树+调用方向）、Key Rules（8条NEVER/MUST）、Work Mode（4条行为约束）、Git Scope Mapping（9个scope）、Project Glossary（5个术语）、Known Pitfalls（4条实际坑）、Context Management（/compact保留模板）
- **Database Schema 精简**: 30行SQL → 1行摘要+引用（渐进式披露）
- **Hooks 基础设施**: 3个Hook脚本 + settings.json 配置
  - `pre-bash-firewall.sh` — 拦截危险Bash命令（exit 2阻断）
  - `post-edit-format.sh` — 编辑ts/tsx/json/css后自动prettier格式化
  - `pre-compact-preserve.sh` — 自动压缩时注入上下文保留指令
- **方法论分析**: 已完成 ai-dev-lifecycle 22篇文档中10篇核心文档的适用性评估

### In Progress
- 无（本阶段任务全部完成）

## Next Actions

### 优先级 1：M1-W2 开发（用户待决定方向）
1. **线1 数据基础设施**: 配置Supabase → 采集脚本(scripts/sync-clawhub.mjs, scripts/sync-skills-sh.mjs) → AI翻译管道
2. **线2 页面补全**: Skill详情页(app/skills/[slug]/page.tsx) → 分类页(app/category/[category]/page.tsx) → RSS
3. **线3 搜索体验**: Orama客户端搜索组件

### 优先级 2：工程化补充
4. 修复 `src/components/layout/theme-toggle.tsx:13` 的 lint error（useEffect中setMounted）
5. 补充 `docs/` 结构：`docs/architecture/adr/` + `docs/references/approved-deps.md`
6. 推送本地 4 个未推送 commit 到 origin/main

## Risks & Decisions
- **Hooks 生效时机**: 新增的 Hooks 需要新会话才能生效（当前会话不加载）
- **Supabase 凭证**: M1-W2 数据线需要用户创建 Supabase 项目并提供连接信息
- **执行顺序未决**: 用户尚未决定 M1-W2 优先做哪条线
- **方法论采纳决策**: 已确认"立即可用"4项中的2项（CLAUDE.md + Hooks），其余（docs结构、ADR）留给M1-W2

## Verification
- `npm run build` — 零错误（15页面）
- `npm run lint` — 1个已知error（theme-toggle.tsx，已记录在Known Pitfalls）

## Modified Files (本次会话)
- `CLAUDE.md` — 全面重写（新增Architecture/Key Rules/Work Mode/Glossary/Pitfalls/Context Mgmt）
- `.claude/settings.json` — 新建，Hook注册配置
- `.claude/hooks/pre-bash-firewall.sh` — 新建，安全防火墙
- `.claude/hooks/post-edit-format.sh` — 新建，自动格式化
- `.claude/hooks/pre-compact-preserve.sh` — 新建，压缩保留指令

## Key References
- 方法论源: `/Users/apple/WeChatProjects/claudecode开发/ai-dev-lifecycle/docs/design/`
- 产品方案: `/Users/apple/WeChatProjects/tishici/docs/playbook/skillnav-product-plan.md`
