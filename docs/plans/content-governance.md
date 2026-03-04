# SkillNav 内容治理方案

> 制定日期：2026-03-04
> 状态：待实施

## Context

SkillNav 完成了 MVP 基建（6,447 Skills、29 篇文章），现在需要从"有内容"进化到"好内容"。核心问题是**缺少一套统一的内容治理规则**——什么该收、怎么分类、质量怎么判。

本方案的设计原则：**一套规则、一次执行、一个 migration**。

---

## 一、内容边界定义

在写任何代码之前，先确立 SkillNav 的收录标准。

### Skills 收录范围

| 收录 | 不收录 |
|------|--------|
| Claude Code Skills（SKILL.md 规范） | 纯 CLI 工具（非 Agent 场景） |
| MCP Servers（与 Agent 强相关） | 浏览器插件 |
| Agent 工具链（框架、SDK） | 通用 SaaS 产品 |
| | 加密货币/博彩/成人内容 |
| | 明显的测试/示例/占位 skill |

### 资讯收录范围

| 收录 | 不收录 |
|------|--------|
| Skills 生态动态（规范、平台、工具） | 纯行业新闻（融资、人事变动） |
| Agent/MCP 框架更新 | 通用 AI 模型发布（GPT-X） |
| 实战教程和评测 | 学术论文（除非直接影响 Skills） |
| 安全事件和最佳实践 | 泛 AI 评论文章 |

---

## 二、分类体系重建

### 竞品调研结论

| 站点 | 分类数 | 模式 | 总收录量 |
|------|--------|------|----------|
| Smithery.ai | 11 | 精选大类（最友好） | 5,400+ |
| Skill4Agent | 7 | 极简大类（太粗） | 24,000+ |
| Glama.ai | 66 | 全标签（太多） | 7,825+ |
| PulseMCP | 48 | 产品名标签 | 8,606 |
| awesome-mcp-servers | 42 | 混合（行业+能力） | 数百精选 |

**行业共识分类**（3+ 站点共有）：Developer Tools、AI/Agents、Databases、Search、Cloud/DevOps、Security、Productivity、Communication。

### 新分类方案：10 个场景分类

从"技术视角"转为"用户场景视角"。用 "帮我做 X" 的句式验证每个分类是否成立：

| # | 分类 | 英文标识 | 用户意图 | 预估占比 |
|---|------|---------|---------|---------|
| 1 | 编码开发 | coding | 帮我写/审/测代码 | ~30% |
| 2 | AI 智能体 | ai-agent | 帮我用 LLM 和 Agent | ~12% |
| 3 | 数据处理 | data | 帮我查询和分析数据 | ~7% |
| 4 | 搜索研究 | search | 帮我搜索和获取信息 | ~5% |
| 5 | 运维部署 | devops | 帮我部署和管理服务 | ~8% |
| 6 | 内容创作 | content | 帮我写作、翻译、做设计 | ~8% |
| 7 | 效率工具 | productivity | 帮我管理文件和自动化工作流 | ~10% |
| 8 | 安全监控 | security | 帮我扫描漏洞和监控系统 | ~4% |
| 9 | 平台集成 | integration | 帮我对接 API 和第三方服务 | ~8% |
| 10 | 其他 | other | 未分类 | ~8% |

**关键合并**（从旧 16 分类到新 10 分类）：
- 旧"写作" + "创意" → **内容创作**（用户不区分文字和视觉创作）
- 旧"效率" + "自动化" → **效率工具**（都是提高生产力）
- 旧"搜索" → **搜索研究**
- 旧"集成" → **平台集成**
- 旧"金融"、"教育"、"通讯"、"基础" → 按具体 skill 归入上述分类或**其他**

---

## 三、质量分层

用简洁的决策树替代复杂评分公式：

```
Step 1: 是否命中垃圾关键词？ ──YES──→ 标记 is_hidden
        │
        NO
        ↓
Step 2: 无 content 且无 description？ ──YES──→ 标记 is_hidden
        │
        NO
        ↓
Step 3: content < 100字 且 description < 20字？ ──YES──→ quality_tier = C
        │
        NO
        ↓
Step 4: content ≥ 500字 且 description ≥ 20字 且 tags 非空？ ──YES──→ quality_tier = A
        │
        NO
        ↓
        quality_tier = B
```

**垃圾关键词**（源自赛道调研 48% 淘汰率分析）：

```javascript
const SPAM_PATTERNS = [
  /\b(casino|gambling|betting|poker)\b/i,
  /\b(porn|xxx|nsfw|adult)\b/i,
  /\b(pump|rug.?pull|airdrop|memecoin)\b/i,
  /\b(crack|keygen|warez|pirat)\b/i,
  /^(test|my-first|hello-world|untitled|example|demo)-?\d*$/,  // slug 匹配
];
```

**分层含义**：
- **A 级**：首页推荐候选、精选展示
- **B 级**：正常收录展示
- **C 级**：收录但降权（搜索结果排后）
- **隐藏**：不展示（垃圾或无内容）

---

## 四、资讯源治理

### 现有源改造

在 `sync-articles.mjs` 的 SOURCES 配置中，为非核心源添加 `relevanceFilter`：

