# Handoff — Skill 详情页体验升级

## Objective
提升 Skill 详情页的 Markdown 渲染质量和交互体验，对标竞品 skill4agent.com，通过精准改动打磨已有框架。

## Current State

### Completed
- **Typography 排版**：安装 `@tailwindcss/typography`，6378 条 skill 文档获得正确标题/列表/表格/引用排版
- **代码语法高亮**：启用 `rehype-highlight`，亮色 github / 暗色 github-dark-dimmed 主题
- **代码块复制按钮**：新建 `CodeBlock` 组件，顶部工具栏含语言标签 + 一键复制
- **可见面包屑导航**：shadcn Breadcrumb + `PageBreadcrumb` 封装，skills 和 articles 详情页均已替换
- **标签可点击**：sidebar 标签 Badge 外包 `<Link href="/skills?q=tag">`，支持 hover 样式
- **内容 fallback**：`cleanContent()` 剥离泄漏 frontmatter + 短内容过滤，空/无效内容显示「暂无文档」
- **收录日期**：sidebar 新增 Calendar icon + `createdAt` 展示
- **两次提交均已推送至 main**，CI 部署成功

### Not Started (后续任务)
- T4: `scripts/translate-skill-content.mjs` — content_zh 批量翻译
- T5: `scripts/enrich-skills.mjs` — GPT 丰富化
- T7: `scripts/check-links.mjs` — 死链检测
- 文章详情页代码块也迁移到 ReactMarkdown + CodeBlock（当前用正则 + dangerouslySetInnerHTML）

## Next Actions
1. 考虑将 `src/components/articles/article-content.tsx` 迁移为 ReactMarkdown 渲染（复用 CodeBlock + rehype-highlight）
2. 启动 T4：`scripts/translate-skill-content.mjs` — 批量翻译 skill content 为 content_zh
3. 可选：代码块添加行号显示（`rehype-prism-plus` 或自定义）
4. 可选：长代码块折叠/展开功能

## Risks & Decisions
- **prose 样式覆写**：`globals.css` 中 `.prose pre { margin:0; padding:0; background:transparent }` 将 pre 样式交由 CodeBlock 容器管理
- **React 19 类型变更**：`ReactElement.props` 类型为 `{}`，CodeBlock 中用自定义 `AnyElement` 类型绕过
- **highlight.js CSS import**：`globals.css` 顶部 `@import "highlight.js/styles/github.css"` 全局生效

## Verification
- `npm run build` — 零错误（1037 页生成正常）
- `npm run dev` → 打开含代码块的 Skill 详情页：
  - Markdown 排版正确（标题/列表/表格/引用/链接）
  - 代码块有语法高亮 + 语言标签 + 复制按钮
  - 面包屑可见可点击：「首页 > Skills > Skill名」
  - 标签可点击跳转到 `/skills?q=tagName`
  - 侧边栏有「收录日期」
- 打开空内容 Skill → 显示「暂无文档」
- 打开文章详情页 → 面包屑可见

## Modified Files (本次会话)
### Commit 1: `8838b27` — 详情页体验升级（6 项改动）
- `package.json` / `package-lock.json` — +@tailwindcss/typography
- `src/app/globals.css` — +plugin +highlight.js import +dark mode overrides
- `src/components/skills/skill-content.tsx` — +rehype-highlight +cleanContent
- `src/components/skills/skill-sidebar.tsx` — +可点击标签 +收录日期
- `src/app/skills/[slug]/page.tsx` — 面包屑替换返回链接
- `src/app/articles/[slug]/page.tsx` — 面包屑替换返回链接
- `src/components/shared/page-breadcrumb.tsx` — 新建
- `src/components/ui/breadcrumb.tsx` — shadcn 生成

### Commit 2: `dce66e8` — 代码块复制按钮
- `src/components/shared/code-block.tsx` — 新建（CodeBlock + CopyButton）
- `src/components/skills/skill-content.tsx` — 引入 CodeBlock 自定义 pre 渲染
- `src/app/globals.css` — prose pre 样式覆写 + hljs 背景透明

## Key References
- 代码块组件：`src/components/shared/code-block.tsx`
- 面包屑组件：`src/components/shared/page-breadcrumb.tsx`
- Skill 详情页：`src/app/skills/[slug]/page.tsx`
- 文章详情页：`src/app/articles/[slug]/page.tsx`
- 全局样式：`src/app/globals.css`
