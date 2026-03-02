import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SectionHeader } from "@/components/shared/section-header";
import { SkillCard } from "@/components/skills/skill-card";
import { mockSkills } from "@/data/mock-skills";

export function FeaturedSkills() {
  const featured = mockSkills.slice(0, 6);

  return (
    <section className="py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex items-end justify-between">
          <SectionHeader
            title="精选 Skills"
            description="社区推荐的高质量 AI Agent 技能"
          />
          <Link
            href="/skills"
            className="hidden items-center gap-1 text-sm font-medium text-primary transition-colors hover:text-primary/80 sm:flex"
          >
            查看全部
            <ArrowRight className="size-4" />
          </Link>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((skill) => (
            <SkillCard key={skill.id} skill={skill} />
          ))}
        </div>
        <div className="mt-6 text-center sm:hidden">
          <Link
            href="/skills"
            className="inline-flex items-center gap-1 text-sm font-medium text-primary"
          >
            查看全部 Skills
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
