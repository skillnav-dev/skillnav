import Link from "next/link";
import { BookOpen } from "lucide-react";
import type { Article } from "@/data/types";
import type { SeriesMeta } from "@/data/series";

interface SeriesNavProps {
  current: Article;
  siblings: Article[];
  meta: SeriesMeta;
}

export function SeriesNav({ current, siblings, meta }: SeriesNavProps) {
  // All articles in order (including current)
  const all = [...siblings, current].sort(
    (a, b) => (a.seriesNumber ?? 0) - (b.seriesNumber ?? 0),
  );

  // Filter out the announcement post (seriesNumber 0)
  const numbered = all.filter((a) => (a.seriesNumber ?? 0) > 0);

  const currentIdx = numbered.findIndex((a) => a.id === current.id);
  const prev = currentIdx > 0 ? numbered[currentIdx - 1] : null;
  const next =
    currentIdx < numbered.length - 1 ? numbered[currentIdx + 1] : null;

  return (
    <nav className="rounded-lg ring-1 ring-border/40 bg-muted/30 px-4 py-3">
      <div className="flex items-center gap-2 text-sm font-medium">
        <BookOpen className="size-4 text-primary" />
        <span>
          {meta.titleZh}
          {meta.author && (
            <span className="ml-1 font-normal text-muted-foreground">
              by {meta.author}
            </span>
          )}
        </span>
        <span className="text-muted-foreground">
          ({current.seriesNumber}/{numbered.length})
        </span>
      </div>
      <div className="mt-2 flex items-center justify-between gap-4 text-sm">
        {prev ? (
          <Link
            href={`/articles/${prev.slug}`}
            className="text-muted-foreground transition-colors hover:text-primary"
          >
            &larr; {prev.titleZh ?? prev.title}
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link
            href={`/articles/${next.slug}`}
            className="text-right text-muted-foreground transition-colors hover:text-primary"
          >
            {next.titleZh ?? next.title} &rarr;
          </Link>
        ) : (
          <span />
        )}
      </div>
    </nav>
  );
}
