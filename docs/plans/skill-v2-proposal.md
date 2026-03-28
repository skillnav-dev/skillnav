# SkillNav Skill v2 方案

Status: active
Date: 2026-03-26
Progress: 5/9 (Wave 1 done, Wave 2 pending)
Research: 5-agent parallel (openclaw/competitor/update/ux/data)

## 问题

Skill MVP 完成了"能用"，但还不够"好用"：

1. **只触及 20% 数据资产** — 300+ 文章、168 Skills、12 概念全部不可搜
2. **无更新机制** — 用户安装后永远停留在旧版本
3. **输出没有品牌归因** — 截图传播时观众不知道来源
4. **未进入 ClawHub** — 13K+ skill 生态、150 万+ 下载的分发渠道没用上
5. **帮助文本缺引导** — 新用户不知道从哪开始

## 竞争格局

ClawHub 上 374 个 news/feeds skills，**全是自动聚合、零编辑判断**。MCP 搜索碎片化（mcp-hub / Glama / Smithery 各自为政），没有一个给出"编辑点评 + install 命令"。中文 AI 开发者 skill 几乎空白。

**我们独占的交叉点：编辑品牌 + 中文原生 + 可执行（install 命令）+ 三合一零配置。**

## 设计原则

1. **Skill 输出是决策辅助，不是阅读体验** — 快速获取信息，继续工作
2. **Output as Distribution** — 每次输出都是一次零成本获客
3. **编辑点评是护城河** — editor_comment_zh 必须是一级展示元素
4. **渐进暴露，不堆命令** — 3 个核心命令 + 按需扩展，不做 15 个子命令的瑞士军刀
5. **零依赖** — 纯 WebFetch，不要求用户装任何东西

## 命令体系

### 核心命令（v2 发布）

| 命令 | 用途 | 使用频率 |
|------|------|---------|
| `/skillnav brief` | 今日 AI 日报 | 每日 1 次 |
| `/skillnav mcp <keyword>` | 搜索 MCP Server | 每周 2-3 次 |
| `/skillnav trending` | 本周热门工具 | 每周 1 次 |
| `/skillnav search <keyword>` | **新** 搜索文章 + Skills + MCP 全量 | 按需 |
| `/skillnav update` | **新** 更新 Skill 到最新版本 | 有新版时 |

### 设计决策

**为什么加 `search` 而不是 `article` + `skill` + `explain` 分开？**

用户不关心数据在哪个表里。"RAG" 可能是一篇文章、一个 MCP Server、一个 Skill，也可能是一个概念。统一搜索入口，API 后端做跨表查询和结果合并，按相关性排序。这比让用户记 6 个子命令简单得多。

**为什么不加 `category`、`compare`、`recommend`？**

- `category`：搜索已覆盖（`/skillnav search database` 等效于按分类浏览）
- `compare`：使用频率极低，不值得占命令位
- `recommend`：trending 已部分覆盖，编辑精选可以通过 search 的排序权重实现

5 个命令是上限。超过 5 个，用户记不住，帮助文本太长，SKILL.md 膨胀。

**无参数行为：保持显示帮助。** 所有主流多命令 CLI（git/npm/docker/gh）无参数都显示帮助，不默认执行。开发者的心智模型如此。

## 更新机制

### 方案：API 响应搭便车 + SKILL.md 版本注释

**原理**：每次 API 调用都返回 `meta.skill_version`，SKILL.md 中硬编码当前版本注释，Format Rules 中加版本对比逻辑。发现新版本时在输出末尾附一行提示。

**实现**：

1. SKILL.md 顶部加版本注释：
```
<!-- skill_version: 2.0.0 -->
```

2. API 所有响应加 meta 字段：
```json
{ "meta": { "skill_version": "2.1.0" }, ...data }
```

3. SKILL.md Format Rules 加：
```
If meta.skill_version is newer than this file's skill_version,
append at the very end: "New version available — /skillnav update"
```

4. `update` 子命令执行：
```
Bash: curl -sL https://raw.githubusercontent.com/skillnav-dev/skillnav-skill/main/SKILL.md -o ~/.claude/skills/skillnav/SKILL.md
```

**版本号管理**：`lib/constants.ts` 中硬编码 `SKILL_LATEST_VERSION`，发布新 SKILL.md 时手动更新。简单即正义。

**安全考量**：
- Sandbox 模式下 Bash 写入 `~/.claude/skills/` 可能被阻止 → update 命令需要用户手动批准（Claude Code 会弹确认）
- 不做自动更新（SessionStart hook），用户主动触发才更新
- curl 从 GitHub raw 拉取，HTTPS 保证传输安全

### 为什么不用其他方案

| 方案 | 为什么不用 |
|------|----------|
| SessionStart hook 自动 curl | 安全风险高，sandbox 阻止，用户不知情 |
| ClawHub 原生更新 | 依赖用户装 clawhub CLI，多一层摩擦 |
| 动态注入 `!`command`` | 需要 Claude Code 2.1+，兼容性不确定 |

## 品牌归因

所有输出末尾统一 footer：

```
— SkillNav · skillnav.dev
```

一行完成三件事：品牌归因（截图传播可溯源）、网站导流、暗示"这不是 Claude 自己搜的"。

不加安装命令（已安装的用户不需要），不加 slogan（太吵）。

## 帮助文本优化

