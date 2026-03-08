import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  title: string;
  description?: string;
  className?: string;
  as?: "h1" | "h2" | "h3";
}

export function SectionHeader({
  title,
  description,
  className,
  as: Tag = "h2",
}: SectionHeaderProps) {
  return (
    <div className={cn("space-y-1", className)}>
      <Tag className="text-2xl font-bold tracking-tight sm:text-3xl">
        {title}
      </Tag>
      {description && <p className="text-muted-foreground">{description}</p>}
    </div>
  );
}
