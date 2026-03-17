/**
 * Static metadata for Learning Center concept pages.
 * Content lives in src/content/learn/*.md — this file is metadata only.
 */

export interface LearnConcept {
  slug: string;
  term: string;
  zh: string;
  category: "core" | "applied" | "foundation";
  oneLiner: string;
  relatedSlugs: string[];
  seoTitle: string;
  seoDescription: string;
}

export const LEARN_CONCEPTS: LearnConcept[] = [
  {
    slug: "agent",
    term: "AI Agent",
    zh: "AI 智能体",
    category: "core",
    oneLiner:
      "AI Agent 是能自主感知环境、制定计划并采取行动来完成目标的智能程序——不只是聊天，而是帮你干活。",
    relatedSlugs: ["mcp", "rag"],
    seoTitle: "什么是 AI Agent？智能体概念通俗解读",
    seoDescription:
      "用通俗语言理解 AI Agent（智能体）的核心概念：它和聊天机器人有什么区别？工程上怎么构建？附代码示例。",
  },
  {
    slug: "mcp",
    term: "MCP (Model Context Protocol)",
    zh: "MCP 协议",
    category: "core",
    oneLiner:
      "MCP 是 Anthropic 提出的开放协议，让 AI 模型通过统一接口发现和调用外部工具——AI 世界的 USB-C。",
    relatedSlugs: ["agent", "rag"],
    seoTitle: "什么是 MCP？Model Context Protocol 通俗解读",
    seoDescription:
      "用通俗语言理解 MCP（Model Context Protocol）：为什么需要统一的工具调用协议？它怎么工作？附配置示例。",
  },
  {
    slug: "rag",
    term: "RAG (Retrieval-Augmented Generation)",
    zh: "检索增强生成",
    category: "applied",
    oneLiner:
      "RAG 让大模型在回答前先检索相关资料，用真实数据代替「编造」——给 AI 装上一个实时更新的知识库。",
    relatedSlugs: ["agent", "mcp"],
    seoTitle: "什么是 RAG？检索增强生成通俗解读",
    seoDescription:
      "用通俗语言理解 RAG（检索增强生成）：它怎么减少 AI 幻觉？工程上怎么实现？附架构图和代码示例。",
  },
  // ── P2 concepts ──────────────────────────────────────────────────
  {
    slug: "tool-use",
    term: "Function Calling / Tool Use",
    zh: "工具调用",
    category: "core",
    oneLiner:
      "工具调用让大模型不再只会说话——它可以搜索网页、读写文件、调用 API，把「想法」变成「行动」。",
    relatedSlugs: ["agent", "mcp", "guardrails"],
    seoTitle: "什么是工具调用？Function Calling 通俗解读",
    seoDescription:
      "用通俗语言理解 Function Calling / Tool Use：大模型怎么调用外部工具？与 MCP 是什么关系？附代码示例。",
  },
  {
    slug: "agentic-engineering",
    term: "Agentic Engineering",
    zh: "智能体工程",
    category: "core",
    oneLiner:
      "智能体工程是围绕 AI Agent 的设计、构建和运维的新兴工程学科——不只是写 prompt，而是造系统。",
    relatedSlugs: ["agent", "tool-use", "human-in-the-loop"],
    seoTitle: "什么是智能体工程？Agentic Engineering 通俗解读",
    seoDescription:
      "用通俗语言理解 Agentic Engineering（智能体工程）：它和传统软件工程有什么区别？核心设计模式有哪些？",
  },
  {
    slug: "context-window",
    term: "Context Window",
    zh: "上下文窗口",
    category: "core",
    oneLiner:
      "上下文窗口是大模型一次能「看到」的文本长度上限——它决定了 AI 能处理多复杂的任务。",
    relatedSlugs: ["llm", "rag", "agent"],
    seoTitle: "什么是上下文窗口？Context Window 通俗解读",
    seoDescription:
      "用通俗语言理解 Context Window（上下文窗口）：为什么它这么重要？太短怎么办？各模型对比和工程应对策略。",
  },
  {
    slug: "prompt-engineering",
    term: "Prompt Engineering",
    zh: "提示工程",
    category: "applied",
    oneLiner:
      "提示工程是通过设计输入指令来引导大模型输出高质量结果的技术——写好 prompt 是用好 AI 的第一步。",
    relatedSlugs: ["agent", "llm", "context-window"],
    seoTitle: "什么是提示工程？Prompt Engineering 通俗解读",
    seoDescription:
      "用通俗语言理解 Prompt Engineering（提示工程）：核心技巧有哪些？怎么写出高质量 prompt？附实战模板。",
  },
  {
    slug: "guardrails",
    term: "Guardrails",
    zh: "安全护栏",
    category: "applied",
    oneLiner:
      "安全护栏是部署在 AI Agent 输入输出两端的检查机制——防止模型越权、泄露数据或产生有害内容。",
    relatedSlugs: ["agent", "human-in-the-loop", "hallucination"],
    seoTitle: "什么是安全护栏？AI Guardrails 通俗解读",
    seoDescription:
      "用通俗语言理解 Guardrails（安全护栏）：为什么 Agent 需要护栏？怎么设计？常见实现模式和开源方案。",
  },
  {
    slug: "human-in-the-loop",
    term: "Human-in-the-Loop (HITL)",
    zh: "人机协同",
    category: "applied",
    oneLiner:
      "人机协同让 AI Agent 在关键决策点暂停等待人类确认——兼顾自动化效率和人类判断力。",
    relatedSlugs: ["agent", "guardrails", "agentic-engineering"],
    seoTitle: "什么是人机协同？Human-in-the-Loop 通俗解读",
    seoDescription:
      "用通俗语言理解 Human-in-the-Loop（人机协同）：Agent 什么时候该问人？怎么设计审批流？附架构模式。",
  },
  {
    slug: "hallucination",
    term: "Hallucination",
    zh: "模型幻觉",
    category: "applied",
    oneLiner:
      "模型幻觉是大模型「一本正经地胡说八道」——输出看似合理但实际错误或虚构的内容。",
    relatedSlugs: ["grounding", "rag", "guardrails"],
    seoTitle: "什么是模型幻觉？AI Hallucination 通俗解读",
    seoDescription:
      "用通俗语言理解 Hallucination（模型幻觉）：为什么 AI 会编造事实？怎么检测和缓解？RAG、Grounding 等应对方案。",
  },
  {
    slug: "llm",
    term: "Large Language Model (LLM)",
    zh: "大语言模型",
    category: "foundation",
    oneLiner:
      "大语言模型是通过海量文本训练出的 AI 模型，能理解和生成人类语言——Agent、RAG、MCP 的底层引擎。",
    relatedSlugs: ["agent", "context-window", "prompt-engineering"],
    seoTitle: "什么是大语言模型？LLM 通俗解读",
    seoDescription:
      "用通俗语言理解 LLM（大语言模型）：它怎么工作？和传统 NLP 有什么区别？主流模型对比和选型建议。",
  },
  {
    slug: "grounding",
    term: "Grounding",
    zh: "事实对齐",
    category: "foundation",
    oneLiner:
      "事实对齐是让 AI 输出基于真实数据而非内部「记忆」的技术——幻觉的解药。",
    relatedSlugs: ["hallucination", "rag", "llm"],
    seoTitle: "什么是事实对齐？Grounding 通俗解读",
    seoDescription:
      "用通俗语言理解 Grounding（事实对齐）：它和 RAG 是什么关系？怎么确保 AI 输出基于真实数据？附实现方案。",
  },
];

/** Get a concept by slug */
export function getLearnConcept(slug: string): LearnConcept | undefined {
  return LEARN_CONCEPTS.find((c) => c.slug === slug);
}

/** Get concepts by category */
export function getLearnConceptsByCategory(category: LearnConcept["category"]) {
  return LEARN_CONCEPTS.filter((c) => c.category === category);
}
