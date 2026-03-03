import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, Github } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SkillMeta } from "@/components/skills/skill-meta";
import { SkillCard } from "@/components/skills/skill-card";
import { BreadcrumbJsonLd } from "@/components/shared/json-ld";
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
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <Link
          href="/skills"
          className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          返回 Skills 列表
        </Link>

        {/* Title & Author */}
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          {skill.nameZh ?? skill.name}
        </h1>
        {skill.nameZh && skill.name && (
          <p className="mt-1 text-lg text-muted-foreground">{skill.name}</p>
        )}
        <p className="mt-2 text-sm text-muted-foreground">by {skill.author}</p>

        {/* Meta */}
        <div className="mt-4">
          <SkillMeta skill={skill} />
        </div>

        {/* Description */}
        <div className="mt-8">
          <p className="text-base leading-relaxed text-foreground/90">
            {skill.descriptionZh ?? skill.description}
          </p>
        </div>

        {/* Tags */}
        {skill.tags.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-2">
            {skill.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* External Links */}
        {(skill.sourceUrl || skill.githubUrl) && (
          <div className="mt-8 flex flex-wrap gap-3">
            {skill.sourceUrl && (
              <a
                href={skill.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-md border border-border px-4 py-2 text-sm transition-colors hover:bg-accent"
              >
                <ExternalLink className="size-4" />
                查看来源
              </a>
            )}
            {skill.githubUrl && (
              <a
                href={skill.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-md border border-border px-4 py-2 text-sm transition-colors hover:bg-accent"
              >
                <Github className="size-4" />
                GitHub
              </a>
            )}
          </div>
        )}
      </div>

      {/* Related Skills */}
      {related.length > 0 && (
        <section className="border-t border-border/40">
          <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
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
