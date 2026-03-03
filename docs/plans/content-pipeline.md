# 内容管线方案 (Content Pipeline)

## 背景

- **SkillNav** (skillnav.dev) — 中文世界的 AI Agent Skills 导航 + 资讯站
- 飞轮模型: 资讯翻译(引流) → 导航站(留存) → Skill 套件(变现)
- Articles 模块基础设施已就绪（搜索/分类/分页），但内容为空
- 需要内容管线自动化采集、翻译、入库

## 架构

```
scripts/
├── lib/
│   ├── llm.mjs              ← 共享 LLM 工具（翻译 + 分类）
│   ├── supabase-admin.mjs   ← 已有
│   ├── logger.mjs           ← 已有
│   └── categorize.mjs       ← 已有
└── sync-articles.mjs        ← 文章管线主脚本
```

## 管线流程

```
node scripts/sync-articles.mjs [--dry-run] [--limit N] [--source <name>]

RSS 源 → 去重(source_url) → 全文提取(Readability) → 单次 LLM 调用(翻译+分类) → Supabase 入库
```

详细步骤:

1. **抓取 RSS Feed** — 使用 `rss-parser` 解析 RSS/Atom，获取文章列表
2. **去重** — 以 `source_url` 为唯一键，查询 Supabase 过滤已入库文章
3. **全文提取** — 用 `fetch` 获取原文 HTML，`Readability` 提取正文，`Turndown` 转 Markdown
4. **LLM 翻译+分类** — 单次 Claude Haiku 调用，返回结构化 JSON
5. **入库** — 生成 slug，批量 upsert 到 Supabase `articles` 表

## RSS 源配置

| 源 | 内容方向 | Feed URL |
|---|--------|---------|
| Anthropic Blog | Claude 生态核心资讯 | `anthropic.com/rss.xml` |
| OpenAI Blog | AI 行业重大动态 | `openai.com/blog/rss.xml` |
| LangChain Blog | Agent 框架/教程 | `blog.langchain.dev/rss/` |
| Simon Willison | AI 工具深度评测 | `simonwillison.net/atom/everything/` |

后续可扩展更多源（Hugging Face Blog、AI Snake Oil 等）。

## LLM 调用设计

- **模型**: Claude Haiku (claude-3-5-haiku)
- **调用频率**: 每篇文章 1 次
- **输入**:
  ```json
  { "title": "...", "summary": "...", "content": "..." }
  ```
- **输出**:
  ```json
  {
    "titleZh": "中文标题",
    "summaryZh": "中文摘要（2-3句话）",
    "contentZh": "中文全文（Markdown 格式）",
    "articleType": "tutorial | news | analysis | release | opinion",
    "readingTime": 5
  }
  ```
- **翻译风格**: 中文技术媒体风格，非逐字翻译，保留专有名词英文
- **成本估算**: ~$0.005/篇, 100 篇 ~$0.50

## 依赖

**新增依赖 (4 个)**:
- `rss-parser` — RSS/Atom 解析
- `@mozilla/readability` — 正文提取
- `jsdom` — DOM 环境（Readability 依赖）
- `turndown` — HTML → Markdown

**已有依赖**:
- `@anthropic-ai/sdk` — LLM 调用
- `@supabase/supabase-js` — 数据库操作
- `dotenv` — 环境变量

## 数据库映射

`articles` 表字段对应:

| 字段 | 类型 | 来源 |
|------|------|------|
| `slug` | text | 从 title 生成 |
| `title` | text | RSS 原文标题 |
| `title_zh` | text | LLM 翻译 |
| `summary` | text | RSS 摘要或 Readability excerpt |
| `summary_zh` | text | LLM 翻译 |
| `content` | text | Readability 提取 + Turndown 转 Markdown |
| `content_zh` | text | LLM 翻译 |
| `source_url` | text | RSS item link（唯一约束，用于去重） |
| `cover_image` | text | RSS enclosure 或文章首图 |
| `reading_time` | int | LLM 估算 |
| `article_type` | text | LLM 分类 |
| `published_at` | timestamptz | RSS pubDate |

## 运行方式

### MVP 阶段: 手动执行

```bash
# 安装依赖
npm install rss-parser @mozilla/readability jsdom turndown

# package.json 中添加
# "sync:articles": "node scripts/sync-articles.mjs"

# 试运行（不写库）
npm run sync:articles -- --dry-run --limit 5

# 正式同步
npm run sync:articles -- --limit 20

# 指定源
npm run sync:articles -- --source anthropic --limit 10
```

### 后续阶段: GitHub Actions 定时任务

```yaml
# .github/workflows/sync-articles.yml
on:
  schedule:
    - cron: '0 8 * * 1'  # 每周一 UTC 8:00
  workflow_dispatch:       # 支持手动触发
```

## 扩展计划

1. **增加更多 RSS 源** — Hugging Face Blog、The Batch、AI Snake Oil 等
2. **GitHub Actions 定时自动同步** — 每日/每周自动执行
3. **翻译质量人工审核工作流** — 入库时标记 `status: draft`，人工审核后改为 `published`
4. **封面图片自动提取** — 从文章 Open Graph 或首图自动抓取
