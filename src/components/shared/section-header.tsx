import Link from "next/link";
import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  title: string;
  description?: string;
  className?: string;
  as?: "h1" | "h2" | "h3";
  href?: string;
  linkText?: string;
}

export function SectionHeader({
  title,
  description,
  className,
  as: Tag = "h2",
  href,
  linkText = "查看全部",
}: SectionHeaderProps) {
  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex items-baseline justify-between gap-4">
        <Tag className="text-2xl font-bold tracking-tight sm:text-3xl">
          {title}
        </Tag>
        {href && (
          <Link
            href={href}
            className="shrink-0 text-sm text-muted-foreground transition-colors hover:text-primary"
          >
            {linkText} →
          </Link>
        )}
      </div>
      {description && <p className="text-muted-foreground">{description}</p>}
    </div>
  );
}
