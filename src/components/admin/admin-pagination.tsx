import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface AdminPaginationProps {
  currentPage: number;
  totalPages: number;
  buildPageUrl: (page: number) => string;
}

function getPageNumbers(
  current: number,
  total: number,
): (number | "ellipsis")[] {
  const pages: (number | "ellipsis")[] = [1];
  const start = Math.max(2, current - 2);
  const end = Math.min(total - 1, current + 2);

  if (start > 2) pages.push("ellipsis");
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < total - 1) pages.push("ellipsis");
  if (total > 1) pages.push(total);

  return pages;
}

export function AdminPagination({
  currentPage,
  totalPages,
  buildPageUrl,
}: AdminPaginationProps) {
  if (totalPages <= 1) return null;

  const pages = getPageNumbers(currentPage, totalPages);

  return (
    <nav
      aria-label="分页导航"
      className="flex items-center justify-center gap-1"
    >
      {currentPage > 1 ? (
        <Button variant="outline" size="sm" asChild>
          <Link href={buildPageUrl(currentPage - 1)}>
            <ChevronLeft className="size-4" />
            上一页
          </Link>
        </Button>
      ) : (
        <Button variant="outline" size="sm" disabled>
          <ChevronLeft className="size-4" />
          上一页
        </Button>
      )}

      <div className="flex items-center gap-1">
        {pages.map((p, i) =>
          p === "ellipsis" ? (
            <span key={`e-${i}`} className="px-2 text-sm text-muted-foreground">
              ...
            </span>
          ) : p === currentPage ? (
            <Button key={p} variant="default" size="sm" className="min-w-9">
              {p}
            </Button>
          ) : (
            <Button
              key={p}
              variant="ghost"
              size="sm"
              className="min-w-9"
              asChild
            >
              <Link href={buildPageUrl(p)}>{p}</Link>
            </Button>
          ),
        )}
      </div>

      {currentPage < totalPages ? (
        <Button variant="outline" size="sm" asChild>
          <Link href={buildPageUrl(currentPage + 1)}>
            下一页
            <ChevronRight className="size-4" />
          </Link>
        </Button>
      ) : (
        <Button variant="outline" size="sm" disabled>
          下一页
          <ChevronRight className="size-4" />
        </Button>
      )}
    </nav>
  );
}
