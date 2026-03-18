import Link from "next/link";
import { Github, Star, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SkillCard } from "./skill-card";
import { formatNumber } from "@/lib/utils";
import { getSkillsWithCount } from "@/lib/data";
import type { Skill } from "@/data/types";

interface RepoGroup {
  repo: string;
  org: string;
  repoName: string;
  githubUrl: string;
  skills: Skill[];
  totalStars: number;
}

function groupByRepo(skills: Skill[]): RepoGroup[] {
  const groups = new Map<string, RepoGroup>();

  for (const skill of skills) {
    const url = skill.githubUrl || "";
    const match = url.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (!match) continue;

    const [, org, repoName] = match;
    const repo = `${org}/${repoName}`;

    if (!groups.has(repo)) {
      groups.set(repo, {
        repo,
        org,
        repoName,
        githubUrl: `https://github.com/${repo}`,
        skills: [],
        totalStars: 0,
      });
    }

    const group = groups.get(repo)!;
    group.skills.push(skill);
    // Use the max stars from any skill in this repo
    if (skill.stars > group.totalStars) {
      group.totalStars = skill.stars;
    }
  }

  // Sort by total stars descending
  return [...groups.values()].sort((a, b) => b.totalStars - a.totalStars);
}

// Well-known repo descriptions
const REPO_DESCRIPTIONS: Record<string, string> = {
  "anthropics/skills": "Anthropic 官方 Skills 合集",
  "openai/codex": "OpenAI Codex CLI 官方 Skills",
  "neondatabase/agent-skills": "Neon 数据库 Agent Skills",
  "alirezarezvani/claude-skills":
    "全栈开发 Skills 合集（46 个工程/运维/安全技能）",
  "daymade/claude-code-skills":
    "开发者工具 Skills 合集（CLI 工具、阅读器、自动化）",
  "giuseppe-trisciuoglio/developer-kit":
    "Developer Kit 插件（全栈框架、DevOps、数据库）",
  "levnikolaevich/claude-code-skills":
    "系统化工程 Skills（分解、引导、审计、重构）",
};

interface SkillsRepoGridProps {
  q: string;
  category: string;
}

export async function SkillsRepoGrid({ q, category }: SkillsRepoGridProps) {
  // Fetch all published skills (no pagination for repo view)
  const { skills } = await getSkillsWithCount({
    limit: 500,
    offset: 0,
    category: category || undefined,
    search: q || undefined,
    tab: undefined,
    sort: undefined,
  });

  const repos = groupByRepo(skills);

  if (repos.length === 0) {
    return (
      <p className="mt-12 text-center text-muted-foreground">
        未找到匹配的仓库
      </p>
    );
  }

  return (
    <div className="mt-6 space-y-10">
      {repos.map((repo) => (
        <div key={repo.repo}>
          {/* Repo header */}
          <div className="mb-4 flex items-center gap-3">
            <a
              href={repo.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-lg font-semibold hover:text-primary"
            >
              <Github className="size-5" />
              <span className="text-muted-foreground">{repo.org}/</span>
              {repo.repoName}
            </a>
            {repo.totalStars > 0 && (
              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                <Star className="size-3.5" />
                {formatNumber(repo.totalStars)}
              </span>
            )}
            <Badge variant="secondary" className="text-xs">
              {repo.skills.length} Skills
            </Badge>
          </div>
          {REPO_DESCRIPTIONS[repo.repo] && (
            <p className="mb-4 text-sm text-muted-foreground">
              {REPO_DESCRIPTIONS[repo.repo]}
            </p>
          )}
          {/* Skills grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {repo.skills.slice(0, 6).map((skill) => (
              <SkillCard key={skill.id} skill={skill} />
            ))}
          </div>
          {repo.skills.length > 6 && (
            <Link
              href={`/skills?q=${encodeURIComponent(repo.org)}`}
              className="mt-3 inline-flex items-center gap-1 text-sm text-primary hover:underline"
            >
              查看全部 {repo.skills.length} 个 Skills
              <ChevronRight className="size-3.5" />
            </Link>
          )}
        </div>
      ))}
    </div>
  );
}
