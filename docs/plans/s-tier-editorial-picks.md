# S-tier 编辑精选方案
Status: approved
Progress: N/A
Date: 2026-03-12

## 背景

MCP 目录当前三层: A (455) / B (4,716) / hidden。缺少"编辑精选"层，无法传达策展价值。
目标: 从 A-tier 中精选 50-100 个 MCP Server，标记为 S-tier，配中文评测。

## 数据现状

- Stars >= 1000: 78 条，去重后 ~65 个独立项目
- Stars >= 500: 99 条
- DB 已有字段: `quality_tier`, `editor_comment_zh`, `editor_rating`, `intro_zh`, `is_featured`
- 9 组重复条目（同 github_url 不同 slug）需先去重

## 方案设计

### 1. 评选标准

S-tier = 满足以下任一 + 人工确认:

| 信号 | 阈值 | 说明 |
|------|------|------|
| Stars | >= 1,000 | 社区认可度 |
| 官方出品 | is_verified | Anthropic/GitHub/Cloudflare 等 |
| 品类唯一 | 人工判断 | 某品类最佳选择（如 Figma 只有 figma-context-mcp） |

排除规则:
- 同 github_url 的重复条目只保留一个
- 已归档 (`is_archived = true`)
- 无 description 的空壳项目

预期结果: ~60 个 S-tier

### 2. 实施步骤

#### Step 1: 去重清理 (脚本)
- 9 组重复 github_url，每组保留 stars 最高的一条，其余降为 hidden
- 输出: `scripts/dedup-mcp-servers.mjs --dry-run / --apply`

#### Step 2: 候选名单生成 (脚本)
- 从 published + stars >= 500 中筛选，输出 CSV 候选名单
- 字段: slug, name, stars, tools_count, category, github_url, description
- 输出: `scripts/generate-s-tier-candidates.mjs`

#### Step 3: LLM 批量生成中文评测 (脚本)
- 输入: 候选 slug 列表
- 对每个 server: 读取 description + tools + README (via GitHub API)
- LLM 生成:
  - `intro_zh`: 一句话中文介绍 (30-60 字)
  - `editor_comment_zh`: 编辑评语 (100-200 字，含适用场景、优缺点)
  - `editor_rating`: 1-5 分
- 输出: `scripts/generate-mcp-reviews.mjs --dry-run / --apply`
- 使用已有 `scripts/lib/llm.mjs` (GPT proxy)

#### Step 4: 人工审核 + 发布
- Admin MCP 管理页面（需新建，参照 Skills Admin）
- 或直接在 Step 3 脚本中加 `--review` 交互模式逐条确认

#### Step 5: govern 脚本更新
- `classify()` 函数新增 S-tier 保护: 已标记 S 的不降级
- S-tier 不由自动规则产生，只由人工/脚本标记

#### Step 6: 前端展示
- MCP 列表页: S-tier 卡片显示金色 "编辑精选" badge
- MCP 详情页: S-tier 显示 `editor_comment_zh` 评测区
- 首页 EditorialHighlights: 可展示 S-tier MCP (当前只展示文章)
- 筛选: MCP Toolbar 增加 "编辑精选" 快捷筛选

### 3. DB 变更

无 schema 变更。`quality_tier` 已是 text 类型，直接写入 'S' 值即可。
已有字段复用:
- `quality_tier = 'S'`
- `editor_comment_zh` — 中文评测
- `editor_rating` — 评分 (1-5)
- `intro_zh` — 一句话介绍
- `is_featured = true` — 首页推荐

### 4. 优先级排序

```
Step 1: 去重清理        ~30min  ← 前置必须
Step 2: 候选名单        ~15min  ← 脚本生成
Step 3: LLM 评测生成    ~2h    ← 核心工作量
Step 5: govern 保护     ~15min  ← 防止被覆盖
Step 6: 前端展示        ~2h    ← S-tier badge + 评测区
Step 4: 人工审核        持续    ← 可分批进行
```

### 5. 风险与决策点

| 风险 | 应对 |
|------|------|
| LLM 评测质量参差 | 先跑 5 条样本审核，确认 prompt 质量后再全量 |
| GitHub README 获取受限 | 有 rate limit，用 token 认证 + 增量处理 |
| 60 个太多初期管不过来 | 可先发 30 个 (stars >= 5000)，后续扩展 |
| 去重可能误删 | dry-run 先审，人工确认后 apply |
