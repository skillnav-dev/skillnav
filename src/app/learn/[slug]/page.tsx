import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageBreadcrumb } from "@/components/shared/page-breadcrumb";
import { ArticleContent } from "@/components/articles/article-content";
import { RelatedConcepts } from "@/components/learn/related-concepts";
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

        {/* Main content */}
        <div className="mt-8">
          <ArticleContent content={content} />
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
