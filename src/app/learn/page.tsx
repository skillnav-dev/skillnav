import type { Metadata } from "next";
import { SectionHeader } from "@/components/shared/section-header";
import { BreadcrumbJsonLd } from "@/components/shared/json-ld";
import { ConceptCard } from "@/components/learn/concept-card";
import { LEARN_CONCEPTS } from "@/data/learn";

export const metadata: Metadata = {
  title: "学习中心 — AI Agent 工程概念通俗解读",
  description:
    "用通俗语言理解 AI Agent 工程的核心概念：Agent、MCP、RAG、Tool Use 等，每个概念配有可视化解读和代码示例。",
};

export default function LearnPage() {
  const core = LEARN_CONCEPTS.filter((c) => c.category === "core");
  const applied = LEARN_CONCEPTS.filter((c) => c.category === "applied");
  const foundation = LEARN_CONCEPTS.filter((c) => c.category === "foundation");

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "首页", href: "/" },
          { name: "学习中心", href: "/learn" },
        ]}
      />
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <SectionHeader
          as="h1"
          title="学习中心"
          description="用通俗语言理解 AI Agent 工程的核心概念，每篇配有图解和代码示例"
        />

        {/* Core concepts */}
        {core.length > 0 && (
          <section className="mt-10">
            <h2 className="mb-4 text-lg font-semibold text-foreground">
              核心概念
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {core.map((c) => (
                <ConceptCard key={c.slug} concept={c} featured />
              ))}
            </div>
          </section>
        )}

        {/* Applied concepts */}
        {applied.length > 0 && (
          <section className="mt-10">
            <h2 className="mb-4 text-lg font-semibold text-foreground">
              应用概念
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {applied.map((c) => (
                <ConceptCard key={c.slug} concept={c} />
              ))}
            </div>
          </section>
        )}

        {/* Foundation concepts */}
        {foundation.length > 0 && (
          <section className="mt-10">
            <h2 className="mb-4 text-lg font-semibold text-foreground">
              基础概念
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {foundation.map((c) => (
                <ConceptCard key={c.slug} concept={c} />
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
