import type { Metadata } from "next";
import { SectionHeader } from "@/components/shared/section-header";
import { SkillCard } from "@/components/skills/skill-card";
import { BreadcrumbJsonLd } from "@/components/shared/json-ld";
import { getSkills } from "@/lib/data";

export const metadata: Metadata = {
  title: "Skills 导航",
  description: "浏览和发现最好用的 AI Agent Skills，包含安全评分和社区评价。",
};

export default async function SkillsPage() {
  const skills = await getSkills();

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
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {skills.map((skill) => (
            <SkillCard key={skill.id} skill={skill} />
          ))}
        </div>
      </div>
    </>
  );
}
