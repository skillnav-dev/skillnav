import { MCPCard } from "@/components/mcp/mcp-card";
import { getMcpServersWithCount } from "@/lib/data";
import { MCP_PAGE_SIZE } from "@/lib/mcp-search-params";
import { SearchX } from "lucide-react";
import Link from "next/link";

interface MCPGridProps {
  q: string;
  category: string;
  sort: string;
  tier: string;
  page: number;
}

export async function MCPGrid({ q, category, sort, tier, page }: MCPGridProps) {
  const offset = (page - 1) * MCP_PAGE_SIZE;
  const { servers, total } = await getMcpServersWithCount({
    limit: MCP_PAGE_SIZE,
    offset,
    category,
    search: q,
    sort,
    tier,
  });

  const totalPages = Math.ceil(total / MCP_PAGE_SIZE);

  if (servers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <SearchX className="mb-4 size-10 text-muted-foreground/50" />
        <h3 className="text-base font-semibold text-foreground">未找到匹配的 MCP Server</h3>
        <p className="mt-2 max-w-[40ch] text-sm text-muted-foreground">
          试试其他关键词或浏览全部 MCP Server
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {servers.map((server) => (
          <MCPCard key={server.slug} server={server} />
        ))}
      </div>
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {page > 1 && (
            <Link
              href={{
                query: {
                  q: q || undefined,
                  category: category || undefined,
                  sort: sort || undefined,
                  tier: tier || undefined,
                  page: page - 1 > 1 ? page - 1 : undefined,
                },
              }}
              className="inline-flex h-9 items-center justify-center rounded-md ring-1 ring-border bg-background px-4 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              上一页
            </Link>
          )}
          <span className="inline-flex h-9 items-center px-3 text-sm text-muted-foreground">
            {page} / {totalPages}
          </span>
          {page < totalPages && (
            <Link
              href={{
                query: {
                  q: q || undefined,
                  category: category || undefined,
                  sort: sort || undefined,
                  tier: tier || undefined,
                  page: page + 1,
                },
              }}
              className="inline-flex h-9 items-center justify-center rounded-md ring-1 ring-border bg-background px-4 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              下一页
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
