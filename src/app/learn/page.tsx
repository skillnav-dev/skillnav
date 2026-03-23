import type { Metadata } from "next";
import Link from "next/link";
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
        {/* Interactive deep guides */}
        <section className="mt-10">
          <h2 className="mb-4 text-lg font-semibold text-foreground">
            交互式深度指南
          </h2>
          <Link
            href="/guides/ai-guide.html"
            className="group block rounded-xl ring-1 ring-gray-950/10 dark:ring-gray-50/10 bg-card p-5 transition-colors hover:ring-primary/40"
          >
            <div className="text-xs font-medium text-primary/70">
              10 章完整体系
            </div>
            <h3 className="mt-1 text-base font-bold group-hover:text-primary">
              AI 架构深度指南
            </h3>
            <p className="mt-1.5 text-sm text-muted-foreground">
              从提示词工程到 Agent 系统，从 RAG 到 MCP，交互式演示掌握全貌
            </p>
          </Link>
        </section>
      </div>
    </>
  );
}
