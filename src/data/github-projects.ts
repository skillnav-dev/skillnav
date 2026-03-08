export interface GitHubProject {
  slug: string;
  name: string;
  nameZh: string;
  repo: string;
  description: string;
  descriptionZh: string;
  category: GitHubCategory;
  tags: string[];
  stars: number;
  language: string;
  license?: string;
  editorPick?: boolean;
  editorComment?: string;
}

export const GITHUB_CATEGORIES = [
  "全部",
  "Agent 框架",
  "AI 编码",
  "AI 应用平台",
  "RAG & 知识库",
  "模型推理",
  "开发者工具",
  "精选资源",
] as const;

export type GitHubCategory = (typeof GITHUB_CATEGORIES)[number];

// Curated AI Agent ecosystem projects
export const githubProjects: GitHubProject[] = [
  // ── Agent 框架 ──────────────────────────────────────────────
  {
    slug: "langchain",
    name: "LangChain",
    nameZh: "LangChain",
    repo: "langchain-ai/langchain",
    description:
      "Build context-aware reasoning applications with LangChain's flexible framework.",
    descriptionZh:
      "构建 LLM 驱动应用的全栈框架，提供 Chain、Agent、Memory 等核心抽象，Python 和 TypeScript 双版本，生态最成熟。",
    category: "Agent 框架",
    tags: ["python", "typescript", "llm", "agent"],
    stars: 127000,
    language: "Python",
    license: "MIT",
    editorPick: true,
    editorComment: "Agent 开发的事实标准，生态无敌，入门首选",
  },
  {
    slug: "autogpt",
    name: "AutoGPT",
    nameZh: "AutoGPT",
    repo: "Significant-Gravitas/AutoGPT",
    description: "An experimental open-source autonomous AI agent framework.",
    descriptionZh:
      "最早爆火的自主 Agent 项目，让 AI 自动规划和执行任务。2026 年已演化为完整的 Agent 平台，支持自定义工作流。",
    category: "Agent 框架",
    tags: ["python", "autonomous", "agent"],
    stars: 177000,
    language: "Python",
    license: "MIT",
    editorComment: "开创了 Autonomous Agent 赛道，Star 数遥遥领先",
  },
  {
    slug: "crewai",
    name: "CrewAI",
    nameZh: "CrewAI",
    repo: "crewAIInc/crewAI",
    description:
      "Framework for orchestrating role-playing autonomous AI agents.",
    descriptionZh:
      "多 Agent 协作框架，通过「角色扮演」方式编排 Agent 团队。API 设计简洁，适合快速构建多 Agent 应用。",
    category: "Agent 框架",
    tags: ["python", "multi-agent", "collaboration"],
    stars: 41000,
    language: "Python",
    license: "MIT",
    editorPick: true,
    editorComment: "多 Agent 协作首选，API 优雅，上手快",
  },
  {
    slug: "autogen",
    name: "AutoGen",
    nameZh: "AutoGen",
    repo: "microsoft/autogen",
    description: "A programming framework for agentic AI by Microsoft.",
    descriptionZh:
      "微软出品的多 Agent 对话框架，Agent 之间可自主对话协作。支持人机协同、代码执行、工具调用。",
    category: "Agent 框架",
    tags: ["python", "multi-agent", "microsoft"],
    stars: 53000,
    language: "Python",
    license: "MIT",
    editorComment: "微软背书，企业级多 Agent 方案",
  },
  {
    slug: "metagpt",
    name: "MetaGPT",
    nameZh: "MetaGPT",
    repo: "geekan/MetaGPT",
    description:
      "The multi-agent framework that assigns different roles to GPTs to form a collaborative software entity.",
    descriptionZh:
      "模拟软件公司的多 Agent 系统，给 AI 分配产品经理、架构师、工程师等角色，协作完成软件开发。",
    category: "Agent 框架",
    tags: ["python", "multi-agent", "software-dev"],
    stars: 62000,
    language: "Python",
    license: "MIT",
    editorComment: "多 Agent 协作的创新范式，模拟真实软件团队",
  },
  {
    slug: "langgraph",
    name: "LangGraph",
    nameZh: "LangGraph",
    repo: "langchain-ai/langgraph",
    description: "Build resilient language agents as graphs.",
    descriptionZh:
      "LangChain 团队的 Agent 编排引擎，用图结构定义 Agent 工作流。支持循环、条件分支、人机交互节点。",
    category: "Agent 框架",
    tags: ["python", "graph", "workflow"],
    stars: 15000,
    language: "Python",
    license: "MIT",
    editorPick: true,
    editorComment: "复杂 Agent 工作流的最佳编排方案",
  },
  {
    slug: "semantic-kernel",
    name: "Semantic Kernel",
    nameZh: "Semantic Kernel",
    repo: "microsoft/semantic-kernel",
    description:
      "Integrate cutting-edge LLM technology quickly and easily into your apps.",
    descriptionZh:
      "微软官方 AI SDK，支持 C#/Python/Java，深度集成 Azure OpenAI。企业级 AI 应用开发的标准选择。",
    category: "Agent 框架",
    tags: ["csharp", "python", "java", "microsoft"],
    stars: 20000,
    language: "C#",
    license: "MIT",
    editorComment: "微软技术栈用户的首选 AI SDK",
  },
  {
    slug: "dspy",
    name: "DSPy",
    nameZh: "DSPy",
    repo: "stanfordnlp/dspy",
    description:
      "The framework for programming — not prompting — language models.",
    descriptionZh:
      "斯坦福出品的 LLM 编程框架，主张「编程而非提示词」。自动优化 prompt，让 LLM 调用更可靠、可复现。",
    category: "Agent 框架",
    tags: ["python", "prompt-optimization", "stanford"],
    stars: 25000,
    language: "Python",
    license: "MIT",
    editorPick: true,
    editorComment: "颠覆传统 prompt 工程，学术界和工业界都在关注",
  },
  {
    slug: "camel-ai",
    name: "CAMEL",
    nameZh: "CAMEL",
    repo: "camel-ai/camel",
    description:
      "Finding the Scaling Law of Agents. The first and the best multi-agent framework.",
    descriptionZh:
      "多 Agent 通信框架，通过角色扮演让 Agent 自主对话协作。KAUST 团队出品，学术论文驱动。",
    category: "Agent 框架",
    tags: ["python", "multi-agent", "research"],
    stars: 10000,
    language: "Python",
    license: "Apache-2.0",
  },
  {
    slug: "agentgpt",
    name: "AgentGPT",
    nameZh: "AgentGPT",
    repo: "reworkd/AgentGPT",
    description:
      "Assemble, configure, and deploy autonomous AI agents in your browser.",
    descriptionZh:
      "浏览器中运行的 AI Agent，无需代码即可创建和部署自主 Agent。适合非开发者快速体验 Agent 能力。",
    category: "Agent 框架",
    tags: ["typescript", "web", "no-code"],
    stars: 35000,
    language: "TypeScript",
    license: "GPL-3.0",
  },

  // ── AI 编码 ──────────────────────────────────────────────
  {
    slug: "openhands",
    name: "OpenHands",
    nameZh: "OpenHands",
    repo: "All-Hands-AI/OpenHands",
    description: "A platform for software development agents powered by AI.",
    descriptionZh:
      "原名 OpenDevin，开源 AI 编码 Agent。能自主浏览代码库、编写代码、运行测试、提交 PR，最接近 Devin 的开源替代。",
    category: "AI 编码",
    tags: ["python", "coding-agent", "autonomous"],
    stars: 68000,
    language: "Python",
    license: "MIT",
    editorPick: true,
    editorComment: "最强开源编码 Agent，Devin 的有力竞争者",
  },
  {
    slug: "gpt-engineer",
    name: "GPT Engineer",
    nameZh: "GPT Engineer",
    repo: "gpt-engineer-org/gpt-engineer",
    description:
      "Specify what you want it to build, the AI asks for clarification, and then builds it.",
    descriptionZh:
      "对话式 AI 代码生成工具，描述需求后 AI 自动生成完整项目。支持增量修改和代码审查。",
    category: "AI 编码",
    tags: ["python", "code-generation", "cli"],
    stars: 45000,
    language: "Python",
    license: "MIT",
    editorComment: "AI 代码生成的先驱项目",
  },
  {
    slug: "open-interpreter",
    name: "Open Interpreter",
    nameZh: "Open Interpreter",
    repo: "OpenInterpreter/open-interpreter",
    description: "A natural language interface for computers.",
    descriptionZh:
      "让 LLM 在本地执行代码的终端工具，支持 Python、JS、Shell 等多种语言。类似 ChatGPT 的代码解释器，但在本地运行。",
    category: "AI 编码",
    tags: ["python", "cli", "code-execution"],
    stars: 53000,
    language: "Python",
    license: "AGPL-3.0",
    editorPick: true,
    editorComment: "本地版 Code Interpreter，开发者的瑞士军刀",
  },
  {
    slug: "aider",
    name: "Aider",
    nameZh: "Aider",
    repo: "Aider-AI/aider",
    description: "AI pair programming in your terminal.",
    descriptionZh:
      "终端中的 AI 结对编程工具，直接编辑本地文件。支持 git 集成、多文件编辑、多模型切换，Claude Code 的开源替代。",
    category: "AI 编码",
    tags: ["python", "pair-programming", "cli"],
    stars: 30000,
    language: "Python",
    license: "Apache-2.0",
    editorPick: true,
    editorComment: "终端 AI 编码的标杆，功能最全面",
  },
  {
    slug: "continue",
    name: "Continue",
    nameZh: "Continue",
    repo: "continuedev/continue",
    description:
      "The leading open-source AI code assistant for VS Code and JetBrains.",
    descriptionZh:
      "开源 AI 代码助手，支持 VS Code 和 JetBrains IDE。可连接任意 LLM（本地或云端），Copilot 的开源替代。",
    category: "AI 编码",
    tags: ["typescript", "vscode", "jetbrains", "ide"],
    stars: 21000,
    language: "TypeScript",
    license: "Apache-2.0",
    editorComment: "最灵活的开源 Copilot 替代方案",
  },
  {
    slug: "devika",
    name: "Devika",
    nameZh: "Devika",
    repo: "stitionai/devika",
    description: "Agentic AI software engineer.",
    descriptionZh:
      "AI 软件工程师，能理解需求、搜索信息、编写代码。支持多 LLM 后端，Web UI 界面友好。",
    category: "AI 编码",
    tags: ["python", "agent", "software-engineer"],
    stars: 16000,
    language: "Python",
    license: "MIT",
  },
  {
    slug: "sweep",
    name: "Sweep",
    nameZh: "Sweep",
    repo: "sweepai/sweep",
    description:
      "AI-powered junior developer for small features and bug fixes.",
    descriptionZh:
      "GitHub 上的 AI 初级开发者，自动修复 Bug 和实现小功能。通过 Issue 触发，自动提交 PR。",
    category: "AI 编码",
    tags: ["python", "github", "auto-fix"],
    stars: 10000,
    language: "Python",
    license: "AGPL-3.0",
  },
  {
    slug: "chatdev",
    name: "ChatDev",
    nameZh: "ChatDev",
    repo: "OpenBMB/ChatDev",
    description:
      "Create customized software using natural language idea through multi-agent collaboration.",
    descriptionZh:
      "用自然语言描述需求，多个 AI Agent（CEO、CTO、程序员、测试员）协作完成软件开发全流程。",
    category: "AI 编码",
    tags: ["python", "multi-agent", "software-dev"],
    stars: 19000,
    language: "Python",
    license: "Apache-2.0",
    editorComment: "AI 团队协作写代码的有趣实验",
  },

  // ── AI 应用平台 ──────────────────────────────────────────────
  {
    slug: "n8n",
    name: "n8n",
    nameZh: "n8n",
    repo: "n8n-io/n8n",
    description:
      "Fair-code workflow automation platform with native AI capabilities.",
    descriptionZh:
      "开源工作流自动化平台，内置 AI Agent 节点。可视化拖拽编排，支持 400+ 集成，Zapier/Make 的开源替代。",
    category: "AI 应用平台",
    tags: ["typescript", "workflow", "automation"],
    stars: 173000,
    language: "TypeScript",
    license: "Sustainable Use",
    editorPick: true,
    editorComment: "AI 工作流自动化的王者，400+ 集成生态",
  },
  {
    slug: "langflow",
    name: "Langflow",
    nameZh: "Langflow",
    repo: "langflow-ai/langflow",
    description:
      "A visual framework for building multi-agent and RAG applications.",
    descriptionZh:
      "可视化 AI Agent 构建器，拖拽即可组装 LangChain 组件。低代码构建 Agent 和 RAG 应用，支持一键部署。",
    category: "AI 应用平台",
    tags: ["python", "visual", "low-code"],
    stars: 144000,
    language: "Python",
    license: "MIT",
    editorComment: "LangChain 的可视化伴侣，低代码 Agent 构建",
  },
  {
    slug: "dify",
    name: "Dify",
    nameZh: "Dify",
    repo: "langgenius/dify",
    description:
      "Open-source LLM app development platform with agentic workflow.",
    descriptionZh:
      "国产 AI 应用开发平台，提供可视化 Agent 编排、RAG 管线、Prompt 管理。中文社区活跃，企业落地案例多。",
    category: "AI 应用平台",
    tags: ["python", "typescript", "platform", "chinese"],
    stars: 130000,
    language: "TypeScript",
    license: "Apache-2.0",
    editorPick: true,
    editorComment: "国产最强 AI 应用平台，中文生态首选",
  },
  {
    slug: "open-webui",
    name: "Open WebUI",
    nameZh: "Open WebUI",
    repo: "open-webui/open-webui",
    description:
      "User-friendly AI interface supporting Ollama, OpenAI API, and more.",
    descriptionZh:
      "ChatGPT 风格的本地 AI 界面，支持 Ollama 和 OpenAI API。功能丰富：多模型切换、RAG、语音输入、插件系统。",
    category: "AI 应用平台",
    tags: ["svelte", "ui", "ollama"],
    stars: 125000,
    language: "Svelte",
    license: "MIT",
    editorPick: true,
    editorComment: "本地 AI 的最佳 Web 界面，搭配 Ollama 绝配",
  },
  {
    slug: "lobechat",
    name: "LobeChat",
    nameZh: "LobeChat",
    repo: "lobehub/lobe-chat",
    description:
      "Modern-design AI chat framework supporting multi AI providers.",
    descriptionZh:
      "设计精美的 AI 聊天框架，支持多模型、插件系统、知识库。UI/UX 设计一流，支持自部署。",
    category: "AI 应用平台",
    tags: ["typescript", "chat", "multi-model"],
    stars: 72000,
    language: "TypeScript",
    license: "MIT",
    editorComment: "颜值最高的开源 AI 聊天应用",
  },
  {
    slug: "flowise",
    name: "Flowise",
    nameZh: "Flowise",
    repo: "FlowiseAI/Flowise",
    description: "Drag & drop UI to build your customized LLM flow.",
    descriptionZh:
      "拖拽式 LLM 工作流构建工具，基于 LangChain。支持自定义 Chatflow 和 Agentflow，适合快速原型验证。",
    category: "AI 应用平台",
    tags: ["typescript", "low-code", "workflow"],
    stars: 29000,
    language: "TypeScript",
    license: "Apache-2.0",
    editorComment: "最简单的 LLM 应用搭建工具",
  },
  {
    slug: "anything-llm",
    name: "AnythingLLM",
    nameZh: "AnythingLLM",
    repo: "Mintplex-Labs/anything-llm",
    description:
      "The all-in-one Desktop & Docker AI application with built-in RAG and AI agents.",
    descriptionZh:
      "一体化私有知识库应用，支持本地部署。内置 RAG、Agent、多用户管理，适合企业构建私有 AI 助手。",
    category: "AI 应用平台",
    tags: ["javascript", "rag", "desktop"],
    stars: 25000,
    language: "JavaScript",
    license: "MIT",
  },
  {
    slug: "librechat",
    name: "LibreChat",
    nameZh: "LibreChat",
    repo: "danny-avila/LibreChat",
    description: "Enhanced ChatGPT clone with multi-model support.",
    descriptionZh:
      "ChatGPT 增强版克隆，支持同时接入 OpenAI、Anthropic、Google 等多家 API。完善的用户管理和对话历史。",
    category: "AI 应用平台",
    tags: ["typescript", "chat", "multi-model"],
    stars: 18000,
    language: "TypeScript",
    license: "MIT",
  },

  // ── RAG & 知识库 ──────────────────────────────────────────────
  {
    slug: "ragflow",
    name: "RAGFlow",
    nameZh: "RAGFlow",
    repo: "infiniflow/ragflow",
    description: "Open-source RAG engine based on deep document understanding.",
    descriptionZh:
      "企业级 RAG 引擎，基于深度文档理解。支持复杂文档解析（PDF/表格/图片），中文支持优秀，国产项目。",
    category: "RAG & 知识库",
    tags: ["python", "rag", "document", "chinese"],
    stars: 74000,
    language: "Python",
    license: "Apache-2.0",
    editorPick: true,
    editorComment: "中文 RAG 最强方案，文档理解能力出众",
  },
  {
    slug: "llama-index",
    name: "LlamaIndex",
    nameZh: "LlamaIndex",
    repo: "run-llama/llama_index",
    description: "A data framework for your LLM applications.",
    descriptionZh:
      "LLM 数据连接框架，专注于数据索引和检索。提供 140+ 数据连接器，RAG 应用开发的标准选择。",
    category: "RAG & 知识库",
    tags: ["python", "rag", "data-framework"],
    stars: 46000,
    language: "Python",
    license: "MIT",
    editorPick: true,
    editorComment: "RAG 开发的事实标准，数据连接器最丰富",
  },
  {
    slug: "haystack",
    name: "Haystack",
    nameZh: "Haystack",
    repo: "deepset-ai/haystack",
    description:
      "AI orchestration framework to build customizable, production-ready LLM applications.",
    descriptionZh:
      "企业级 AI 编排框架，Pipeline 架构清晰。支持 RAG、语义搜索、问答系统，生产部署成熟。",
    category: "RAG & 知识库",
    tags: ["python", "rag", "search", "enterprise"],
    stars: 23000,
    language: "Python",
    license: "Apache-2.0",
    editorComment: "企业级 RAG 的可靠选择",
  },
  {
    slug: "private-gpt",
    name: "PrivateGPT",
    nameZh: "PrivateGPT",
    repo: "zylon-ai/private-gpt",
    description:
      "Interact with your documents using the power of GPT, 100% privately.",
    descriptionZh:
      "完全本地化的文档问答系统，数据不出本机。支持多种文档格式，适合隐私敏感场景。",
    category: "RAG & 知识库",
    tags: ["python", "privacy", "local"],
    stars: 52000,
    language: "Python",
    license: "Apache-2.0",
    editorComment: "隐私优先的本地 RAG 方案",
  },
  {
    slug: "chroma",
    name: "Chroma",
    nameZh: "Chroma",
    repo: "chroma-core/chroma",
    description: "The AI-native open-source embedding database.",
    descriptionZh:
      "AI 原生的开源向量数据库，API 极简。内嵌在应用中即可使用，Python/JS SDK，RAG 应用最常搭配的向量库。",
    category: "RAG & 知识库",
    tags: ["python", "vector-db", "embedding"],
    stars: 18000,
    language: "Rust",
    license: "Apache-2.0",
    editorPick: true,
    editorComment: "最简单的向量数据库，开箱即用",
  },
  {
    slug: "qdrant",
    name: "Qdrant",
    nameZh: "Qdrant",
    repo: "qdrant/qdrant",
    description:
      "High-performance, massive-scale vector database for the next generation of AI.",
    descriptionZh:
      "高性能向量搜索引擎，Rust 编写。支持过滤、分布式部署、多租户，适合生产级大规模向量检索。",
    category: "RAG & 知识库",
    tags: ["rust", "vector-db", "production"],
    stars: 22000,
    language: "Rust",
    license: "Apache-2.0",
    editorComment: "生产级向量数据库，性能和功能兼优",
  },

  // ── 模型推理 ──────────────────────────────────────────────
  {
    slug: "ollama",
    name: "Ollama",
    nameZh: "Ollama",
    repo: "ollama/ollama",
    description: "Get up and running with large language models locally.",
    descriptionZh:
      "本地运行大模型的最简方案，一行命令即可启动 Llama、Mistral 等模型。类似 Docker 的模型管理体验。",
    category: "模型推理",
    tags: ["go", "local", "llm-runtime"],
    stars: 147000,
    language: "Go",
    license: "MIT",
    editorPick: true,
    editorComment: "本地跑大模型的不二之选，体验丝滑",
  },
  {
    slug: "vllm",
    name: "vLLM",
    nameZh: "vLLM",
    repo: "vllm-project/vllm",
    description:
      "A high-throughput and memory-efficient inference and serving engine for LLMs.",
    descriptionZh:
      "高吞吐量 LLM 推理引擎，PagedAttention 技术大幅提升 GPU 内存利用率。生产级 LLM 部署的首选。",
    category: "模型推理",
    tags: ["python", "inference", "gpu"],
    stars: 71000,
    language: "Python",
    license: "Apache-2.0",
    editorPick: true,
    editorComment: "LLM 推理性能之王，工业界标准",
  },
  {
    slug: "llama-cpp",
    name: "llama.cpp",
    nameZh: "llama.cpp",
    repo: "ggerganov/llama.cpp",
    description: "LLM inference in C/C++.",
    descriptionZh:
      "纯 C/C++ 实现的 LLM 推理引擎，支持 CPU/GPU/Apple Silicon。量化推理的基石项目，几乎所有本地 LLM 工具的底层依赖。",
    category: "模型推理",
    tags: ["cpp", "inference", "quantization"],
    stars: 78000,
    language: "C++",
    license: "MIT",
    editorPick: true,
    editorComment: "本地 LLM 推理的基石，性能优化到极致",
  },
  {
    slug: "jan",
    name: "Jan",
    nameZh: "Jan",
    repo: "janhq/jan",
    description:
      "Jan is an open source alternative to ChatGPT that runs 100% offline.",
    descriptionZh:
      "开源本地 ChatGPT 替代品，桌面应用。支持离线使用、模型管理、多模型切换，界面友好。",
    category: "模型推理",
    tags: ["typescript", "desktop", "offline"],
    stars: 20000,
    language: "TypeScript",
    license: "AGPL-3.0",
    editorComment: "最友好的本地 AI 桌面应用",
  },
  {
    slug: "localai",
    name: "LocalAI",
    nameZh: "LocalAI",
    repo: "mudler/LocalAI",
    description:
      "Free, open source OpenAI alternative. Self-hosted, no GPU required.",
    descriptionZh:
      "OpenAI API 兼容的本地推理服务，无需 GPU 也能运行。支持文本、图片、音频生成，一站式本地 AI 方案。",
    category: "模型推理",
    tags: ["go", "api-compatible", "cpu"],
    stars: 27000,
    language: "Go",
    license: "MIT",
    editorComment: "无 GPU 也能用的 OpenAI API 替代",
  },
  {
    slug: "fastchat",
    name: "FastChat",
    nameZh: "FastChat",
    repo: "lm-sys/FastChat",
    description:
      "An open platform for training, serving, and evaluating large language models.",
    descriptionZh:
      "LLM 训练、部署和评估的开放平台。Chatbot Arena 排行榜的技术基座，支持多模型 API 服务。",
    category: "模型推理",
    tags: ["python", "serving", "evaluation"],
    stars: 36000,
    language: "Python",
    license: "Apache-2.0",
    editorComment: "Chatbot Arena 背后的技术平台",
  },

  // ── 开发者工具 ──────────────────────────────────────────────
  {
    slug: "langfuse",
    name: "Langfuse",
    nameZh: "Langfuse",
    repo: "langfuse/langfuse",
    description:
      "Open source LLM engineering platform — LLM observability, metrics, evals, and prompt management.",
    descriptionZh:
      "开源 LLM 工程平台，提供调用追踪、评估、Prompt 版本管理。类似 LLM 应用的 Datadog，调试必备。",
    category: "开发者工具",
    tags: ["typescript", "observability", "tracing"],
    stars: 10000,
    language: "TypeScript",
    license: "MIT",
    editorPick: true,
    editorComment: "LLM 应用调试和监控的瑞士军刀",
  },
  {
    slug: "promptfoo",
    name: "Promptfoo",
    nameZh: "Promptfoo",
    repo: "promptfoo/promptfoo",
    description:
      "Test your prompts, agents, and RAGs. Red teaming and pentesting for LLMs.",
    descriptionZh:
      "Prompt 和 Agent 的测试框架，支持批量评估、A/B 测试、红队测试。CLI 工具，CI/CD 友好。",
    category: "开发者工具",
    tags: ["typescript", "testing", "evaluation"],
    stars: 8000,
    language: "TypeScript",
    license: "MIT",
    editorPick: true,
    editorComment: "LLM 应用的测试利器，CI/CD 必备",
  },
  {
    slug: "instructor",
    name: "Instructor",
    nameZh: "Instructor",
    repo: "instructor-ai/instructor",
    description: "Structured outputs for LLMs.",
    descriptionZh:
      "让 LLM 返回结构化数据的工具库，基于 Pydantic 验证。支持重试、流式输出，告别手动解析 JSON。",
    category: "开发者工具",
    tags: ["python", "structured-output", "pydantic"],
    stars: 10000,
    language: "Python",
    license: "MIT",
    editorComment: "结构化输出必备，大幅减少解析代码",
  },
  {
    slug: "agentops",
    name: "AgentOps",
    nameZh: "AgentOps",
    repo: "AgentOps-AI/agentops",
    description: "Python SDK for AI agent monitoring, debugging, and replay.",
    descriptionZh:
      "Agent 监控和调试 SDK，一行代码接入。支持调用追踪、成本统计、回放调试、多 Agent 可视化。",
    category: "开发者工具",
    tags: ["python", "monitoring", "debugging"],
    stars: 9000,
    language: "Python",
    license: "MIT",
    editorComment: "Agent 调试的一站式方案",
  },
  {
    slug: "phoenix",
    name: "Phoenix",
    nameZh: "Phoenix (Arize)",
    repo: "Arize-ai/phoenix",
    description:
      "AI observability & evaluation — tracing, evals, and datasets.",
    descriptionZh:
      "AI 可观测性平台，提供 trace 追踪、模型评估、数据集管理。Arize AI 开源项目，企业级 LLM 监控。",
    category: "开发者工具",
    tags: ["python", "observability", "enterprise"],
    stars: 8000,
    language: "Python",
    license: "Elastic-2.0",
  },
  {
    slug: "mem0",
    name: "Mem0",
    nameZh: "Mem0",
    repo: "mem0ai/mem0",
    description: "The Memory layer for your AI apps.",
    descriptionZh:
      "AI 应用的记忆层，为 Agent 和聊天机器人添加持久记忆。支持用户级/会话级记忆，简单 API 接入。",
    category: "开发者工具",
    tags: ["python", "memory", "personalization"],
    stars: 25000,
    language: "Python",
    license: "Apache-2.0",
    editorPick: true,
    editorComment: "给 AI 加记忆的最佳方案",
  },

  // ── 精选资源 ──────────────────────────────────────────────
  {
    slug: "awesome-mcp-servers",
    name: "awesome-mcp-servers",
    nameZh: "Awesome MCP Servers",
    repo: "punkpeye/awesome-mcp-servers",
    description: "A collection of MCP servers.",
    descriptionZh:
      "MCP Server 最全列表，收录数千个 MCP Server 项目。按功能分类（文件/数据库/API/浏览器等），社区维护活跃。",
    category: "精选资源",
    tags: ["mcp", "awesome-list", "ecosystem"],
    stars: 78000,
    language: "Markdown",
    editorPick: true,
    editorComment: "MCP 生态的入口，发现 MCP Server 必看",
  },
  {
    slug: "awesome-chatgpt-prompts",
    name: "awesome-chatgpt-prompts",
    nameZh: "Awesome ChatGPT Prompts",
    repo: "f/awesome-chatgpt-prompts",
    description: "Share, discover, and collect prompts from the community.",
    descriptionZh:
      "GitHub 上最大的 Prompt 模板库，收录各种角色 Prompt（老师、程序员、翻译等）。Prompt Engineering 入门必看。",
    category: "精选资源",
    tags: ["prompt", "awesome-list", "chatgpt"],
    stars: 149000,
    language: "Markdown",
    editorComment: "Prompt 工程的起点",
  },
  {
    slug: "awesome-ai-agents",
    name: "awesome-ai-agents",
    nameZh: "Awesome AI Agents",
    repo: "e2b-dev/awesome-ai-agents",
    description: "A list of AI autonomous agents.",
    descriptionZh:
      "AI Agent 项目和框架的精选列表，E2B 团队维护。按开源/闭源分类，覆盖所有主流 Agent 项目。",
    category: "精选资源",
    tags: ["agents", "awesome-list", "ecosystem"],
    stars: 25000,
    language: "Markdown",
    editorPick: true,
    editorComment: "了解 AI Agent 生态全貌的最佳入口",
  },
  {
    slug: "awesome-llm-apps",
    name: "awesome-llm-apps",
    nameZh: "Awesome LLM Apps",
    repo: "Shubhamsaboo/awesome-llm-apps",
    description:
      "Collection of awesome LLM apps with AI agents and RAG using OpenAI, Anthropic, Gemini and open source models.",
    descriptionZh:
      "LLM 应用案例合集，包含完整源码和部署指南。覆盖 Agent、RAG、SaaS 等场景，快速获取灵感和参考实现。",
    category: "精选资源",
    tags: ["llm", "awesome-list", "examples"],
    stars: 23000,
    language: "Markdown",
    editorComment: "LLM 应用的灵感宝库，带完整代码",
  },
  {
    slug: "prompt-engineering-guide",
    name: "Prompt Engineering Guide",
    nameZh: "Prompt Engineering Guide",
    repo: "dair-ai/Prompt-Engineering-Guide",
    description:
      "Guides, papers, lectures, notebooks and resources for prompt engineering.",
    descriptionZh:
      "Prompt 工程完整指南，涵盖技巧、论文、教程和实战笔记。从入门到高级，系统化学习 Prompt 设计的最佳资源。",
    category: "精选资源",
    tags: ["prompt", "learning", "guide"],
    stars: 71000,
    language: "Markdown",
    license: "MIT",
    editorComment: "Prompt 工程学习的教科书级资源",
  },
  {
    slug: "generative-ai-for-beginners",
    name: "Generative AI for Beginners",
    nameZh: "生成式 AI 入门教程",
    repo: "microsoft/generative-ai-for-beginners",
    description:
      "21 lessons to get started building with Generative AI by Microsoft.",
    descriptionZh:
      "微软出品的 21 课生成式 AI 入门课程，覆盖 Prompt、RAG、Agent 等核心概念。循序渐进，配有代码练习。",
    category: "精选资源",
    tags: ["learning", "microsoft", "course"],
    stars: 107000,
    language: "Jupyter Notebook",
    license: "MIT",
    editorComment: "微软出品的免费 AI 课程，质量极高",
  },
];
