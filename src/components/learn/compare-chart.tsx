interface CompareItem {
  title: string;
  description: string;
  tags: { label: string; type: "pro" | "con" }[];
}

interface CompareChartProps {
  items: [CompareItem, CompareItem];
}

export function CompareChart({ items }: CompareChartProps) {
  return (
    <div className="my-8 grid gap-4 sm:grid-cols-2">
      {items.map((item) => (
        <div
          key={item.title}
          className="rounded-xl ring-1 ring-gray-950/10 dark:ring-gray-50/10 bg-card p-5"
        >
          <h4 className="mb-2 text-base font-bold">{item.title}</h4>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {item.description}
          </p>
          {item.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {item.tags.map((tag) => (
                <span
                  key={tag.label}
                  className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    tag.type === "pro"
                      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                      : "bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-300"
                  }`}
                >
                  {tag.label}
                </span>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
