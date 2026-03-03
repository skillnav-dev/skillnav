import { ARTICLES_PAGE_SIZE } from "@/lib/articles-search-params";

function CardSkeleton() {
  return (
    <div className="rounded-xl border bg-card p-4">
      {/* Category badge + date/reading time */}
      <div className="flex items-center gap-2">
        <div className="h-5 w-12 animate-pulse rounded-full bg-muted" />
        <div className="h-3 w-20 animate-pulse rounded bg-muted" />
        <div className="h-3 w-16 animate-pulse rounded bg-muted" />
      </div>
      {/* Title */}
      <div className="mt-3 space-y-2">
        <div className="h-5 w-full animate-pulse rounded bg-muted" />
        <div className="h-5 w-3/4 animate-pulse rounded bg-muted" />
      </div>
      {/* Summary */}
      <div className="mt-3 space-y-2">
        <div className="h-3 w-full animate-pulse rounded bg-muted" />
        <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
      </div>
    </div>
  );
}

export function ArticlesSkeleton() {
  return (
    <div className="mt-6">
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: ARTICLES_PAGE_SIZE }, (_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
      <div className="mt-8 flex justify-center gap-1">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="h-8 w-9 animate-pulse rounded-md bg-muted" />
        ))}
      </div>
    </div>
  );
}
