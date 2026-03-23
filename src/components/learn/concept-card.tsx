import Link from "next/link";
import type { LearnConcept } from "@/data/learn";

interface ConceptCardProps {
  concept: LearnConcept;
  featured?: boolean;
}

const categoryLabel: Record<LearnConcept["category"], string> = {
  core: "核心概念",
  applied: "应用概念",
  foundation: "基础概念",
};

export function ConceptCard({ concept, featured }: ConceptCardProps) {
  return (
    <Link
      href={`/learn/what-is-${concept.slug}`}
      className={`group block rounded-xl ring-1 ring-gray-950/10 dark:ring-gray-50/10 bg-card p-6 transition-all hover:ring-primary/40 hover:bg-accent/30 hover:shadow-md ${
        featured ? "sm:col-span-2 lg:col-span-1" : ""
      }`}
    >
      <div className="mb-2 text-xs font-medium text-muted-foreground">
        {categoryLabel[concept.category]}
      </div>
      <h3 className="text-base font-semibold tracking-tight group-hover:text-primary">
        {concept.zh}
      </h3>
      <p className="mt-1 text-sm text-muted-foreground">{concept.term}</p>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        {concept.oneLiner}
      </p>
    </Link>
  );
}
