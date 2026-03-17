type FlowColor = "purple" | "teal" | "amber" | "coral";

interface FlowStep {
  label: string;
  color: FlowColor;
}

interface FlowDiagramProps {
  steps: FlowStep[];
  title?: string;
}

const colorMap: Record<FlowColor, string> = {
  purple:
    "border-violet-300 bg-violet-50 text-violet-700 dark:border-violet-700 dark:bg-violet-950 dark:text-violet-300",
  teal: "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  amber:
    "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-300",
  coral:
    "border-orange-300 bg-orange-50 text-orange-700 dark:border-orange-700 dark:bg-orange-950 dark:text-orange-300",
};

export function FlowDiagram({ steps, title }: FlowDiagramProps) {
  return (
    <div className="my-8 rounded-xl bg-muted/40 p-5">
      {title && (
        <div className="mb-3 text-xs font-bold uppercase tracking-wider text-primary/70">
          {title}
        </div>
      )}
      <div className="flex flex-wrap items-center gap-3">
        {steps.map((step, i) => (
          <div key={step.label} className="flex items-center gap-3">
            <div
              className={`rounded-lg border px-4 py-2.5 text-center text-sm font-medium ${colorMap[step.color]}`}
            >
              {step.label}
            </div>
            {i < steps.length - 1 && (
              <span className="text-lg text-muted-foreground/50">→</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
