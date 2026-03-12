import { MCPCard } from "@/components/mcp/mcp-card";
import { getMcpServersWithCount } from "@/lib/data";
import { MCP_PAGE_SIZE } from "@/lib/mcp-search-params";
import Link from "next/link";

interface MCPGridProps {
  q: string;
  category: string;
  sort: string;
  page: number;
}

export async function MCPGrid({ q, category, sort, page }: MCPGridProps) {
  const offset = (page - 1) * MCP_PAGE_SIZE;
  const { servers, total } = await getMcpServersWithCount({
    limit: MCP_PAGE_SIZE,
    offset,
    category,
    search: q,
    sort,
  });

  const totalPages = Math.ceil(total / MCP_PAGE_SIZE);

  if (servers.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        没有找到匹配的 MCP Server
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
                  page: page - 1 > 1 ? page - 1 : undefined,
                },
              }}
              className="rounded-md border px-3 py-1.5 text-sm hover:bg-muted"
            >
              上一页
            </Link>
          )}
          <span className="px-3 py-1.5 text-sm text-muted-foreground">
            {page} / {totalPages}
          </span>
          {page < totalPages && (
            <Link
              href={{
                query: {
                  q: q || undefined,
                  category: category || undefined,
                  sort: sort || undefined,
                  page: page + 1,
                },
              }}
              className="rounded-md border px-3 py-1.5 text-sm hover:bg-muted"
            >
              下一页
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
