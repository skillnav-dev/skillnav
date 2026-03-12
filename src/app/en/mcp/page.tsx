import type { Metadata } from "next";
import { Suspense } from "react";
import { SectionHeader } from "@/components/shared/section-header";
import { BreadcrumbJsonLd } from "@/components/shared/json-ld";
import { siteConfig } from "@/lib/constants";
import { mcpParamsCache, MCP_PAGE_SIZE } from "@/lib/mcp-search-params";
import { getMcpServersWithCount, getMcpCategories } from "@/lib/data";
import { MCPToolbar } from "@/components/mcp/mcp-toolbar";
import { MCPGrid } from "@/components/mcp/mcp-grid";
import { MCPGridSkeleton } from "@/components/mcp/mcp-grid-skeleton";

export const metadata: Metadata = {
  title: "MCP Servers Directory",
  description:
    "Curated collection of high-quality MCP (Model Context Protocol) servers. Connect AI agents to filesystems, databases, APIs, and more.",
  alternates: {
    canonical: `${siteConfig.url}/en/mcp`,
    languages: {
      "zh-CN": `${siteConfig.url}/mcp`,
      en: `${siteConfig.url}/en/mcp`,
    },
  },
};

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function EnMCPPage({ searchParams }: PageProps) {
  const { q, category, sort, page } = await mcpParamsCache.parse(searchParams);
  const offset = (page - 1) * MCP_PAGE_SIZE;

  const [categories, { total }] = await Promise.all([
    getMcpCategories(),
    getMcpServersWithCount({
      limit: MCP_PAGE_SIZE,
      offset,
      category,
      search: q,
      sort,
    }),
  ]);

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", href: "/en" },
          { name: "MCP Servers", href: "/en/mcp" },
        ]}
      />
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <SectionHeader
          as="h1"
          title="MCP Servers Directory"
          description="Curated Model Context Protocol servers — connect AI agents to external tools and data sources"
        />
        <MCPToolbar categories={categories} totalCount={total} />
        <Suspense fallback={<MCPGridSkeleton />}>
          <MCPGrid q={q} category={category} sort={sort} page={page} />
        </Suspense>
      </div>
    </>
  );
}
