import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  BreadcrumbJsonLd,
  SoftwareApplicationJsonLd,
  FAQJsonLd,
} from "@/components/shared/json-ld";
import { SkillContent } from "@/components/skills/skill-content";
import { SkillInstallTabs } from "@/components/skills/skill-install-tabs";
import { PlatformBadge } from "@/components/skills/platform-badge";
import { siteConfig } from "@/lib/constants";
import { getSkillBySlug, getAllSkillSlugs } from "@/lib/data";

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

  const title = `${skill.name} — AI Agent Skill`;
  const description =
    skill.description ?? `${skill.name} skill for AI-assisted development`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      url: `${siteConfig.url}/en/skills/${skill.slug}`,
    },
    alternates: {
      canonical: `${siteConfig.url}/en/skills/${skill.slug}`,
      languages: {
        "zh-CN": `${siteConfig.url}/skills/${skill.slug}`,
        en: `${siteConfig.url}/en/skills/${skill.slug}`,
      },
    },
  };
}

export default async function EnSkillDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const skill = await getSkillBySlug(slug);
  if (!skill) notFound();

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", href: "/en" },
          { name: "Skills", href: "/en/skills" },
          { name: skill.name, href: `/en/skills/${skill.slug}` },
        ]}
      />
      <SoftwareApplicationJsonLd
        name={skill.name}
        description={skill.description}
        url={`${siteConfig.url}/en/skills/${skill.slug}`}
        author={skill.author}
        platform={skill.platform}
        category={skill.category}
        stars={skill.stars}
        installCommand={skill.installCommand}
      />
      <FAQJsonLd
        questions={[
          {
            question: `What is ${skill.name}?`,
            answer: skill.description,
          },
          ...(skill.installCommand
            ? [
                {
                  question: `How to install ${skill.name}?`,
                  answer: `Run: ${skill.installCommand}`,
                },
              ]
            : []),
          ...(skill.platform
            ? [
                {
                  question: `What editors does ${skill.name} support?`,
                  answer: `Supported platforms: ${skill.platform.join(", ")}.`,
                },
              ]
            : []),
        ]}
      />

      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <nav className="mb-6 text-sm text-muted-foreground">
          <Link href="/en/skills" className="hover:text-primary">
            Skills
          </Link>
          <span className="mx-2">/</span>
          <span>{skill.name}</span>
        </nav>

        <div className="mb-8">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              {skill.name}
            </h1>
            <PlatformBadge platform={skill.platform} />
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            by {skill.author}
          </p>
          <p className="mt-4 text-base leading-relaxed text-foreground/85">
            {skill.description}
          </p>
          {skill.isVerified && (
            <div className="mt-3">
              <Badge variant="secondary" className="text-xs">
                Verified
              </Badge>
            </div>
          )}
          <p className="mt-4 text-sm text-muted-foreground">
            <Link
              href={`/skills/${skill.slug}`}
              className="text-primary hover:underline"
            >
              View Chinese version with editor review
            </Link>
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_280px]">
          <div className="min-w-0 space-y-6">
            <SkillInstallTabs
              installCommand={skill.installCommand}
              requiresEnv={skill.requiresEnv}
              requiresBins={skill.requiresBins}
              githubUrl={skill.githubUrl}
              platform={skill.platform}
              skillName={skill.name}
            />
            {/* English content (original SKILL.md) */}
            <SkillContent content={skill.content} contentZh={undefined} />
          </div>

          <aside className="space-y-4">
            {skill.githubUrl && (
              <a
                href={skill.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-lg border border-border/40 bg-card p-4 text-sm hover:border-primary/30"
              >
                <p className="font-medium">GitHub Repository</p>
                <p className="mt-1 text-muted-foreground">
                  {skill.stars > 0 && `${skill.stars} stars`}
                </p>
              </a>
            )}
            <div className="rounded-lg border border-border/40 bg-card p-4 text-sm">
              <p className="font-medium">Details</p>
              <dl className="mt-2 space-y-2 text-muted-foreground">
                <div>
                  <dt className="text-xs uppercase">Category</dt>
                  <dd>{skill.category}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase">Platform</dt>
                  <dd>{(skill.platform ?? []).join(", ") || "Claude"}</dd>
                </div>
                {skill.source && (
                  <div>
                    <dt className="text-xs uppercase">Source</dt>
                    <dd>{skill.source}</dd>
                  </div>
                )}
              </dl>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
