# SkillNav 学习中心方案

> 状态：进行中 | 审批：2026-03-17 | Progress: 6/9 (P1 done, P2 in progress)

---

## 一、战略定位

### 为什么做

Cloudflare 用 32 篇 "What is X?" 文章拿下 8,000 个关键词排名，贡献了 80% 的自然流量。
这个模式的本质是：**用免费教育建立权威，用权威驱动产品转化**。

SkillNav 当前的引流引擎是翻译资讯（articles），覆盖的是"已经知道 Agent 的人"。
但大量搜索发生在更上游——"什么是 MCP"、"Agent 是什么意思"、"RAG 和 Agent 的区别"。
这些搜索目前被知乎散文、CSDN 博客、微信公众号吃掉了。**没有一个结构化、持续维护、聚焦 AI Agent 工程领域的中文知识产品。**

### 定位

**SkillNav 学习中心 = AI Agent 工程领域的 Cloudflare Learning Center**

不是翻译，不是百科，不是术语罗列——是**面向中文开发者的 AI Agent 工程概念教学**，每个概念用通俗语言 + 可视化 + 工程实践三层递进。

### 在飞轮中的位置

```
[学习中心] 概念教学（最上游，抓搜索流量）
    ↓ 内链
[资讯] 翻译文章（深度内容，建立粘性）
    ↓ 内链
[工具] Skills / MCP 导航（产品留存）
    ↓
[变现] Skill 套件
```

学习中心是飞轮的新入口层，补的是"认知漏斗最顶部"的流量。

---

## 二、产品定义

### 命名与路径

| 项 | 决策 |
|----|------|
| 产品名 | 学习中心 / Learning Center |
| 索引页 | `/learn` |
| 详情页 | `/learn/what-is-{slug}` |
| 英文版 | `/en/learn/what-is-{slug}`（后期） |

用 `/learn` 而不是 `/glossary`：
- 更有教育产品感，不像工具附录
- 可扩展——未来可加教程、对比、指南
- SEO：`/learn/what-is-mcp` 比 `/glossary/mcp` 更匹配搜索意图

### 覆盖范围

聚焦三个圈层，不做泛 AI 百科：

```
核心圈（必做）：Agent, MCP, Skills, Tool Use, Agentic Engineering
        ——SkillNav 的领地，必须占位

应用圈（重要）：RAG, Guardrails, Hallucination, Context Window,
                Human-in-the-Loop, Grounding, Context Rot
        ——开发者高频接触，搜索量大

基础圈（按需）：LLM, Token, Fine-tuning, Prompt Engineering, SSR/ISR
        ——已有大量竞品内容，低优先级，选择性做
```

P1 目标：核心圈 + 应用圈 = **12-15 个概念页**。

---

## 三、内容模型

### 每个概念页的四层结构

借鉴 Cloudflare "What is X?" 模板，适配中文开发者：

```
┌─────────────────────────────────────────────────┐
│ 第一层：一句话定义                                │
│ "MCP 是 Anthropic 提出的开放协议，让 AI 模型能     │
│  通过统一接口发现和调用外部工具。"                   │
│                                                   │
│ → 解决"10 秒判断要不要继续读"                      │
├─────────────────────────────────────────────────┤
│ 第二层：通俗解释 + 可视化                          │
│ "把 MCP 想象成 AI 世界的 USB-C 接口……"             │
│ [对比图 / 架构图 / 类比图]                         │
│                                                   │
│ → 解决"我不是专家，能不能看懂"                      │
├─────────────────────────────────────────────────┤
│ 第三层：工程实践                                   │
│ 代码示例、配置片段、真实场景                        │
│ "在 Claude Code 中使用 MCP Server："               │
│                                                   │
│ → 解决"看懂了，但怎么用"                           │
├─────────────────────────────────────────────────┤
│ 第四层：延伸导航                                   │
│ 相关概念 → [Agent] [Tool Use] [Skills]            │
│ 推荐阅读 → 站内 articles 自动关联                  │
│ 推荐工具 → 站内 MCP/Skills 自动关联                │
│                                                   │
│ → 解决"接下来看什么"，驱动站内流转                  │
└─────────────────────────────────────────────────┘
```

### 内容基调

