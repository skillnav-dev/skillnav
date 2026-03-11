import { Badge } from "@/components/ui/badge";
import { TrendingUp, Sparkles, AlertTriangle, Archive } from "lucide-react";
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
  // Priority 1: Trending
  if (isTrending) {
    return (
      <Badge
        variant="outline"
        className={cn(
          "gap-1 border border-red-300 bg-red-50 font-medium text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300",
          className,
        )}
      >
        <TrendingUp className="size-3" />
        热门
      </Badge>
    );
  }

  // Priority 2: New (discovered_at < 30 days)
  if (discoveredAt) {
    const age = Date.now() - new Date(discoveredAt).getTime();
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    if (age < thirtyDays) {
      return (
        <Badge
          variant="outline"
          className={cn(
            "gap-1 border border-green-300 bg-green-50 font-medium text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-300",
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
          "gap-1 border border-yellow-300 bg-yellow-50 font-medium text-yellow-700 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-300",
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
          "gap-1 border border-gray-300 bg-gray-50 font-medium text-gray-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400",
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
