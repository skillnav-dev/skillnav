# 依赖白名单

引入新依赖前必须检查此列表。不在列表中的依赖需要评估后添加。

## 核心框架

- next — React 全栈框架（App Router + RSC + ISR）
- react / react-dom — UI 运行时
- typescript — 类型系统

## UI

- radix-ui — 无样式可访问组件（shadcn/ui 底层）
- tailwindcss / @tailwindcss/postcss — 原子 CSS
- @tailwindcss/typography — 文章排版
- tw-animate-css — 动画
- class-variance-authority — 组件变体
- clsx / tailwind-merge — 类名合并
- lucide-react — 图标
- next-themes — 暗色模式
- sonner — Toast 通知
- nuqs — URL 查询参数状态管理

## 数据 & 后端

- @supabase/supabase-js / @supabase/ssr — 数据库 + Auth
- rss-parser — RSS 源解析
- @mozilla/readability / jsdom — 网页正文提取
- turndown — HTML→Markdown
- react-markdown / remark-gfm / rehype-highlight — Markdown 渲染

## AI

- @anthropic-ai/sdk — Anthropic API（脚本层）
- dotenv — 环境变量加载

## 部署

- @opennextjs/cloudflare — Next.js → Cloudflare Workers 适配器
- wrangler — Cloudflare CLI

## 开发工具

- eslint / eslint-config-next — 代码检查
- shadcn — shadcn/ui CLI

## 禁止使用

- moment.js — 用 date-fns 或原生 Intl 替代
- lodash（整包）— 用原生方法
- Ant Design / MUI / Chakra — 用 shadcn/ui
- 原生 CSS 文件 — 用 Tailwind utility classes
