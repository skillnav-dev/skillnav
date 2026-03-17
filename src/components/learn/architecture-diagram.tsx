interface ArchStep {
  title: string;
  description: string;
  color: "purple" | "teal" | "amber" | "coral";
}

interface ArchitectureDiagramProps {
  steps: ArchStep[];
  title?: string;
}

const dotColor: Record<string, string> = {
  purple: "border-violet-500",
  teal: "border-emerald-500",
  amber: "border-amber-500",
  coral: "border-orange-500",
};

export function ArchitectureDiagram({
  steps,
  title,
}: ArchitectureDiagramProps) {
  return (
    <div className="my-8 rounded-xl bg-muted/40 p-5">
      {title && (
        <div className="mb-4 text-xs font-bold uppercase tracking-wider text-primary/70">
          {title}
        </div>
      )}
      <div className="relative pl-8">
        {/* Vertical line */}
        <div className="absolute left-[9px] top-1 bottom-1 w-0.5 bg-border" />
        <div className="space-y-6">
          {steps.map((step) => (
            <div key={step.title} className="relative">
              {/* Dot */}
              <div
                className={`absolute -left-8 top-1 h-3 w-3 rounded-full border-2 bg-background ${dotColor[step.color]}`}
              />
              <h4 className="text-sm font-semibold">{step.title}</h4>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
