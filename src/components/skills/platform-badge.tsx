import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const platformConfig: Record<string, { label: string; className: string }> = {
  claude: {
    label: "Claude",
    className:
      "border-indigo-300 bg-indigo-50 text-indigo-700 dark:border-indigo-700 dark:bg-indigo-950 dark:text-indigo-300",
  },
  codex: {
    label: "Codex",
    className:
      "border-green-300 bg-green-50 text-green-700 dark:border-green-700 dark:bg-green-950 dark:text-green-300",
  },
  universal: {
    label: "Universal",
    className:
      "border-gray-300 bg-gray-50 text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300",
  },
};

interface PlatformBadgeProps {
  platform?: string[];
  className?: string;
}

export function PlatformBadge({ platform, className }: PlatformBadgeProps) {
  if (!platform || platform.length === 0) return null;

  return (
    <div className={cn("flex gap-1", className)}>
      {platform.map((p) => {
        const config = platformConfig[p] ?? platformConfig.universal;
        return (
          <Badge
            key={p}
            variant="outline"
            className={cn("text-[10px] font-medium", config.className)}
          >
            {config.label}
          </Badge>
        );
      })}
    </div>
  );
}
