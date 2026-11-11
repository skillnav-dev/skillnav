import Link from "next/link";
import { ArrowRight, Package } from "lucide-react";
import type { Pack } from "@/data/packs";

export function PackCard({ pack }: { pack: Pack }) {
  return (
    <Link
      href={`/packs/${pack.slug}`}
      className="group flex h-full flex-col rounded-xl p-6 ring-1 ring-border/40 transition-all hover:bg-muted/30 hover:shadow-md hover:ring-primary/40"
    >
      <div className="flex items-center gap-2">
        <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
          <Package className="size-4.5 text-primary" />
        </div>
        <h2 className="text-base font-semibold group-hover:text-primary">
          {pack.title}
        </h2>
      </div>
      <p className="mt-3 text-sm text-foreground/85">{pack.summary}</p>
      <p className="mt-2 text-xs text-muted-foreground">
        适合：{pack.audience}
      </p>
      <span className="mt-auto inline-flex items-center gap-1 pt-4 text-xs text-primary">
        {pack.items.length} 个工具 · 附上手教程
        <ArrowRight className="size-3.5" />
      </span>
    </Link>
  );
}
