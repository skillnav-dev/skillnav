import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, User, ExternalLink } from "lucide-react";
import { SectionHeader } from "@/components/shared/section-header";
import { BreadcrumbJsonLd } from "@/components/shared/json-ld";
import { getGuideSeries } from "@/data/series";
import { siteConfig } from "@/lib/constants";

export const metadata: Metadata = {
  title: `专栏 - ${siteConfig.name}`,
  description: "精选深度技术专栏，系统化学习 AI Agent 工程实践。",
  alternates: {
    canonical: `${siteConfig.url}/guides`,
  },
};

const interactiveGuides = [
  {
    href: "/guides/ai-guide.html",
    tag: "10 章 · 交互式演示",
    title: "AI 架构深度指南",
    description:
      "从提示词工程到 Agent 系统，从 RAG 到 MCP，交互式演示掌握 AI 工程全貌",
  },
  {
    href: "/guides/mcp-interactive-guide.html",
    tag: "配置模拟器",
    title: "MCP 实战手册",
    description: "从零搭建 MCP 服务器：选宿主、选服务器、生成配置、调用演示",
  },
  {
    href: "/guides/ai-coding-tools-compare.html",
    tag: "交互对比矩阵",
    title: "AI Coding 工具对比",
    description:
      "Cursor vs Copilot vs Claude Code，按场景打分，找到最适合你的 AI 编程工具",
  },
  {
    href: "/guides/prompt-engineering-workshop.html",
    tag: "交互式 Playground",
    title: "Prompt 工程实战工坊",
    description:
      "动手写 Prompt，对比好坏示例，逐步掌握 Few-shot、CoT 等核心技巧",
  },
  {
    href: "/guides/agent-design-patterns.html",
    tag: "流程动画",
    title: "Agent 设计模式图鉴",
    description:
      "ReAct、Plan-and-Execute、Multi-Agent、Router 四种模式可视化演示",
  },
  {
    href: "/guides/rag-vs-finetuning-decision-tree.html",
    tag: "决策树",
    title: "RAG vs Fine-tuning 选型",
    description: "回答几个问题，帮你判断该用 RAG 还是 Fine-tuning",
  },
  {
    href: "/guides/llm-selection-guide.html",
    tag: "交互筛选器",
    title: "LLM 选型指南",
    description: "按用途、预算、延迟要求筛选，输出模型推荐和性价比对比",
  },
  {
    href: "/guides/token-economics-calculator.html",
    tag: "实时计算器",
    title: "Token 经济学计算器",
    description: "输入文本实时计算 Token 数，对比各模型价格，预估月度成本",
  },
  {
    href: "/guides/ai-safety-guardrails-simulator.html",
    tag: "攻防模拟",
    title: "AI 安全护栏模拟器",
    description: "模拟 Prompt 注入、越权、数据泄露，体验加护栏前后的差异",
  },
  {
    href: "/guides/vector-database-comparison.html",
    tag: "交互式推荐",
    title: "向量数据库选型对比",
    description: "Pinecone、Weaviate、Qdrant、Milvus、pgvector 按场景推荐",
  },
  {
    href: "/guides/embedding-dimensions.html",
    tag: "可视化 · 计算器",
    title: "理解 Embedding 向量维度",
    description: "从直觉到实战：维度可视化、主流模型对比、成本计算器、MRL 降维",
  },
];

export default function GuidesPage() {
  const series = getGuideSeries();

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "首页", href: "/" },
          { name: "专栏", href: "/guides" },
        ]}
      />
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <SectionHeader
          title="专栏"
          description="精选深度技术专栏，系统化学习 AI Agent 工程实践"
          as="h1"
        />

        <div className="mt-8 grid gap-6">
          {series.map((s) => (
            <Link
              key={s.slug}
              href={`/guides/${s.slug}`}
              className="group rounded-xl border bg-card p-6 transition-colors hover:border-primary/50 hover:bg-accent/50"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1 space-y-2">
                  <h2 className="text-xl font-semibold tracking-tight group-hover:text-primary">
                    {s.titleZh}
                  </h2>
                  <p className="text-sm text-muted-foreground">{s.title}</p>
                  {s.descriptionZh && (
                    <p className="text-muted-foreground">{s.descriptionZh}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-4 pt-2 text-sm text-muted-foreground">
                    {s.author && (
                      <span className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        {s.author}
                      </span>
                    )}
                    {s.chapters && (
                      <span className="flex items-center gap-1">
                        <BookOpen className="h-4 w-4" />
                        {s.chapters.reduce(
                          (sum, ch) => sum + ch.range[1] - ch.range[0] + 1,
                          0,
                        )}{" "}
                        篇
                      </span>
                    )}
                    {s.sourceUrl && (
                      <span className="flex items-center gap-1">
                        <ExternalLink className="h-4 w-4" />
                        原文系列
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {series.length === 0 && (
          <div className="mt-12 text-center text-muted-foreground">
            <p>专栏内容筹备中，敬请期待。</p>
          </div>
        )}

        {/* Interactive deep guides */}
        <section className="mt-12">
          <h2 className="mb-4 text-lg font-semibold text-foreground">
            交互式深度指南
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {interactiveGuides.map((g) => (
              <Link
                key={g.href}
                href={g.href}
                className="group block rounded-lg border bg-card p-6 transition-colors hover:border-primary/50 hover:bg-accent/50"
              >
                <div className="text-xs font-medium text-primary/70">
                  {g.tag}
                </div>
                <h3 className="mt-1 text-base font-semibold tracking-tight group-hover:text-primary">
                  {g.title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {g.description}
                </p>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