```
SkillNav — AI 开发者工具站 (skillnav.dev)

  /skillnav brief              今日 AI 日报
  /skillnav mcp <keyword>      搜索 MCP Server
  /skillnav trending           本周热门工具
  /skillnav search <keyword>   搜索文章、工具、概念
  /skillnav update             更新到最新版本
```

改动点：
- 去掉 install 命令（已安装用户不需要看）
- 新增 search 和 update 命令

## 统一搜索 API

### GET /api/skill/query?type=search&q=<keyword>&limit=10

后端跨三个表查询，按相关性合并排序：

```json
{
  "type": "search",
  "query": "RAG",
  "results": [
    {
      "result_type": "article",
      "title_zh": "RAG 架构实战指南",
      "summary_zh": "...",
      "source": "anthropic",
      "reading_time": 8,
      "url": "https://skillnav.dev/articles/rag-guide"
    },
    {
      "result_type": "mcp",
      "name": "RAG MCP Server",
      "description_zh": "...",
      "editor_comment_zh": "...",
      "install_command": "npx ...",
      "stars": 500,
      "url": "https://skillnav.dev/mcp/rag"
    },
    {
      "result_type": "concept",
      "term": "RAG",
      "zh": "检索增强生成",
      "one_liner": "让 LLM 先查资料再回答，减少幻觉",
      "url": "https://skillnav.dev/learn/what-is-rag"
    }
  ],
  "meta": { "skill_version": "2.0.0" }
}
```

**搜索策略**：
- articles: PGroonga 搜 title_zh + content_zh，只返回 status=published
- mcp_servers: PGroonga 搜 name + description + tags，只返回 status=published
- skills: PGroonga 搜 name + description + tags，只返回 status=published
- concepts: 精确匹配 + 模糊匹配 LEARN_CONCEPTS 静态数据
- 合并后按 result_type 分组展示（先概念解释、再工具、最后文章）

**Format Rules**：
```
Group by result_type, show in order: concept > mcp > skill > article

concept: **{term}**（{zh}）— {one_liner}
mcp/skill: **{name}** ⭐ {stars} — {description_zh}
           > {editor_comment_zh}
           ```{install_command}```
article: **{title_zh}** ({source}, {reading_time}min)
         {summary_zh}

Footer: "— SkillNav · skillnav.dev"
```

## 分发计划

### P0：ClawHub 上架

提交 PR 到 `github.com/openclaw/clawhub`：
- `skills/skillnav/SKILL.md`
- 分类：`research/news-feeds` + `development/mcp`
- 中英双语 description（ClawHub 用 embedding 语义搜索，中英都要覆盖）

### P1：awesome 列表

提交到：
- `VoltAgent/awesome-openclaw-skills`（42K stars）
- `travisvn/awesome-claude-skills`
- `rohitg00/awesome-claude-code-toolkit`

### P2：内容分发

- 掘金文章："在 Claude Code 中搜索 3900+ MCP Server"
- X @skillnav_dev 公告
- Daily Brief 每天末尾的 CTA（M2 已完成）

## 实施清单

### Wave 1：Skill 本体升级 ✅ (2026-03-28)

| # | 任务 | 文件 | 状态 |
|---|------|------|------|
| 1 | API: 所有响应加 meta.skill_version | `src/app/api/skill/query/route.ts` + `src/lib/constants.ts` | ✅ |
| 2 | API: 新增 type=search 统一搜索 | `src/app/api/skill/query/route.ts` | ✅ |
| 3 | SKILL.md: 加版本注释、update 命令、search 命令、品牌 footer、优化帮助文本 | `skills/skillnav/SKILL.md` | ✅ |
| 4 | 同步 GitHub 仓库 skillnav-skill | push SKILL.md `9cf3820` | ✅ |
| 5 | 线上验证 | search + meta.skill_version 全部通过 | ✅ |

### Wave 2：分发上架（1 session）

| # | 任务 |
|---|------|
| 1 | Fork openclaw/clawhub，提交 PR |
| 2 | 提交 awesome 列表 PR（3 个） |
| 3 | 写掘金文章 |
| 4 | X 公告推文 |

## 成功指标

| 指标 | 1 个月 | 3 个月 |
|------|--------|--------|
| ClawHub 下载量 | 100+ | 1,000+ |
| GitHub stars | 20+ | 100+ |
| 日 API 调用 | 50+ | 500+ |
| 搜索零结果率 | < 25% | < 15% |
| Endpoint 分布 | mcp > brief > search > trending | search 占比上升 |

## 风险

| 风险 | 概率 | 缓解 |
|------|------|------|
| ClawHub PR 被拒 | 低 | 遵循 AgentSkills 标准，通过 VirusTotal |
| 版本对比 LLM 偶尔漏判 | 中 | 无害——最坏情况是不提示更新，不会误操作 |
| search 跨表查询慢 | 低 | 三个查询并行，Supabase 毫秒级 |
| SKILL.md 膨胀超 500 行 | 低 | 5 个命令 + format rules 预计 ~120 行 |
| Sandbox 阻止 update 写入 | 中 | Claude Code 会弹确认框，用户手动批准即可 |

## 不做的事

- **不做用户偏好/个性化** — 安装量 < 50 时过早优化
- **不做上下文推荐**（"你在写 RAG 项目，推荐这些 MCP"）— 需要读 package.json，侵入性太强
- **不做 MCP tools[] 详情展示** — 数据虽有但展示成本高（一个 MCP 几十个 tools），等 search 上线后看用户需求
- **不做多语言切换** — 中文优先，英文是未来
- **不做 weekly 周刊命令** — 频率太低，不值得占命令位
