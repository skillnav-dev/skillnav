import type { ReactNode } from "react";
import { CompareChart } from "./compare-chart";
import { FlowDiagram } from "./flow-diagram";
import { ArchitectureDiagram } from "./architecture-diagram";

/**
 * Visual diagrams inserted between content sections.
 * Key = concept slug, value = map of section heading → ReactNode to insert AFTER that section.
 */
export const visualInserts: Record<string, Record<string, ReactNode>> = {
  agent: {
    "## 通俗理解": (
      <CompareChart
        items={[
          {
            title: "聊天 AI",
            description:
              "你问一句，它答一句。只能生成文本，无法执行操作，知识受限于训练数据。",
            tags: [
              { label: "被动响应", type: "con" },
              { label: "只能对话", type: "con" },
            ],
          },
          {
            title: "AI Agent",
            description:
              "你给目标，它自主执行。能调用工具、读写文件、执行代码，遇到问题会自行调整方案。",
            tags: [
              { label: "自主行动", type: "pro" },
              { label: "工具调用", type: "pro" },
              { label: "多步规划", type: "pro" },
            ],
          },
        ]}
      />
    ),
    "## 核心机制": (
      <FlowDiagram
        title="Agent 运行循环"
        steps={[
          { label: "感知环境", color: "purple" },
          { label: "思考推理", color: "teal" },
          { label: "执行行动", color: "amber" },
          { label: "观察结果", color: "coral" },
        ]}
      />
    ),
  },
  mcp: {
    "## 通俗理解": (
      <CompareChart
        items={[
          {
            title: "没有 MCP",
            description:
              "每个 AI 应用为每个工具各写一套适配代码，工具和应用之间 N×M 对接，生态碎片化。",
            tags: [
              { label: "重复开发", type: "con" },
              { label: "碎片化", type: "con" },
            ],
          },
          {
            title: "有 MCP",
            description:
              "工具实现一次 MCP 接口，所有 AI 应用都能调用。N+M 对接，统一生态。",
            tags: [
              { label: "写一次用处处", type: "pro" },
              { label: "自动发现", type: "pro" },
              { label: "统一生态", type: "pro" },
            ],
          },
        ]}
      />
    ),
    "## 技术架构": (
      <ArchitectureDiagram
        title="MCP 协议三要素"
        steps={[
          {
            title: "Tools（工具）",
            description:
              "MCP Server 暴露的可调用函数，如 search_issues、run_query。AI 可主动调用。",
            color: "purple",
          },
          {
            title: "Resources（资源）",
            description:
              "MCP Server 提供的只读数据，如数据库表结构、文件列表。供 AI 读取上下文。",
            color: "teal",
          },
          {
            title: "Prompts（提示模板）",
            description:
              "预定义的交互模板，引导 AI 更好地使用工具，降低出错率。",
            color: "amber",
          },
        ]}
      />
    ),
  },
  rag: {
    "## 通俗理解": (
      <CompareChart
        items={[
          {
            title: "纯大模型",
            description:
              "仅依赖训练数据，知识有截止日期，遇到不确定的信息可能自信地编造答案。",
            tags: [
              { label: "易产生幻觉", type: "con" },
              { label: "知识过时", type: "con" },
            ],
          },
          {
            title: "RAG 增强",
            description:
              "回答前先检索相关资料，基于真实数据生成答案，支持实时更新，可追溯来源。",
            tags: [
              { label: "有据可查", type: "pro" },
              { label: "知识实时", type: "pro" },
              { label: "减少幻觉", type: "pro" },
            ],
          },
        ]}
      />
    ),
    "## 工作原理": (
      <FlowDiagram
        title="RAG 在线流程：查 → 拼 → 答"
        steps={[
          { label: "用户提问", color: "purple" },
          { label: "向量检索", color: "teal" },
          { label: "拼接 Prompt", color: "amber" },
          { label: "模型生成", color: "coral" },
        ]}
      />
    ),
  },
  "tool-use": {
    "## 通俗理解": (
      <CompareChart
        items={[
          {
            title: "纯大模型",
            description:
              "只能生成文本回复，无法执行任何操作。说得再好也只是嘴上功夫。",
            tags: [
              { label: "只能说", type: "con" },
              { label: "无法做", type: "con" },
            ],
          },
          {
            title: "带工具的大模型",
            description: "能搜索网页、读写文件、调用 API，把想法变成行动。",
            tags: [
              { label: "搜索查询", type: "pro" },
              { label: "读写文件", type: "pro" },
              { label: "API 调用", type: "pro" },
            ],
          },
        ]}
      />
    ),
    "## 核心机制": (
      <FlowDiagram
        title="工具调用四步流程"
        steps={[
          { label: "定义工具", color: "purple" },
          { label: "模型决策", color: "teal" },
          { label: "执行调用", color: "amber" },
          { label: "返回结果", color: "coral" },
        ]}
      />
    ),
  },
  "agentic-engineering": {
    "## 通俗理解": (
      <CompareChart
        items={[
          {
            title: "传统软件工程",
            description:
              "确定性系统：输入确定、逻辑确定、输出可预测。像写脚本。",
            tags: [
              { label: "确定性", type: "con" },
              { label: "规则驱动", type: "con" },
            ],
          },
          {
            title: "智能体工程",
            description:
              "概率性系统：输入模糊、自主决策、需要纠错和安全降级。像造自动驾驶。",
            tags: [
              { label: "自主决策", type: "pro" },
              { label: "行为约束", type: "pro" },
              { label: "概率性", type: "pro" },
            ],
          },
        ]}
      />
    ),
  },
  "context-window": {
    "## 通俗理解": (
      <CompareChart
        items={[
          {
            title: "小上下文（4K-8K）",
            description:
              "只能放几页纸的小书桌，复杂任务做不了，经常忘记前面说过的话。",
            tags: [
              { label: "信息丢失", type: "con" },
              { label: "简单任务", type: "con" },
            ],
          },
          {
            title: "大上下文（128K-1M）",
            description:
              "能铺满整本书的大桌子，同时处理多文件、长文档，但注意力也会分散。",
            tags: [
              { label: "长文档", type: "pro" },
              { label: "多文件", type: "pro" },
              { label: "注意力衰减", type: "con" },
            ],
          },
        ]}
      />
    ),
  },
  "prompt-engineering": {
    "## 通俗理解": (
      <CompareChart
        items={[
          {
            title: "模糊指令",
            description:
              "「帮我写代码」——模型不知道语言、框架、场景，只能猜测。",
            tags: [
              { label: "模糊", type: "con" },
              { label: "靠猜", type: "con" },
            ],
          },
          {
            title: "结构化指令",
            description:
              "角色 + 任务 + 格式 + 约束——模型清楚该做什么、怎么做、输出什么。",
            tags: [
              { label: "精准", type: "pro" },
              { label: "可控", type: "pro" },
              { label: "可复用", type: "pro" },
            ],
          },
        ]}
      />
    ),
  },
  guardrails: {
    "## 通俗理解": (
      <FlowDiagram
        title="护栏部署位置"
        steps={[
          { label: "输入检查", color: "purple" },
          { label: "模型推理", color: "teal" },
          { label: "输出验证", color: "amber" },
          { label: "安全放行", color: "coral" },
        ]}
      />
    ),
  },
  "human-in-the-loop": {
    "## 通俗理解": (
      <CompareChart
        items={[
          {
            title: "全自动",
            description:
              "Agent 自行完成所有操作，速度快但风险高，可能犯不可逆错误。",
            tags: [
              { label: "高效", type: "pro" },
              { label: "风险高", type: "con" },
            ],
          },
          {
            title: "人机协同",
            description:
              "关键操作暂停等人确认，兼顾效率和安全。人类把关高风险决策。",
            tags: [
              { label: "安全", type: "pro" },
              { label: "可控", type: "pro" },
              { label: "效率适中", type: "pro" },
            ],
          },
        ]}
      />
    ),
  },
  hallucination: {
    "## 通俗理解": (
      <CompareChart
        items={[
          {
            title: "有幻觉的 AI",
            description:
              "一本正经地编造不存在的论文、虚构的 API、错误的数据，而且听起来很有道理。",
            tags: [
              { label: "虚构事实", type: "con" },
              { label: "自信满满", type: "con" },
            ],
          },
          {
            title: "有 Grounding 的 AI",
            description:
              "每个结论都基于真实数据源，不确定时主动说明，附上来源引用。",
            tags: [
              { label: "有据可查", type: "pro" },
              { label: "来源标注", type: "pro" },
              { label: "坦诚不确定", type: "pro" },
            ],
          },
        ]}
      />
    ),
  },
  llm: {
    "## 核心机制": (
      <FlowDiagram
        title="LLM 训练三阶段"
        steps={[
          { label: "预训练", color: "purple" },
          { label: "指令微调", color: "teal" },
          { label: "RLHF 对齐", color: "amber" },
        ]}
      />
    ),
  },
  grounding: {
    "## 通俗理解": (
      <CompareChart
        items={[
          {
            title: "无 Grounding",
            description: "AI 凭「记忆」回答，可能编造事实，无法验证来源。",
            tags: [
              { label: "无来源", type: "con" },
              { label: "易幻觉", type: "con" },
            ],
          },
          {
            title: "有 Grounding",
            description: "AI 基于真实数据回答，每个结论可追溯到具体来源。",
            tags: [
              { label: "可验证", type: "pro" },
              { label: "有引用", type: "pro" },
              { label: "减少幻觉", type: "pro" },
            ],
          },
        ]}
      />
    ),
  },
};
