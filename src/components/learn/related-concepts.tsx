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
    <section className="mt-12 rounded-lg bg-gray-950/[0.025] dark:bg-gray-50/[0.025] p-6">
      <h2 className="mb-4 text-lg font-semibold">相关概念</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {related.map((c) => (
          <Link
            key={c.slug}
            href={`/learn/what-is-${c.slug}`}
            className="group rounded-md ring-1 ring-gray-950/10 dark:ring-gray-50/10 bg-card p-4 transition-colors hover:ring-primary/40"
          >
            <div className="font-medium group-hover:text-primary">{c.zh}</div>
            <p className="mt-1 text-sm text-muted-foreground">{c.oneLiner}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
