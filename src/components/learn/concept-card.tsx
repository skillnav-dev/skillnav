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
      className={`group block rounded-lg border border-border/60 bg-card p-6 transition-colors hover:border-primary/40 hover:bg-accent/30 ${
        featured ? "sm:col-span-2 lg:col-span-1" : ""
      }`}
    >
      <div className="mb-2 text-xs font-medium text-muted-foreground">
        {categoryLabel[concept.category]}
      </div>
      <h3 className="text-lg font-semibold tracking-tight group-hover:text-primary">
        {concept.zh}
      </h3>
      <p className="mt-1 text-sm text-muted-foreground">{concept.term}</p>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        {concept.oneLiner}
      </p>
    </Link>
  );
}
