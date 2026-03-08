"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, ExternalLink } from "lucide-react";
import { formatNumber } from "@/lib/utils";
import type { GitHubProject } from "@/data/github-projects";

interface GitHubCardProps {
  project: GitHubProject;
}

export function GitHubCard({ project }: GitHubCardProps) {
  return (
    <a
      href={`https://github.com/${project.repo}`}
      target="_blank"
      rel="noopener noreferrer"
      className="block"
    >
      <Card className="group h-full transition-shadow hover:shadow-md">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold">{project.name}</h3>
                {project.editorPick && (
                  <Badge
                    variant="secondary"
                    className="border-amber-200 bg-amber-50 text-amber-700 text-xs dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300"
                  >
                    推荐
                  </Badge>
                )}
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {project.repo}
              </p>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Star className="size-3.5" />
              <span className="font-medium">{formatNumber(project.stars)}</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="line-clamp-3 text-sm text-muted-foreground">
            {project.descriptionZh}
          </p>

          {project.editorComment && (
            <p className="text-xs italic text-muted-foreground/80">
              &ldquo;{project.editorComment}&rdquo;
            </p>
          )}

          <div className="flex items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge variant="secondary" className="text-xs">
                {project.category}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {project.language}
              </span>
              {project.license && (
                <span className="text-xs text-muted-foreground">
                  {project.license}
                </span>
              )}
            </div>
            <ExternalLink className="size-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
          </div>
        </CardContent>
      </Card>
    </a>
  );
}
