import { ChevronRight, CircleCheck, CircleX, Radar } from "lucide-react";
import type { BriefCoverage } from "@/lib/daily-coverage";

/** "今日覆盖 N 个源" with an expandable per-source status list. */
export function CoverageLine({ coverage }: { coverage: BriefCoverage }) {
  const failed = coverage.total - coverage.ok;

  return (
    <details className="group mt-4 rounded-lg bg-muted/30 ring-1 ring-border/60 text-sm">
      <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2 text-muted-foreground [&::-webkit-details-marker]:hidden">
        <Radar className="size-4 shrink-0 text-primary" />
        <span>
          今日已覆盖{" "}
          <span className="font-semibold text-foreground">{coverage.ok}</span>{" "}
          个源
          {failed > 0 && <span>（{failed} 个未抓到）</span>}
        </span>
        <ChevronRight className="ml-auto size-4 shrink-0 transition-transform group-open:rotate-90" />
      </summary>
      <ul className="grid gap-x-4 gap-y-1.5 px-3 pb-3 pt-1 sm:grid-cols-2">
        {coverage.sources.map((s) => (
          <li
            key={`${s.group}-${s.name}`}
            className="flex items-center gap-1.5 text-xs"
          >
            {s.ok ? (
              <CircleCheck className="size-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <CircleX className="size-3.5 shrink-0 text-muted-foreground" />
            )}
            <span className="text-muted-foreground">{s.group}</span>
            <span className={s.ok ? "" : "text-muted-foreground line-through"}>
              {s.label}
            </span>
            {s.ok && typeof s.count === "number" && s.count > 0 && (
              <span className="text-muted-foreground">· {s.count} 条</span>
            )}
          </li>
        ))}
      </ul>
    </details>
  );
}
