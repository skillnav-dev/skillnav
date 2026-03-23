function CardSkeleton() {
  return (
    <div className="rounded-xl ring-1 ring-gray-950/10 bg-card p-4 dark:ring-gray-50/10">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 space-y-2">
          <div className="h-5 w-3/4 animate-pulse rounded bg-muted" />
          <div className="h-3 w-1/3 animate-pulse rounded bg-muted" />
        </div>
        <div className="h-5 w-12 animate-pulse rounded-full bg-muted" />
      </div>
      <div className="mt-4 space-y-2">
        <div className="h-3 w-full animate-pulse rounded bg-muted" />
        <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
      </div>
      <div className="mt-4 flex items-center justify-between">
        <div className="h-5 w-14 animate-pulse rounded-full bg-muted" />
        <div className="flex gap-3">
          <div className="h-3 w-10 animate-pulse rounded bg-muted" />
          <div className="h-3 w-10 animate-pulse rounded bg-muted" />
        </div>
      </div>
    </div>
  );
}

export function SkillsSkeleton() {
  return (
    <div className="mt-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
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
