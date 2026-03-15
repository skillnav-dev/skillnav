# 周刊生成管线 (Weekly Newsletter Pipeline)
Status: draft
Progress: 0/5
Date: 2026-03-08

## 概述

SkillNav 周刊是内容 flywheel 的关键环节：**日常 RSS 翻译（自动）→ 周刊精选（半自动）→ 编辑原创（手动）**。

每周一自动从已发布的翻译文章中精选 Top 15，按来源分类组织，LLM 生成编者按，打包为一条 `editorial` 级别的文章入库。

```
sync-articles (daily)  ──→  articles (translated)
                                  │
                          generate-weekly (weekly)
                                  │
                           weekly issue (editorial, draft)
                                  │
                           人工审核 → status=published
```

## 快速上手

```bash
# 1. 预览上周周刊（无 LLM，不写库）
npm run generate:weekly -- --dry-run --no-llm

# 2. 生成上周周刊（含 LLM 编者按，写入 draft）
LLM_PROVIDER=gpt npm run generate:weekly

# 3. 补刊：指定某周
npm run generate:weekly -- --week-of 2026-02-24
```

## 完整 CLI 参考

```
node scripts/generate-weekly.mjs [options]

Options:
  --dry-run              预览生成内容，不写入数据库
  --week-of YYYY-MM-DD   指定周（自动计算该日期所在周的周一~周日）
  --limit N              精选最多 N 篇文章（默认 15）
  --no-llm               跳过 LLM 编者按，使用模板文字
```

### 示例

```bash
# 默认：上周文章，最多 15 篇，含 LLM 编者按
npm run generate:weekly

# 只看预览
npm run generate:weekly -- --dry-run

# 指定日期 + 增加文章数量
npm run generate:weekly -- --week-of 2026-03-03 --limit 20

# 无需 API key 的本地测试
npm run generate:weekly -- --dry-run --no-llm
```

## 工作流

### 自动触发 (GitHub Actions)

- **时间**: 每周一 UTC 04:00（北京时间 12:00）
- **配置**: `.github/workflows/generate-weekly.yml`
- **流程**: 自动查询上周文章 → 生成 draft → Slack 通知失败
- **手动触发**: Actions 页面支持 `workflow_dispatch`，可指定 `week_of`、`limit`、`dry_run`、`no_llm`

### 人工审核

1. 周一中午收到生成通知（或手动检查 Supabase）
2. 在 Supabase Table Editor 中找到 `slug = weekly-N` 的记录
3. 审核 `content_zh` 字段中的 Markdown 内容
4. 修改 `status` 从 `draft` 改为 `published`
5. 周刊自动出现在站点文章列表中

## 周刊 Markdown 格式

```markdown
> 编者按：本期精选了 N 篇文章，涵盖 ... （LLM 生成或模板）

## Anthropic

### [文章标题](/articles/slug)
> 摘要文字（最多 150 字）

### [文章标题](/articles/slug)
> 摘要文字

## OpenAI

### [文章标题](/articles/slug)
> 摘要文字

---
📮 这是 SkillNav 周刊第 N 期，每周一发布。
```

### 格式规则

- **编者按**: 1-2 段中文，100-200 字，由 LLM 生成或使用模板
- **分类**: 按文章来源分组，源名显示为品牌名（如 `Anthropic`、`Simon Willison`）
- **排序**: 来源按固定顺序（Anthropic → OpenAI → LangChain → ...），组内按原文顺序
- **摘要**: 取 `summary_zh`（或 `summary`），截取前 150 字
- **链接**: 内链格式 `/articles/{slug}`

## 入库字段对照表

| 字段 | 值 | 说明 |
|------|-----|------|
| `slug` | `weekly-N` | 如 `weekly-1` |
| `title` | `SkillNav Weekly #N` | 英文标题 |
| `title_zh` | `SkillNav 周刊第 N 期` | 中文标题 |
| `summary_zh` | 编者按首句 | 自动提取 |
| `content` | Markdown 全文 | 与 content_zh 相同 |
| `content_zh` | Markdown 全文 | 中文周刊内容 |
| `article_type` | `guide` | 分类 |
| `content_tier` | `editorial` | 编辑内容层级 |
| `series` | `weekly` | 系列标识 |
| `series_number` | N | 期号（自动递增） |
| `source` | `manual` | 来源标识 |
| `status` | `draft` | 需审核后改为 published |
| `reading_time` | 文章数 × 0.5 | 估算浏览时间 |
| `published_at` | 周一日期 | 发刊日 |

## 环境变量

| 变量 | 必须 | 说明 |
|------|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | 是 | Supabase 项目 URL |
| `SUPABASE_SERVICE_ROLE_KEY` | 是 | Supabase service role key |
| `LLM_PROVIDER` | 否 | LLM 提供商（默认 deepseek） |
| `GPT_API_KEY` | 条件 | 使用 gpt provider 时需要 |

## 依赖复用

脚本复用 `scripts/lib/` 现有模块：

| 模块 | 用途 |
|------|------|
| `supabase-admin.mjs` | 数据库读写 |
| `logger.mjs` | 日志输出 + GitHub Actions Summary |
| `validate-env.mjs` | 环境变量验证 |
| `llm.mjs` | `callLLM` 生成编者按 |

## 故障排查

### 无文章可用

```
⚠ No published articles found for 2026-03-03 ~ 2026-03-09
```

**原因**: 该周没有 `status=published` 的文章。
**解决**: 在 Supabase 中将相关文章 status 改为 `published`，或检查 sync-articles 是否正常运行。

### 期号重复

```
⚠ Weekly #5 (slug: weekly-5) already exists.
```

**原因**: 该期已生成过。
**解决**: 如需重新生成，先在 Supabase 中删除现有记录，再重新运行。

### LLM 调用失败

脚本自动 fallback 到模板编者按，不会阻断生成流程。日志会显示：

```
⚠ LLM failed: ... Falling back to template.
```

### 文章数据不完整

如果文章缺少 `title_zh` 或 `summary_zh`，周刊会自动使用英文字段作为 fallback。

## 演进路线

- [ ] 手动编辑增强：支持在生成后追加编辑批注
- [ ] 封面图自动生成：基于内容生成周刊 OG 图片
- [ ] 邮件分发：集成 Resend + React Email 发送订阅邮件
- [ ] 多语言：同步生成英文版周刊
- [ ] 周刊归档页面：专属 `/weekly` 路由展示历史周刊
