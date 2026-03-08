import type { Metadata } from "next";
import { SectionHeader } from "@/components/shared/section-header";
import { BreadcrumbJsonLd } from "@/components/shared/json-ld";
import { MCPGrid } from "@/components/mcp/mcp-grid";

export const metadata: Metadata = {
  title: "MCP Server 精选导航",
  description:
    "精选高质量 MCP (Model Context Protocol) Server，让 AI 连接文件系统、数据库、搜索引擎等外部工具。",
};

export default function MCPPage() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "首页", href: "/" },
          { name: "MCP", href: "/mcp" },
        ]}
      />
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <SectionHeader
          as="h1"
          title="MCP Server 精选导航"
          description="精选高质量 Model Context Protocol Server，让 AI Agent 连接外部工具和数据源"
        />
        <MCPGrid />
      </div>
    </>
  );
}
