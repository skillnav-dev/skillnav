import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SectionHeader } from "@/components/shared/section-header";
import { MCPCard } from "@/components/mcp/mcp-card";
import { getFeaturedMcpServers } from "@/lib/data";

export async function FeaturedMcp() {
  const featured = await getFeaturedMcpServers();

  return (
    <section className="py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex items-end justify-between">
          <SectionHeader
            title="精选 MCP"
            description="编辑推荐的高质量 MCP Server"
          />
          <Link
            href="/mcp"
            className="hidden items-center gap-1 text-sm font-medium text-primary transition-colors hover:text-primary/80 sm:flex"
          >
            查看全部
            <ArrowRight className="size-4" />
          </Link>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((server) => (
            <MCPCard key={server.id} server={server} />
          ))}
        </div>
        <div className="mt-6 text-center sm:hidden">
          <Link
            href="/mcp"
            className="inline-flex items-center gap-1 text-sm font-medium text-primary"
          >
            查看全部 MCP
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