```javascript
{
  name: "anthropic",
  label: "Anthropic News",
  feedUrl: "...",
  defaultType: "news",
  relevanceFilter: null,  // 核心源，全部收录
},
{
  name: "openai",
  label: "OpenAI Blog",
  feedUrl: "...",
  defaultType: "news",
  relevanceFilter: ["agent", "tool", "function calling", "mcp", "skill", "assistant", "code interpreter"],
},
{
  name: "langchain",
  label: "LangChain Blog",
  feedUrl: "...",
  defaultType: "tutorial",
  relevanceFilter: ["agent", "tool", "mcp", "skill", "claude"],
},
{
  name: "simonw",
  label: "Simon Willison's Weblog",
  feedUrl: "...",
  defaultType: "news",
  relevanceFilter: ["claude", "mcp", "agent", "skill", "anthropic", "tool use"],
},
```

**过滤逻辑**：`title + contentSnippet` 中包含至少一个关键词才收录。

### 文章分类规范化

DB 约束更新为 6 个类型（加 `analysis`，去 `release`）：

| 类型 | 含义 | 使用场景 |
|------|------|---------|
| `news` | 生态动态 | 官方发布、平台变化、安全事件 |
| `tutorial` | 实战教程 | 从零开始的操作指南 |
| `analysis` | 深度观察 | 趋势分析、数据报告、技术评论 |
| `review` | 工具评测 | 单个 Skill/MCP 深度试用 |
| `comparison` | 对比横评 | 同类工具对比评测 |
| `weekly` | 周刊汇总 | 每周精选内容汇总 |

---

## 五、实现计划

### Step 1: DB Migration

新建 `supabase/migrations/20260305_content_governance.sql`：

```sql
-- Skills: quality tracking
ALTER TABLE skills ADD COLUMN IF NOT EXISTS quality_tier TEXT
  CHECK (quality_tier IN ('A', 'B', 'C'));
ALTER TABLE skills ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT FALSE;
CREATE INDEX idx_skills_quality ON skills(quality_tier);
CREATE INDEX idx_skills_hidden ON skills(is_hidden) WHERE is_hidden = TRUE;

-- Articles: expand article_type to include 'analysis'
ALTER TABLE articles DROP CONSTRAINT IF EXISTS articles_article_type_check;
ALTER TABLE articles ADD CONSTRAINT articles_article_type_check
  CHECK (article_type IN ('news', 'tutorial', 'analysis', 'review', 'comparison', 'weekly'));
```

### Step 2: 分类器重写

修改 `scripts/lib/categorize.mjs`：
- `CATEGORY_KEYWORDS` 重写为 10 个新分类 + 重新分配关键词
- 算法不变（权重评分已验证有效）
- 更新 `ALL_CATEGORIES` 导出

### Step 3: Skill 治理脚本

新建 `scripts/govern-skills.mjs` — 一个脚本完成质量审计 + 重分类 + 应用：

```bash
node scripts/govern-skills.mjs --audit              # 只输出报告
node scripts/govern-skills.mjs --dry-run             # 预览所有变更
node scripts/govern-skills.mjs --apply               # 执行变更
node scripts/govern-skills.mjs --apply --limit 100   # 部分执行
```

流程：
1. 从 DB 拉取所有 skills（复用现有分页模式）
2. 对每个 skill 执行：垃圾检测 → 质量分层 → 重新分类
3. `--audit` 输出统计报告（各层级/分类分布 + 问题 skill 列表）
4. `--apply` 批量更新 `category` + `quality_tier` + `is_hidden`

### Step 4: DAL 层过滤

修改 `src/lib/data/skills.ts`：
- 所有公开查询加 `.or('is_hidden.is.null,is_hidden.eq.false')`
- `getFeaturedSkills` 额外加 `.eq('quality_tier', 'A')`

### Step 5: 资讯源治理

修改 `scripts/sync-articles.mjs`：
- SOURCES 配置添加 `relevanceFilter` 字段
- 在去重后、翻译前加入关键词过滤
- `validDbTypes` 添加 `analysis`

修改 `src/data/types.ts`：
- `ArticleType` 添加 `'analysis'`

### Step 6: 前端适配

- `src/components/skills/skill-card.tsx` — 分类 badge 适配新名称
- Skills 列表页无需改（分类从 DB 动态读取）
- Articles 列表页无需改（article_type 从 DB 动态读取）

---

## 六、执行顺序与验证

```
Step 1: DB Migration
  ↓ 验证: 确认字段和约束正确
Step 2: 重写 categorize.mjs
  ↓ 验证: 单元级——用几个已知 skill 测试分类结果
Step 3: 运行 govern-skills.mjs --audit
  ↓ 验证: review 报告，确认分层/分类分布合理
  ↓ 运行 govern-skills.mjs --apply
Step 4: 修改 DAL 层
  ↓ 验证: npm run build
Step 5: 修改 sync-articles.mjs + types
  ↓ 验证: npm run sync:articles -- --dry-run
Step 6: 前端适配
  ↓ 验证: npm run dev → 手动检查 /skills 页面
  ↓ npm run build → 确认构建通过
```

每个 Step 完成后单独 commit。

---

## 涉及文件清单

| 操作 | 文件 |
|------|------|
| 新建 | `supabase/migrations/20260305_content_governance.sql` |
| 新建 | `scripts/govern-skills.mjs` |
| 重写 | `scripts/lib/categorize.mjs` |
| 修改 | `scripts/sync-articles.mjs` |
| 修改 | `src/lib/data/skills.ts` |
| 修改 | `src/data/types.ts` |
| 修改 | `src/components/skills/skill-card.tsx`（如需） |
