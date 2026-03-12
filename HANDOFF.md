# Handoff — SkillNav
<!-- Updated at 2026-03-12 session 39 -->

## Completed

### 第 1-37 轮摘要（session 1-38, Day 1-12）
- 站点上线 skillnav.dev + 309 Skills + 99 文章 + 5,172 MCP servers
- UI/UX + Admin + 周刊 + SEO + CI 编排 + MCP tools JSONB + 三层目录策略 + 元数据刷新

### 第 38 轮：govern CI + 批量优化 + UI Phase 0-2（session 39, Day 12）
- **govern CI**: `.github/workflows/govern-mcp-servers.yml` 每周一 03:30 UTC 自动分层
- **批量 upsert**: govern 脚本从逐条 update → batch upsert（29min → 1-2min）
- **Phase 0 信任修复**: StatsBar 真实数据（309+/5,100+/99+/每日），日期格式已有
- **Phase 1 体验基线**: MCPCard 全卡可点击、SkillCard 移除评语、MCP Toolbar→Button+ScrollFade、Skeleton 18→6
- **Phase 1 已有项**: 导航高亮、SkillCard/ArticleCard 可点击、容器宽度/Footer 均已一致
- **Phase 2 首页重构**: Hero/StatsBar/模块排序已有，EditorialHighlights 接入真实数据（渐进展示）

## Next

1. **Phase 3: 导航 & IA** — 去"首页"导航项，MCP 降级到 Footer，加"周刊"一级入口
2. **Phase 4: 转化漏斗** — 文章页 Newsletter CTA、分享按钮、Skill↔Article 跨板块关联
3. **Phase 5: 细节打磨** — 代码清理（CopyButton/formatNumber 提取）、Newsletter Resend 接入、移动端优化
4. **Admin 审核**: 124 draft Skills + 36 draft 文章
5. **S-tier 编辑精选**: 从 438 A-tier MCP 挑 50-100 写中文评测

## Key Files
- `.github/workflows/govern-mcp-servers.yml` — govern CI
- `scripts/govern-mcp-servers.mjs` — 批量 upsert 优化
- `src/components/home/editorial-highlights.tsx` — 编辑精选区（数据驱动）
- `src/components/mcp/mcp-toolbar.tsx` — MCP Toolbar 重构
- `docs/specs/ui-ux-redesign-v1.md` — UI/UX 重构完整方案
