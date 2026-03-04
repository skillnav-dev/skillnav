# Handoff — Articles Module Upgrade: Categories + Cover Images + Source Filter

## Objective

将 SkillNav 资讯模块从"RSS 翻译聚合器"升级为有视觉层级的资讯站：分类精简（6→3）、封面图提取与展示、来源维度筛选。

## Current State

### Completed
- **DB migration applied** (`20260306_articles_upgrade.sql`):
  - `source` 字段添加 + 29 篇回填（anthropic 9, simonw 9, openai 5, langchain 4, other 2）
  - `article_type` 从 6 值精简为 3（news/tutorial/analysis），review/comparison/weekly 合并到 news
  - `idx_articles_source` 索引创建
- **类型系统更新**: `ArticleType` 3 值 + `ArticleSource` 联合类型 + Supabase types/mapper 同步
- **共享常量文件** `src/lib/article-constants.ts`: 统一标签/颜色，根除"分析"vs"深度"不一致
- **同步管线改造** `scripts/sync-articles.mjs`:
  - `extractCoverImage()`: og:image → twitter:image → content img → RSS enclosure
  - 新增 `cover_image` + `source` 字段写入
  - `VALID_ARTICLE_TYPES` 缩减为 3（sync + llm.mjs 都已更新）
- **DAL 升级**: `getArticlesWithCount` 支持 `source` 过滤 + 新增 `getArticleSources()`
- **前端全面升级**:
  - Toolbar: 分类 3 项 + 来源 filter 行 + 统一 constants 标签
  - Card: 封面图（aspect-[2/1] + hover zoom）+ 来源标签 + 精简日期格式
  - Skeleton: 图片占位区域
  - Grid/Page: source 参数传递完整链路
- **详情页增强**: og:image meta + hero image + ArticleJsonLd image prop
- **Mock 数据适配**: source 字段 + coverImage 示例
- **封面图回填完成**: 18/28 篇成功提取 og:image，0 失败
- **回填脚本**: `scripts/backfill-article-images.mjs`（支持 --dry-run）
- **8 个 commit 已提交**，build 通过，working tree clean

### Unpushed Commits (main ahead of origin by 10)
```
b8644d7 scripts(articles): add backfill script for existing article images
d9af0a2 articles(data): update mock data for new schema
cecc067 articles(seo): add og:image and hero image to detail page
445da93 articles(ui): add source filter, cover images, and unified labels
792f3c0 articles(dal): add source filter and getArticleSources query
f8d4859 articles(sync): extract cover images and record source in pipeline
507b3ca articles(types): update type system and create shared constants
7ec61ed articles(db): add source column and simplify article types to 3
e436d50 wip: checkpoint — Skills 2.0 curated gallery plan
971cf8b wip: checkpoint — content-first strategy and RSS expansion
```

## Next Actions

1. **`git push origin main`** — 推送 10 个本地 commit 到远程，触发 CI/CD 部署
2. **本地验证** `npm run dev` → `/articles` 页面检查：
   - 分类 filter 只有 3 个 + "全部"
   - 来源 filter 正确显示
   - 卡片有封面图（回填后的 18 篇）
   - 标签一致（不再有"分析"vs"深度"问题）
3. **`/articles/[任意slug]`** → 检查 hero image 和 og:image meta tag
4. **Skills 2.0 策展计划** — 见前一个 handoff，Phase 1 数据层重建待启动：
   - `scripts/sync-curated-skills.mjs` adapter 模式
   - 7 个源 repo 适配器
   - ClawHub 数据 `is_hidden=true`

## Risks & Decisions

- **10 篇文章无封面图**: 来源页面无 og:image（OpenAI 部分页面、Simon Willison 部分文章）——card 退化为纯文字样式，不影响功能
- **`<img>` vs `next/image`**: 选择原生 `<img>` 因 Cloudflare Workers + OpenNext 不支持 Next.js 图片优化
- **来源 filter 空值**: 有 2 篇 `source='other'`，来源匹配失败的兜底值

## Verification

- `npm run build` — 通过（1037 pages，TypeScript 0 errors）
- `node scripts/sync-articles.mjs --dry-run --limit 2` — 确认新字段出现在 record 中
- `node scripts/backfill-article-images.mjs --dry-run` — 确认能提取到 og:image
- `git status` — clean working tree

## Modified Files

| File | Change |
|------|--------|
| `supabase/migrations/20260306_articles_upgrade.sql` | **新建** — source + type 精简 |
| `src/data/types.ts` | ArticleType 3 值 + ArticleSource |
| `src/lib/supabase/types.ts` | DB 类型同步 |
| `src/lib/supabase/mappers.ts` | source 映射 |
| `src/lib/article-constants.ts` | **新建** — 统一标签/颜色 |
| `scripts/sync-articles.mjs` | 封面图提取 + source 记录 |
| `scripts/lib/llm.mjs` | articleType 3 值 |
| `src/lib/data/articles.ts` | source 过滤 + getArticleSources |
| `src/lib/data/index.ts` | 导出新函数 |
| `src/lib/articles-search-params.ts` | source URL 参数 |
| `src/components/articles/articles-toolbar.tsx` | 来源 filter + 统一标签 |
| `src/components/articles/article-card.tsx` | 封面图 + 来源 + 统一标签 |
| `src/components/articles/article-meta.tsx` | 统一标签 |
| `src/components/articles/articles-skeleton.tsx` | 图片占位 |
| `src/components/articles/articles-grid.tsx` | source 参数 |
| `src/app/articles/page.tsx` | source 传递 + sources fetch |
| `src/app/articles/[slug]/page.tsx` | og:image + hero image |
| `src/components/shared/json-ld.tsx` | image prop |
| `src/data/mock-articles.ts` | 新 schema 适配 |
| `scripts/backfill-article-images.mjs` | **新建** — 回填脚本 |
