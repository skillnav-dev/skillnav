import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface SkillsPaginationProps {
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

export function SkillsPagination({
  currentPage,
  totalPages,
  buildPageUrl,
}: SkillsPaginationProps) {
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
            <span className="hidden sm:inline">上一页</span>
          </Link>
        </Button>
      ) : (
        <Button variant="outline" size="sm" disabled>
          <ChevronLeft className="size-4" />
          <span className="hidden sm:inline">上一页</span>
        </Button>
      )}

      {/* Desktop: page numbers */}
      <div className="hidden items-center gap-1 sm:flex">
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

      {/* Mobile: compact indicator */}
      <span className="px-3 text-sm text-muted-foreground sm:hidden">
        {currentPage} / {totalPages}
      </span>

      {currentPage < totalPages ? (
        <Button variant="outline" size="sm" asChild>
          <Link href={buildPageUrl(currentPage + 1)}>
            <span className="hidden sm:inline">下一页</span>
            <ChevronRight className="size-4" />
          </Link>
        </Button>
      ) : (
        <Button variant="outline" size="sm" disabled>
          <span className="hidden sm:inline">下一页</span>
          <ChevronRight className="size-4" />
        </Button>
      )}
    </nav>
  );
}
