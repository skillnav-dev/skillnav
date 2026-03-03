import { getSkillsWithCount } from "@/lib/data";
import { PAGE_SIZE } from "@/lib/skills-search-params";
import { SkillCard } from "./skill-card";
import { SkillsEmpty } from "./skills-empty";
import { SkillsPagination } from "./skills-pagination";

interface SkillsGridProps {
  q: string;
  category: string;
  page: number;
}

function buildPageUrl(q: string, category: string) {
  return (page: number) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (category) params.set("category", category);
    if (page > 1) params.set("page", String(page));
    const qs = params.toString();
    return qs ? `/skills?${qs}` : "/skills";
  };
}

export async function SkillsGrid({ q, category, page }: SkillsGridProps) {
  const validPage = Math.max(1, page);
  const offset = (validPage - 1) * PAGE_SIZE;

  const { skills, total } = await getSkillsWithCount({
    limit: PAGE_SIZE,
    offset,
    category: category || undefined,
    search: q || undefined,
  });

  const totalPages = Math.ceil(total / PAGE_SIZE);

  if (skills.length === 0) {
    return (
      <SkillsEmpty search={q || undefined} category={category || undefined} />
    );
  }

  return (
    <div className="mt-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {skills.map((skill) => (
          <SkillCard key={skill.id} skill={skill} />
        ))}
      </div>
      <div className="mt-8">
        <SkillsPagination
          currentPage={validPage}
          totalPages={totalPages}
          buildPageUrl={buildPageUrl(q, category)}
        />
      </div>
    </div>
  );
}
