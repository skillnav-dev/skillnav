import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BreadcrumbJsonLd } from "@/components/shared/json-ld";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  // TODO: fetch weekly issue by slug from DB
  return {
    title: `周刊 ${slug}`,
    description: `SkillNav 周刊 ${slug} — 本周精选 AI Agent 工具动态。`,
  };
}

export default async function WeeklyDetailPage({ params }: PageProps) {
  const { slug } = await params;

  // TODO: fetch weekly issue from articles table (series = 'weekly')
  // For now, return 404 until weekly content is available
  notFound();

  // Future layout reference (uncomment when data layer is ready):
  // return (
  //   <>
  //     <BreadcrumbJsonLd items={[
  //       { name: "首页", href: "/" },
  //       { name: "周刊", href: "/weekly" },
  //       { name: issue.title, href: `/weekly/${slug}` },
  //     ]} />
  //     <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
  //       {/* Header + TOC + Content + Prev/Next + Share + Newsletter CTA */}
  //     </article>
  //   </>
  // );
}