- **通俗但不降智**：目标读者是初中级开发者，不是小白也不是教授
- **类比开路，代码收尾**：先用生活类比建立直觉，再给工程实例
- **克制篇幅**：每页 1,500-2,500 字（约 5-8 分钟阅读），不写长文
- **视角中立**：解释概念，不推销产品；产品链接放在延伸导航，不混入正文

### 可视化策略

不搞花哨动画，用最少元素讲清楚：

| 图解类型 | 适用场景 | 实现方式 |
|----------|---------|---------|
| 对比图 | A vs B 的区别 | CSS 双栏组件 |
| 架构图 | 系统组成 | SVG / React 组件 |
| 流程图 | 步骤/循环 | Mermaid → 静态 SVG |
| 类比卡 | 通俗比喻 | 图标 + 文案卡片 |

P1 阶段不做交互动画，静态图解优先。

---

## 四、数据架构

### 数据源

新建 `src/data/learn.ts`（静态数据，与 series.ts 同模式）：

```ts
interface LearnConcept {
  slug: string;              // URL: "mcp", "agent", "rag"
  term: string;              // 英文: "MCP (Model Context Protocol)"
  zh: string;                // 中文: "MCP 协议"
  category: "core" | "applied" | "foundation";
  oneLiner: string;          // 一句话定义
  content: string;           // MDX 正文（通俗解释 + 工程实践）
  visual: "compare" | "architecture" | "flow" | "metaphor";
  relatedTerms: string[];    // 关联概念 slug
  relatedArticleSlugs?: string[];  // 手动关联的文章
  relatedMcpSlugs?: string[];     // 手动关联的 MCP
  seoTitle: string;          // "什么是 MCP？AI 工具调用协议通俗解读"
  seoDescription: string;
}
```

为什么不放数据库：
- P1 只有 12-15 个页面，不需要动态查询
- MDX 内容需要 React 组件（图表），静态更合适
- 与 series.ts 保持一致的数据模式
- 未来量大了再迁移到 CMS

### 与 pipeline 术语表的关系

```
scripts/lib/glossary.json          ← 翻译管线用（term + zh + policy）
src/data/learn.ts                  ← 网站页面用（完整内容）
```

两者共享术语的中文译法，但职责不同。glossary.json 是翻译规则，learn.ts 是教学内容。

---

## 五、SEO 策略

### Topic Cluster 结构

```
Pillar: /learn（索引页，3000+ 字，覆盖"AI Agent 工程"大主题）
  ├─ Cluster: /learn/what-is-agent
  ├─ Cluster: /learn/what-is-mcp
  ├─ Cluster: /learn/what-is-rag
  ├─ Cluster: /learn/what-is-agentic-engineering
  └─ ...
```

每个 Cluster 页链回 Pillar，Pillar 链到每个 Cluster。
Cluster 页之间通过"相关概念"互链。
Cluster 页链到相关 articles 和 MCP/Skills 详情页。

### 关键词映射（P1 的 12 个概念）

| 概念 | 目标关键词 |
|------|-----------|
| Agent | 什么是AI Agent, AI智能体是什么 |
| MCP | 什么是MCP, MCP协议是什么, Model Context Protocol |
| RAG | 什么是RAG, 检索增强生成 |
| Agentic Engineering | 什么是智能体工程, agentic engineering |
| Skills | Claude Skills是什么, AI技能是什么 |
| Tool Use | AI工具调用, function calling vs tool use |
| Guardrails | AI安全护栏, AI guardrails |
| Hallucination | AI幻觉是什么, 大模型幻觉 |
| Context Window | 上下文窗口是什么, context window 限制 |
| Human-in-the-Loop | 人机协同, HITL是什么 |
| Context Rot | 上下文腐化, context rot |
| Grounding | AI事实对齐, grounding是什么 |

### 结构化数据

每个概念页使用 `DefinedTerm` + `FAQPage` JSON-LD：

```json
{
  "@type": "DefinedTerm",
  "name": "MCP",
  "alternateName": "Model Context Protocol",
  "description": "...",
  "inDefinedTermSet": {
    "@type": "DefinedTermSet",
    "name": "SkillNav AI Agent 工程术语"
  }
}
```

---

## 六、页面设计

### 索引页 `/learn`

```
[Hero] AI Agent 工程学习中心
      "用通俗语言理解 AI Agent 工程的核心概念"

[搜索框] 快速查找概念

[核心概念] 3-4 张大卡片（Agent, MCP, Skills, Agentic Engineering）
[应用概念] 3 列网格卡片
[基础概念] 3 列网格卡片（灰色调，表示非重点）
```

