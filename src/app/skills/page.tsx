import type { Metadata } from "next";
import { Suspense } from "react";
import { SectionHeader } from "@/components/shared/section-header";
import { BreadcrumbJsonLd } from "@/components/shared/json-ld";
import { SkillsToolbar } from "@/components/skills/skills-toolbar";
import { SkillsGrid } from "@/components/skills/skills-grid";
import { SkillsSkeleton } from "@/components/skills/skills-skeleton";
import { getSkillCategories, getSkillsWithCount } from "@/lib/data";
import { skillsParamsCache, PAGE_SIZE } from "@/lib/skills-search-params";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({
  searchParams,
}: PageProps): Promise<Metadata> {
  const { q, category, page } = await skillsParamsCache.parse(searchParams);
  const parts = ["Skills 导航"];
  if (category) parts.push(category);
  if (q) parts.push(`「${q}」`);
  if (page > 1) parts.push(`第 ${page} 页`);

  return {
    title: parts.join(" - "),
    description: "浏览和发现最好用的 AI Agent Skills，包含安全评分和社区评价。",
  };
}

export default async function SkillsPage({ searchParams }: PageProps) {
  const { q, category, page } = await skillsParamsCache.parse(searchParams);

  // Parallel fetch: categories (lightweight) + count for toolbar display
  const [categories, { total }] = await Promise.all([
    getSkillCategories(),
    getSkillsWithCount({
      limit: PAGE_SIZE,
      offset: (Math.max(1, page) - 1) * PAGE_SIZE,
      category: category || undefined,
      search: q || undefined,
    }),
  ]);

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "首页", href: "/" },
          { name: "Skills", href: "/skills" },
        ]}
      />
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <SectionHeader
          title="Skills 导航"
          description="浏览和发现最好用的 AI Agent Skills"
        />
        <div className="mt-6">
          <SkillsToolbar categories={categories} totalCount={total} />
        </div>
        <Suspense
          key={`${q}-${category}-${page}`}
          fallback={<SkillsSkeleton />}
        >
          <SkillsGrid q={q} category={category} page={page} />
        </Suspense>
      </div>
    </>
  );
}
