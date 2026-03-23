import { Badge } from "@/components/ui/badge";
import { Flame, Sparkles, AlertTriangle, Archive } from "lucide-react";
import { cn } from "@/lib/utils";

type FreshnessStatus = "fresh" | "active" | "stale" | "archived";

interface FreshnessBadgeProps {
  freshness?: FreshnessStatus;
  isTrending?: boolean;
  discoveredAt?: string;
  className?: string;
}

/**
 * Badge indicating tool freshness / trending status.
 * Priority: Trending > New > Stale > Archived.
 * Fresh/Active = no badge (default healthy state).
 */
export function FreshnessBadge({
  freshness,
  isTrending,
  discoveredAt,
  className,
}: FreshnessBadgeProps) {
  // Priority 1: Trending (orange/amber)
  if (isTrending) {
    return (
      <Badge
        variant="outline"
        className={cn(
          "gap-1 border border-amber-300 bg-amber-50 font-medium text-amber-600 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300",
          className,
        )}
      >
        <Flame className="size-3" />
        热门
      </Badge>
    );
  }

  // Priority 2: New (discovered_at < 14 days, blue)
  if (discoveredAt) {
    // eslint-disable-next-line react-hooks/purity -- server component, Date.now() is stable per request
    const age = Date.now() - new Date(discoveredAt).getTime();
    const fourteenDays = 14 * 24 * 60 * 60 * 1000;
    if (age < fourteenDays) {
      return (
        <Badge
          variant="outline"
          className={cn(
            "gap-1 border border-blue-300 bg-blue-50 font-medium text-blue-600 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300",
            className,
          )}
        >
          <Sparkles className="size-3" />新
        </Badge>
      );
    }
  }

  // Priority 3: Stale
  if (freshness === "stale") {
    return (
      <Badge
        variant="outline"
        className={cn(
          "gap-1 border border-yellow-300 bg-yellow-50 font-medium text-yellow-600 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-300",
          className,
        )}
      >
        <AlertTriangle className="size-3" />
        停更
      </Badge>
    );
  }

  // Priority 4: Archived
  if (freshness === "archived") {
    return (
      <Badge
        variant="outline"
        className={cn(
          "gap-1 border border-gray-300 bg-gray-50 font-medium text-gray-400 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400",
          className,
        )}
      >
        <Archive className="size-3" />
        归档
      </Badge>
    );
  }

  // Fresh / Active / undefined — no badge
  return null;
}
