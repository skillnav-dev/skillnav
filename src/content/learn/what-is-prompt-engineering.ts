export default `## 通俗理解

想象你第一天带一个新团队成员：你说"帮我处理一下用户反馈"，他可能交给你一份完全跑偏的报告。但如果你说"把上周的用户反馈按问题类型归类，每类给 3 条典型案例，输出 Markdown 表格"，他一定能交出你想要的结果。

**提示工程就是把模糊意图变成精确指令的艺术。**

同一个模型，不同的提示方式，结果差距可以是天壤之别：

| 提示方式 | 示例 | 模型行为 |
|---------|------|---------|
| 模糊指令 | "帮我写代码" | 生成通用示例，不知道语言/框架/场景 |
| 角色设定 | "你是一位 TypeScript 专家，帮我…" | 代码风格更专业，类型更严谨 |
| 示例驱动 | "输入 A → 输出 B，现在处理 C" | 严格遵循格式，少猜测 |
| 结构化输出 | "以 JSON 返回，字段为 title/score/reason" | 输出可直接解析，不需要后处理 |

## 核心技巧

**1. 角色设定（Role Prompting）**

给模型一个身份，激活对应领域的知识和风格：

\`\`\`
你是一位有 10 年经验的 Linux 系统工程师，专注于性能优化。
用简洁、精准的语言回答，不要废话，直接给命令。
\`\`\`

**2. Few-Shot 示例**

与其解释规则，不如直接举例——模型会从示例中归纳模式：

\`\`\`
将以下句子改写为正式商务语气：
原句：这个方案不太行
改写：该方案在可行性层面存在一定不足，建议进一步评估

原句：我们搞快点
改写：建议加快推进节奏，以确保项目按时交付

原句：【你的句子】
\`\`\`

**3. 思维链（Chain-of-Thought）**

在提示末尾加"一步步思考"，让模型显式推理，显著降低错误率：

\`\`\`
分析这段代码是否存在内存泄漏风险。
请先识别所有资源分配点，再逐一检查是否有对应释放，最后给出结论。
\`\`\`

**4. 结构化输出**

指定格式让输出可程序化处理：

\`\`\`
分析以下评论的情感，以 JSON 返回：
{ "sentiment": "positive|negative|neutral", "score": 0-1, "reason": "..." }
\`\`\`

## 工程实践

生产系统中，提示工程通常体现在 **System Prompt 模板**上。Claude Code 的 CLAUDE.md 就是一个工程级 System Prompt：

\`\`\`markdown
Development Conventions:
- Code comments in English
- Commit message: Conventional Commits format
- MUST run \`npm run build\` to verify after multi-file changes
- Single file should not exceed 300 lines — split if approaching limit

Key Rules:
- NEVER use \`git add .\` — add files individually
- MUST read a file before modifying it
\`\`\`

这段配置会被注入到每次对话的 System Prompt，相当于给模型提前设定好了工作规范、约束和风格。团队级别的 CLAUDE.md 让所有人和 AI 协作时遵循同一套规则。

## 提示工程 vs 上下文工程

随着 Agent 系统复杂度提升，"提示工程"正在进化为更广的"上下文工程"：

| 维度 | 提示工程 | 上下文工程 |
|------|---------|-----------|
| 关注范围 | 单条 prompt 的措辞和结构 | 整个 context window 的信息编排 |
| 典型工作 | 优化 instruction、加 few-shot | 设计 system prompt + 工具定义 + 记忆检索 |
| 适用阶段 | 单轮对话、简单任务 | 多步骤 Agent、生产系统 |
| 核心问题 | "怎么说让模型理解" | "塞什么进 context 让模型做对" |

简单说：提示工程是上下文工程的子集，后者还要考虑 RAG 检索内容、工具调用结果、对话历史压缩等问题。`;
