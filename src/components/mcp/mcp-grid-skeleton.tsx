import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function MCPGridSkeleton() {
  return (
    <div className="mt-6 space-y-6">
      <div className="h-5 w-32 animate-pulse rounded bg-muted" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="h-5 w-3/4 animate-pulse rounded bg-muted" />
                  <div className="h-3 w-1/3 animate-pulse rounded bg-muted" />
                </div>
                <div className="h-5 w-12 animate-pulse rounded bg-muted" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="space-y-2">
                  <div className="h-4 w-full animate-pulse rounded bg-muted" />
                  <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
                </div>
                <div className="h-9 w-full animate-pulse rounded-md bg-muted" />
                <div className="flex items-center justify-between">
                  <div className="h-5 w-16 animate-pulse rounded bg-muted" />
                  <div className="h-4 w-12 animate-pulse rounded bg-muted" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