### 详情页 `/learn/what-is-{slug}`

```
[面包屑] 首页 > 学习中心 > 什么是 MCP

[H1] 什么是 MCP（Model Context Protocol）？

[一句话定义卡片]
  MCP 是 Anthropic 提出的开放协议，让 AI 模型能通过
  统一接口发现和调用外部工具——AI 世界的 USB-C。

[目录] 本文内容（锚点导航）

[正文]
  ## 通俗理解
  （类比 + 图解）

  ## 技术原理
  （架构图 + 关键概念）

  ## 工程实践
  （代码示例）

[侧边栏 / 底部]
  相关概念：Agent | Tool Use | Skills
  推荐阅读：（自动关联 3-5 篇站内文章）
  相关工具：（自动关联 MCP servers）
```

---

## 七、执行计划

### P1：验证（2 周）

| 步骤 | 产出 | 工作量 |
|------|------|--------|
| 1. 写 3 个样板概念内容 | Agent, MCP, RAG 的完整内容 | 内容为主 |
| 2. 搭建页面骨架 | `/learn` 索引 + `/learn/[slug]` 详情 | 1 天 |
| 3. 实现 2 种图解组件 | 对比图 + 架构图 | 1 天 |
| 4. SEO 基础 | JSON-LD + sitemap + 内链 | 半天 |
| 5. 上线 3 个页面 | 部署验证 | 半天 |

P1 核心验证点：搜索引擎收录速度 + 自然流量表现。

### P2：扩展（4 周）

- [x] P2 选题确认（9 个概念：tool-use, agentic-engineering, context-window, prompt-engineering, guardrails, human-in-the-loop, hallucination, llm, grounding）
- [x] 9 个概念元数据入库（`src/data/learn.ts`）
- [ ] 9 个概念内容页编写（每个需 content TS + visual inserts）
- [ ] 实现文章自动关联（基于 tags/keywords 匹配）
- [ ] 实现 MCP/Skills 自动关联
- [ ] 索引页搜索功能
- [ ] 英文版（`/en/learn/`）

### P3：增长（持续）

- 根据 GSC 数据补充搜索量大但未覆盖的概念
- 概念页之间的对比文章（"RAG vs MCP"、"Agent vs Chatbot"）
- 用户反馈："这个解释有帮助吗？"
- 概念页作为翻译管线的术语权威来源

---

## 八、成功指标

| 指标 | P1 目标（上线 1 个月） | P2 目标（上线 3 个月） |
|------|----------------------|----------------------|
| 概念页数量 | 3 | 15 |
| Google 收录页数 | 3 | 15 |
| 自然搜索点击 | 观察基线 | 500 clicks/月 |
| 概念页 → 文章点击率 | > 10% | > 15% |
| 概念页 → 工具页点击率 | > 5% | > 8% |

---

## 九、风险与约束

| 风险 | 应对 |
|------|------|
| 内容质量不够深，沦为 ChatGPT 科普 | 每篇必须有真实代码示例 + 项目实践视角 |
| 图解制作耗时 | P1 用 CSS 组件 + Mermaid，不做设计稿 |
| 和 articles 定位重叠 | 学习中心 = 概念教学（永green），articles = 时效资讯（有时效） |
| 中文 SEO 竞争（知乎/CSDN） | 结构化 + 持续维护 + 站内互链 = 长期壁垒 |

---

## 参考

- [Cloudflare Learning Center SEO 案例](https://gracker.ai/case-studies/cloudflare) — 32 页 → 8,000 关键词
- [Cloudflare DNS Hub 深度分析](https://scottmathson.com/blog/2020/04/23/cloudflare-dns-content-hub-case-study-pt-1-seo-rankings/)
- [Topic Cluster SEO 策略 2026](https://www.brafton.com/blog/strategy/topic-cluster-content-strategy/)
- [Glossary 页面设计范例](https://www.nikolaibain.com/examples/glossary)
- [Glide - Agentic Engineering Glossary](https://www.glideapps.com/blog/agentic-engineering-glossary)（英文竞品）
- [Jimmy Song - Agentic Design Patterns 术语表](https://jimmysong.io/zh/book/agentic-design-patterns/glossary/)（中文参考）
