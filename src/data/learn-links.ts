/**
 * Further reading links for each learning center concept.
 * Extracted from page.tsx to keep file sizes manageable.
 */
export const furtherReading: Record<string, { label: string; href: string }[]> =
  {
    agent: [
      { label: "AI Agent 相关资讯", href: "/articles?q=agent" },
      { label: "Claude Code Skills 导航", href: "/skills" },
      { label: "MCP Server 精选", href: "/mcp" },
    ],
    mcp: [
      { label: "MCP 相关资讯", href: "/articles?q=mcp" },
      { label: "MCP Server 精选导航", href: "/mcp" },
      { label: "什么是 AI Agent？", href: "/learn/what-is-agent" },
    ],
    rag: [
      { label: "RAG 相关资讯", href: "/articles?q=rag" },
      { label: "什么是 AI Agent？", href: "/learn/what-is-agent" },
    ],
    "tool-use": [
      { label: "什么是 MCP？", href: "/learn/what-is-mcp" },
      { label: "什么是 AI Agent？", href: "/learn/what-is-agent" },
      { label: "Skills 工具导航", href: "/skills" },
    ],
    "agentic-engineering": [
      { label: "什么是 AI Agent？", href: "/learn/what-is-agent" },
      { label: "什么是工具调用？", href: "/learn/what-is-tool-use" },
      { label: "Agentic Engineering 专栏", href: "/guides" },
    ],
    "context-window": [
      { label: "什么是大语言模型？", href: "/learn/what-is-llm" },
      { label: "什么是 RAG？", href: "/learn/what-is-rag" },
      { label: "Context 相关资讯", href: "/articles?q=context" },
    ],
    "prompt-engineering": [
      { label: "什么是 AI Agent？", href: "/learn/what-is-agent" },
      { label: "什么是大语言模型？", href: "/learn/what-is-llm" },
      { label: "Prompt 相关资讯", href: "/articles?q=prompt" },
    ],
    guardrails: [
      { label: "什么是人机协同？", href: "/learn/what-is-human-in-the-loop" },
      { label: "什么是模型幻觉？", href: "/learn/what-is-hallucination" },
      { label: "MCP Server 精选", href: "/mcp" },
    ],
    "human-in-the-loop": [
      { label: "什么是安全护栏？", href: "/learn/what-is-guardrails" },
      {
        label: "什么是智能体工程？",
        href: "/learn/what-is-agentic-engineering",
      },
      { label: "什么是 AI Agent？", href: "/learn/what-is-agent" },
    ],
    hallucination: [
      { label: "什么是事实对齐？", href: "/learn/what-is-grounding" },
      { label: "什么是 RAG？", href: "/learn/what-is-rag" },
      { label: "什么是安全护栏？", href: "/learn/what-is-guardrails" },
    ],
    llm: [
      { label: "什么是 AI Agent？", href: "/learn/what-is-agent" },
      { label: "什么是上下文窗口？", href: "/learn/what-is-context-window" },
      { label: "什么是提示工程？", href: "/learn/what-is-prompt-engineering" },
    ],
    grounding: [
      { label: "什么是模型幻觉？", href: "/learn/what-is-hallucination" },
      { label: "什么是 RAG？", href: "/learn/what-is-rag" },
      { label: "什么是大语言模型？", href: "/learn/what-is-llm" },
    ],
  };
