import Link from "next/link";
import type { LearnConcept } from "@/data/learn";
import { LEARN_CONCEPTS } from "@/data/learn";

interface RelatedConceptsProps {
  slugs: string[];
}

export function RelatedConcepts({ slugs }: RelatedConceptsProps) {
  const related = slugs
    .map((s) => LEARN_CONCEPTS.find((c) => c.slug === s))
    .filter((c): c is LearnConcept => c !== undefined);

  if (related.length === 0) return null;

  return (
    <section className="mt-12 rounded-lg border border-border/60 bg-muted/30 p-6">
      <h2 className="mb-4 text-lg font-semibold">相关概念</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {related.map((c) => (
          <Link
            key={c.slug}
            href={`/learn/what-is-${c.slug}`}
            className="group rounded-md border border-border/40 bg-card p-4 transition-colors hover:border-primary/40"
          >
            <div className="font-medium group-hover:text-primary">{c.zh}</div>
            <p className="mt-1 text-sm text-muted-foreground">{c.oneLiner}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
