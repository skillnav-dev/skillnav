export function MCPGridSkeleton() {
  return (
    <div className="mt-6 space-y-6">
      <div className="h-5 w-32 animate-pulse rounded bg-muted" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-48 animate-pulse rounded-lg border bg-muted/50"
          />
        ))}
      </div>
    </div>
  );
}
