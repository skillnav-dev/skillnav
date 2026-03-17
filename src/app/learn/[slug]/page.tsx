import type { Metadata } from "next";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { PageBreadcrumb } from "@/components/shared/page-breadcrumb";
import { ArticleContent } from "@/components/articles/article-content";
import { RelatedConcepts } from "@/components/learn/related-concepts";
import { CompareChart } from "@/components/learn/compare-chart";
import { FlowDiagram } from "@/components/learn/flow-diagram";
import { ArchitectureDiagram } from "@/components/learn/architecture-diagram";
import { Callout } from "@/components/learn/callout";
import {
  BreadcrumbJsonLd,
  DefinedTermJsonLd,
} from "@/components/shared/json-ld";
import { siteConfig } from "@/lib/constants";
import { LEARN_CONCEPTS, getLearnConcept } from "@/data/learn";
import Link from "next/link";

// Static imports — bundled at build time, no fs needed
import agentContent from "@/content/learn/what-is-agent";
import mcpContent from "@/content/learn/what-is-mcp";
import ragContent from "@/content/learn/what-is-rag";

const furtherReading: Record<string, { label: string; href: string }[]> = {
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
    { label: "MCP Server 精选", href: "/mcp" },
    { label: "什么是 AI Agent？", href: "/learn/what-is-agent" },
  ],
};

const contentMap: Record<string, string> = {
  agent: agentContent,
  mcp: mcpContent,
  rag: ragContent,
};

/**
 * Visual diagrams inserted between content sections.
 * Key = concept slug, value = map of section heading → ReactNode to insert AFTER that section.
 */
const visualInserts: Record<string, Record<string, ReactNode>> = {
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
};

/**
 * Split content by h2 headings and interleave visual inserts.
 */
function renderContentWithVisuals(slug: string, content: string): ReactNode[] {
  const inserts = visualInserts[slug];
  if (!inserts) {
    return [<ArticleContent key="content" content={content} />];
  }

  // Split by ## headings, keeping the heading with its section
  const sections = content.split(/(?=^## )/m).filter(Boolean);
  const elements: ReactNode[] = [];

  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];
    elements.push(<ArticleContent key={`section-${i}`} content={section} />);

    // Check if any insert matches this section's heading
    const headingMatch = section.match(/^## .+/);
    if (headingMatch) {
      const heading = headingMatch[0];
      if (inserts[heading]) {
        elements.push(<div key={`visual-${i}`}>{inserts[heading]}</div>);
      }
    }
  }

  return elements;
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

/** Strip "what-is-" prefix to get the concept slug */
function parseSlug(raw: string): string {
  return raw.startsWith("what-is-") ? raw.slice(8) : raw;
}

export function generateStaticParams() {
  return LEARN_CONCEPTS.map((c) => ({ slug: `what-is-${c.slug}` }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const concept = getLearnConcept(parseSlug(slug));
  if (!concept) return {};

  return {
    title: concept.seoTitle,
    description: concept.seoDescription,
    openGraph: {
      title: concept.seoTitle,
      description: concept.seoDescription,
      type: "article",
      url: `${siteConfig.url}/learn/what-is-${concept.slug}`,
    },
  };
}

export default async function LearnConceptPage({ params }: PageProps) {
  const { slug } = await params;
  const conceptSlug = parseSlug(slug);
  const concept = getLearnConcept(conceptSlug);
  if (!concept) notFound();

  const content = contentMap[conceptSlug];
  if (!content) notFound();

  return (
    <>
      <DefinedTermJsonLd
        name={concept.term}
        zh={concept.zh}
        description={concept.oneLiner}
        url={`${siteConfig.url}/learn/what-is-${concept.slug}`}
      />
      <BreadcrumbJsonLd
        items={[
          { name: "首页", href: "/" },
          { name: "学习中心", href: "/learn" },
          {
            name: concept.seoTitle,
            href: `/learn/what-is-${concept.slug}`,
          },
        ]}
      />
      <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <PageBreadcrumb
          items={[
            { label: "首页", href: "/" },
            { label: "学习中心", href: "/learn" },
            { label: concept.seoTitle },
          ]}
        />
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          {concept.seoTitle}
        </h1>

        {/* One-liner definition card */}
        <div className="mt-6 rounded-lg border border-primary/20 bg-primary/5 px-5 py-4">
          <p className="text-base leading-relaxed">{concept.oneLiner}</p>
        </div>

        {/* Main content with visual diagrams */}
        <div className="mt-8">
          {renderContentWithVisuals(conceptSlug, content)}
        </div>

        {/* Related concepts */}
        <RelatedConcepts slugs={concept.relatedSlugs} />

        {/* Further reading */}
        {furtherReading[conceptSlug] && (
          <div className="mt-10 rounded-lg border border-border/60 bg-muted/20 p-5">
            <h2 className="text-lg font-semibold">延伸阅读</h2>
            <ul className="mt-3 space-y-2">
              {furtherReading[conceptSlug].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-primary hover:underline"
                  >
                    {link.label} →
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </article>
    </>
  );
}
