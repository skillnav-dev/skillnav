import { CopyButton } from "@/components/shared/copy-button";
import type { PackStep } from "@/data/packs";

/** Short walkthrough: what to run first after installing the pack. */
export function PackSteps({ steps }: { steps: PackStep[] }) {
  return (
    <section className="rounded-xl bg-card p-6 shadow-sm ring-1 ring-border/40">
      <h2 className="mb-4 text-lg font-semibold">装好之后怎么用</h2>
      <ol className="space-y-5">
        {steps.map((step, i) => (
          <li key={step.title} className="flex gap-3">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
              {i + 1}
            </span>
            <div className="min-w-0 flex-1 space-y-2">
              <h3 className="text-sm font-semibold">{step.title}</h3>
              <p className="text-sm text-foreground/85">{step.body}</p>
              {step.prompt && (
                <div className="flex items-start gap-2 rounded-md bg-muted/50 px-3 py-2 ring-1 ring-border">
                  <span className="shrink-0 text-xs text-muted-foreground">
                    试试
                  </span>
                  <p className="min-w-0 flex-1 text-sm">{step.prompt}</p>
                  <CopyButton text={step.prompt} className="h-7 w-7 shrink-0" />
                </div>
              )}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
