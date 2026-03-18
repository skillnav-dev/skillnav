import type { Metadata } from "next";
import { Suspense } from "react";
import { SectionHeader } from "@/components/shared/section-header";
import { BreadcrumbJsonLd } from "@/components/shared/json-ld";
import { siteConfig } from "@/lib/constants";
import { SkillsToolbar } from "@/components/skills/skills-toolbar";
import { SkillsGrid } from "@/components/skills/skills-grid";
import { SkillsRepoGrid } from "@/components/skills/skills-repo-grid";
import { SkillsSkeleton } from "@/components/skills/skills-skeleton";
import { getSkillCategories, getSkillsWithCount } from "@/lib/data";
import { skillsParamsCache, PAGE_SIZE } from "@/lib/skills-search-params";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({
  searchParams,
}: PageProps): Promise<Metadata> {
  const { q, category, tab, page } =
    await skillsParamsCache.parse(searchParams);
  const parts = ["Skills 导航"];
  if (tab === "featured") parts.push("精选");
  if (category) parts.push(category);
  if (q) parts.push(`「${q}」`);
  if (page > 1) parts.push(`第 ${page} 页`);

  const title = parts.join(" - ");
  const description =
    "浏览和发现最好用的 AI Agent Skills，支持 Claude Code、Codex 等多平台。";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${siteConfig.url}/skills`,
    },
    alternates: {
      canonical: `${siteConfig.url}/skills`,
      languages: {
        "zh-CN": `${siteConfig.url}/skills`,
        en: `${siteConfig.url}/en/skills`,
      },
    },
  };
}

export default async function SkillsPage({ searchParams }: PageProps) {
  const { q, category, tab, sort, page } =
    await skillsParamsCache.parse(searchParams);

  // Parallel fetch: categories + count for toolbar display
  const [categories, { total }] = await Promise.all([
    getSkillCategories(),
    getSkillsWithCount({
      limit: PAGE_SIZE,
      offset: (Math.max(1, page) - 1) * PAGE_SIZE,
      category: category || undefined,
      search: q || undefined,
      tab: tab || undefined,
      sort: sort || undefined,
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
          as="h1"
          title="Skills 导航"
          description="浏览和发现最好用的 AI Agent Skills"
        />
        <div className="mt-6">
          <SkillsToolbar categories={categories} totalCount={total} />
        </div>
        <Suspense
          key={`${q}-${category}-${tab}-${sort}-${page}`}
          fallback={<SkillsSkeleton />}
        >
          {tab === "repo" ? (
            <SkillsRepoGrid q={q} category={category} />
          ) : (
            <SkillsGrid
              q={q}
              category={category}
              tab={tab}
              sort={sort}
              page={page}
            />
          )}
        </Suspense>
      </div>
    </>
  );
}
