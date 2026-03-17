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
];

/** Get a concept by slug */
export function getLearnConcept(slug: string): LearnConcept | undefined {
  return LEARN_CONCEPTS.find((c) => c.slug === slug);
}

/** Get concepts by category */
export function getLearnConceptsByCategory(category: LearnConcept["category"]) {
  return LEARN_CONCEPTS.filter((c) => c.category === category);
}
