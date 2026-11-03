"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink } from "lucide-react";
import {
  hackerAgainLanguageLabel,
  type HackerAgainSite,
} from "@/data/hackeragain-sites";

interface HackerAgainCardProps {
  site: HackerAgainSite;
}

export function HackerAgainCard({ site }: HackerAgainCardProps) {
  return (
    <Card className="group h-full transition-shadow hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-semibold">
                <a
                  href={site.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                >
                  {site.nameZh}
                </a>
              </h3>
              {site.hasMcp && (
                <Badge
                  variant="secondary"
                  className="border-violet-200 bg-violet-50 text-violet-700 text-xs dark:border-violet-800 dark:bg-violet-950 dark:text-violet-300"
                >
                  MCP
                </Badge>
              )}
              {site.hasDataset && (
                <Badge
                  variant="secondary"
                  className="border-sky-200 bg-sky-50 text-sky-700 text-xs dark:border-sky-800 dark:bg-sky-950 dark:text-sky-300"
                >
                  数据包
                </Badge>
              )}
            </div>
            {site.nameEn && site.nameEn !== site.nameZh && (
              <p className="mt-0.5 text-xs text-muted-foreground">
                {site.nameEn}
              </p>
            )}
          </div>
          <a
            href={site.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`打开 ${site.nameZh}`}
            className="shrink-0 text-muted-foreground"
          >
            <ExternalLink className="size-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
          </a>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="line-clamp-3 text-sm text-muted-foreground">
          {site.blurbZh}
        </p>

        {(site.licenseNote || site.complianceNote) && (
          <p className="text-xs leading-relaxed text-muted-foreground/80">
            {site.complianceNote || site.licenseNote}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant="secondary" className="text-xs">
            {site.category}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {hackerAgainLanguageLabel(site.language)}
          </span>
          {site.secondaryUrl && (
            <a
              href={site.secondaryUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-muted-foreground underline-offset-2 hover:text-primary hover:underline"
            >
              备链
            </a>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
