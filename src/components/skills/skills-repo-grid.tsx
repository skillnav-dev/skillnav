import Link from "next/link";
import { Github, Star, ChevronRight, Package, ArrowLeft, FolderSearch } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SkillCard } from "./skill-card";
import { formatNumber } from "@/lib/utils";
import { getSkillsWithCount } from "@/lib/data";
import type { Skill } from "@/data/types";

export interface RepoGroup {
  repo: string;
  org: string;
  repoName: string;
  githubUrl: string;
  skills: Skill[];
  totalStars: number;
  description: string;
  isOfficial: boolean;
}

// Well-known repo metadata
const REPO_META: Record<string, { description: string; isOfficial?: boolean }> =
  {
    "anthropics/skills": {
      description:
        "Anthropic 官方 Skills 合集 — 文档处理、品牌设计、Web 开发等",
      isOfficial: true,
    },
    "openai/codex": {
      description: "OpenAI Codex CLI 官方 Skills — PR 管理、TUI 测试",
      isOfficial: true,
    },
    "neondatabase/agent-skills": {
      description: "Neon 数据库官方 Skills — 一键创建 Postgres 实例",
      isOfficial: true,
    },
    "alirezarezvani/claude-skills": {
      description:
        "全栈开发 Skills 合集 — 覆盖前后端、DevOps、安全、AI 多个领域",
    },
    "daymade/claude-code-skills": {
      description: "开发者工具集 — CLI 工具生成、代码阅读器、社交媒体自动化等",
    },
    "giuseppe-trisciuoglio/developer-kit": {
      description:
        "Developer Kit — NestJS、React、Terraform 等全栈框架的脚手架和最佳实践",
    },
    "levnikolaevich/claude-code-skills": {
      description: "系统化工程 Skills — 需求分解、项目引导、代码审计、依赖升级",
    },
  };

export function groupByRepo(skills: Skill[]): RepoGroup[] {
  const groups = new Map<string, RepoGroup>();

  for (const skill of skills) {
    const url = skill.githubUrl || "";
    const match = url.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (!match) continue;

    const [, org, repoName] = match;
    const repo = `${org}/${repoName}`;
    const meta = REPO_META[repo];

    if (!groups.has(repo)) {
      groups.set(repo, {
        repo,
        org,
        repoName,
        githubUrl: `https://github.com/${repo}`,
        skills: [],
        totalStars: 0,
        description: meta?.description || "",
        isOfficial: meta?.isOfficial || false,
      });
    }

    const group = groups.get(repo)!;
    group.skills.push(skill);
    if (skill.stars > group.totalStars) {
      group.totalStars = skill.stars;
    }
  }

  // Official repos first, then by stars
  return [...groups.values()].sort((a, b) => {
    if (a.isOfficial !== b.isOfficial) return a.isOfficial ? -1 : 1;
    return b.totalStars - a.totalStars;
  });
}

/**
 * Default view: repo cards as primary navigation
 */
export async function SkillsRepoIndex() {
  const { skills } = await getSkillsWithCount({
    limit: 500,
    offset: 0,
  });

  const repos = groupByRepo(skills);

  return (
    <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {repos.map((repo) => {
        const topSkills = repo.skills.slice(0, 4);
        return (
          <Link
            key={repo.repo}
            href={`/skills?repo=${encodeURIComponent(repo.repo)}`}
          >
            <Card className="group h-full transition-all hover:ring-primary/40 hover:shadow-md">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Github className="size-4 shrink-0 text-muted-foreground" />
                      <h3 className="truncate text-base font-semibold group-hover:text-primary">
                        {repo.org}/{repo.repoName}
                      </h3>
                    </div>
                    <div className="mt-1.5 flex items-center gap-2">
                      {repo.isOfficial && (
                        <Badge
                          variant="secondary"
                          className="border-blue-200 bg-blue-50 text-blue-600 text-xs dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300"
                        >
                          官方
                        </Badge>
                      )}
                      <Badge variant="secondary" className="text-xs">
                        <Package className="mr-0.5 size-3" />
                        {repo.skills.length} Skills
                      </Badge>
                      {repo.totalStars > 0 && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Star className="size-3" />
                          {formatNumber(repo.totalStars)}
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="mt-1 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </div>
                {repo.description && (
                  <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">
                    {repo.description}
                  </p>
                )}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {topSkills.map((sk) => (
                    <span
                      key={sk.id}
                      className="rounded-md bg-muted px-2 py-0.5 text-xs"
                    >
                      {sk.nameZh ?? sk.name}
                    </span>
                  ))}
                  {repo.skills.length > 4 && (
                    <span className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                      +{repo.skills.length - 4}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}

/**
 * Repo detail view: all skills in a specific repo
 */
interface SkillsRepoDetailProps {
  repo: string;
  q: string;
  category: string;
}

export async function SkillsRepoDetail({
  repo,
  q,
  category,
}: SkillsRepoDetailProps) {
  const { skills } = await getSkillsWithCount({
    limit: 500,
    offset: 0,
    category: category || undefined,
    search: q || undefined,
  });

  const repos = groupByRepo(skills);
  const current = repos.find((r) => r.repo === repo);

  if (!current) {
    return (
      <div className="flex flex-col items-center py-12 text-center">
        <FolderSearch className="mb-4 size-12 text-gray-300 dark:text-gray-600" />
        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">未找到该仓库</h3>
        <p className="mt-1 max-w-[40ch] text-sm text-gray-600 dark:text-gray-400">该仓库可能已被移除或地址有误，请返回仓库列表重新浏览。</p>
        <Button variant="outline" className="mt-4" asChild>
          <Link href="/skills">返回仓库列表</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mt-6">
      {/* Repo header */}
      <div className="mb-6 rounded-lg bg-gray-950/[0.025] p-4 dark:bg-gray-50/[0.025]">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="h-7 px-2" asChild>
                <Link href="/skills">
                  <ArrowLeft className="size-3.5" />
                </Link>
              </Button>
              <a
                href={current.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-lg font-semibold hover:text-primary"
              >
                <Github className="size-5" />
                {current.org}/{current.repoName}
              </a>
              {current.isOfficial && (
                <Badge
                  variant="secondary"
                  className="border-blue-200 bg-blue-50 text-blue-600 text-xs dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300"
                >
                  官方
                </Badge>
              )}
            </div>
            {current.description && (
              <p className="mt-2 text-sm text-muted-foreground">
                {current.description}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            {current.totalStars > 0 && (
              <span className="flex items-center gap-1">
                <Star className="size-3.5" />
                {formatNumber(current.totalStars)}
              </span>
            )}
            <span>{current.skills.length} Skills</span>
          </div>
        </div>
        {/* Install all */}
        <div className="mt-3 rounded-md bg-background p-3">
          <p className="mb-1 text-xs text-muted-foreground">
            安装整个仓库（包含所有 Skills）
          </p>
          <code className="text-sm">
            claude skill add --url github.com/{current.repo}
          </code>
        </div>
      </div>

      {/* Skills grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {current.skills.map((skill) => (
          <SkillCard key={skill.id} skill={skill} />
        ))}
      </div>
    </div>
  );
}
