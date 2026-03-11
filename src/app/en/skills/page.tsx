import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { BreadcrumbJsonLd } from "@/components/shared/json-ld";
import { siteConfig } from "@/lib/constants";
import { getSkills, getSkillsCount } from "@/lib/data";

export const metadata: Metadata = {
  title: "AI Agent Skills Directory",
  description:
    "Browse curated AI agent skills for Claude Code, Codex, and more. Find the best skills to supercharge your AI-assisted development workflow.",
  alternates: {
    canonical: `${siteConfig.url}/en/skills`,
    languages: {
      "zh-CN": `${siteConfig.url}/skills`,
      en: `${siteConfig.url}/en/skills`,
    },
  },
};

export default async function EnSkillsPage() {
  const [skills, total] = await Promise.all([
    getSkills({ limit: 200, sort: "stars" }),
    getSkillsCount(),
  ]);

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", href: "/en" },
          { name: "Skills", href: "/en/skills" },
        ]}
      />
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          AI Agent Skills Directory
        </h1>
        <p className="mt-2 text-muted-foreground">
          {total} curated skills for Claude Code, Codex, and more.{" "}
          <Link href="/skills" className="text-primary hover:underline">
            View Chinese version
          </Link>
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {skills.map((skill) => (
            <Link
              key={skill.id}
              href={`/en/skills/${skill.slug}`}
              className="group rounded-lg border border-border/40 bg-card p-4 transition-colors hover:border-primary/30 hover:bg-accent/5"
            >
              <div className="flex items-start justify-between gap-2">
                <h2 className="font-semibold group-hover:text-primary">
                  {skill.name}
                </h2>
                {skill.stars > 0 && (
                  <Badge variant="secondary" className="shrink-0 text-xs">
                    {skill.stars} stars
                  </Badge>
                )}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                by {skill.author}
              </p>
              <p className="mt-2 line-clamp-2 text-sm text-foreground/80">
                {skill.description}
              </p>
              <div className="mt-3 flex flex-wrap gap-1">
                <Badge variant="outline" className="text-xs">
                  {skill.category}
                </Badge>
                {(skill.platform ?? []).map((p) => (
                  <Badge key={p} variant="outline" className="text-xs">
                    {p}
                  </Badge>
                ))}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
