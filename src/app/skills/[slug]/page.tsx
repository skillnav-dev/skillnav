import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { PageBreadcrumb } from "@/components/shared/page-breadcrumb";
import { SkillCard } from "@/components/skills/skill-card";
import { SkillContent } from "@/components/skills/skill-content";
import { SkillInstallTabs } from "@/components/skills/skill-install-tabs";
import { SkillSidebar } from "@/components/skills/skill-sidebar";
import { SkillComments } from "@/components/skills/skill-comments";
import { PlatformBadge } from "@/components/skills/platform-badge";
import {
  BreadcrumbJsonLd,
  SoftwareApplicationJsonLd,
} from "@/components/shared/json-ld";
import { siteConfig } from "@/lib/constants";
import { getSkillBySlug, getSkills, getAllSkillSlugs } from "@/lib/data";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const slugs = await getAllSkillSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const skill = await getSkillBySlug(slug);
  if (!skill) return {};

  const title = `${skill.nameZh ?? skill.name} — ${siteConfig.name}`;
  const description =
    skill.descriptionZh ?? skill.description ?? `${skill.name} Skill 详情`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      url: `${siteConfig.url}/skills/${skill.slug}`,
    },
  };
}

export default async function SkillDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const skill = await getSkillBySlug(slug);
  if (!skill) notFound();

  // Related skills: same category, exclude self, max 3
  const allSkills = await getSkills({ category: skill.category, limit: 4 });
  const related = allSkills.filter((s) => s.id !== skill.id).slice(0, 3);

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "首页", href: "/" },
          { name: "Skills", href: "/skills" },
          { name: skill.nameZh ?? skill.name, href: `/skills/${skill.slug}` },
        ]}
      />
      <SoftwareApplicationJsonLd
        name={skill.nameZh ?? skill.name}
        description={skill.descriptionZh ?? skill.description}
        url={`${siteConfig.url}/skills/${skill.slug}`}
        author={skill.author}
        platform={skill.platform}
        category={skill.category}
      />

      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <PageBreadcrumb
          items={[
            { label: "首页", href: "/" },
            { label: "Skills", href: "/skills" },
            { label: skill.nameZh ?? skill.name },
          ]}
        />

        {/* Hero section: full width */}
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              {skill.nameZh ?? skill.name}
            </h1>
            <PlatformBadge platform={skill.platform} />
          </div>
          {skill.nameZh && skill.name && (
            <p className="mt-1 text-lg text-muted-foreground">{skill.name}</p>
          )}
          <p className="mt-2 text-sm text-muted-foreground">
            by {skill.author}
          </p>
          {/* Description */}
          <p className="mt-4 text-base leading-relaxed text-foreground/85">
            {skill.descriptionZh ?? skill.description}
          </p>
          {/* Editor one-liner comment */}
          {skill.editorCommentZh && (
            <div className="mt-4 rounded-lg border-l-4 border-primary/50 bg-primary/5 px-4 py-3">
              <p className="text-sm italic text-foreground/80">
                {skill.editorCommentZh}
              </p>
            </div>
          )}
          {/* Verification badge */}
          {skill.isVerified && (
            <div className="mt-3">
              <Badge variant="secondary" className="text-xs">
                已验证
              </Badge>
            </div>
          )}
        </div>

        {/* Two-column layout: main content + sidebar */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_280px]">
          {/* Left: main content */}
          <div className="min-w-0 space-y-6">
            {/* Install block with multi-client tabs */}
            <SkillInstallTabs
              installCommand={skill.installCommand}
              requiresEnv={skill.requiresEnv}
              requiresBins={skill.requiresBins}
              githubUrl={skill.githubUrl}
              platform={skill.platform}
              skillName={skill.name}
            />

            {/* Full SKILL.md documentation */}
            <SkillContent content={skill.content} contentZh={skill.contentZh} />

            {/* Editorial review (only shown when data exists) */}
            {skill.editorReviewZh && (
              <div className="rounded-lg border border-border/50 bg-card p-6">
                <div className="mb-3 flex items-center gap-2">
                  <h2 className="text-lg font-semibold">编辑评测</h2>
                  {skill.editorRating && (
                    <Badge variant="secondary" className="text-xs">
                      {skill.editorRating}
                    </Badge>
                  )}
                </div>
                <p className="text-sm leading-relaxed text-foreground/85">
                  {skill.editorReviewZh}
                </p>
              </div>
            )}

            {/* Comments (giscus) */}
            <SkillComments />
          </div>

          {/* Right: sidebar */}
          <SkillSidebar skill={skill} />
        </div>
      </div>

      {/* Related Skills: full width section */}
      {related.length > 0 && (
        <section className="border-t border-border/40">
          <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
            <h2 className="mb-6 text-xl font-bold">相关 Skills</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((s) => (
                <SkillCard key={s.id} skill={s} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
