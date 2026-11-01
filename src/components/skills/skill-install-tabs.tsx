"use client";

import { useState } from "react";
import { Terminal } from "lucide-react";
import { cn } from "@/lib/utils";
import { trackEvent } from "@/lib/track";
import { buildSkillInstallTabs, parseSkillSource } from "@/lib/skill-install";
import { CopyButton } from "@/components/shared/copy-button";

interface SkillInstallTabsProps {
  installCommand?: string;
  requiresEnv?: string[];
  requiresBins?: string[];
  githubUrl?: string;
  platform?: string[];
  skillName?: string;
}

export function SkillInstallTabs({
  installCommand,
  requiresEnv,
  requiresBins,
  githubUrl,
  skillName,
}: SkillInstallTabsProps) {
  const tabs = buildSkillInstallTabs(githubUrl, installCommand);
  const source = parseSkillSource(githubUrl);
  const folder = source?.folder ?? skillName ?? "skill-name";
  const [activeTab, setActiveTab] = useState(tabs[0]?.id ?? "");

  const hasEnv = requiresEnv && requiresEnv.length > 0;
  const hasBins = requiresBins && requiresBins.length > 0;

  const activeCommand = tabs.find((t) => t.id === activeTab)?.command ?? "";

  return (
    <div className="rounded-xl ring-1 ring-gray-950/10 bg-card p-6 dark:ring-gray-50/10">
      <div className="mb-4 flex items-center gap-2">
        <Terminal className="size-4 text-muted-foreground" />
        <h2 className="text-lg font-semibold">安装</h2>
      </div>

      {/* Tab buttons */}
      {tabs.length > 1 && (
        <div className="mb-3 flex gap-1 overflow-x-auto rounded-md bg-muted p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "rounded-sm px-3 py-1.5 text-xs font-medium transition-colors",
                activeTab === tab.id
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Command block */}
      {activeCommand && (
        <div className="mb-4 space-y-2">
          <div className="flex items-center justify-between gap-2 rounded-md bg-muted px-4 py-3">
            <code className="flex-1 overflow-x-auto font-mono text-xs sm:text-sm">
              {activeCommand}
            </code>
            <CopyButton
              text={activeCommand}
              onCopy={() =>
                trackEvent("install-copy", {
                  type: "skill",
                  slug: skillName ?? "",
                  client: activeTab,
                })
              }
            />
          </div>
          {source && (
            <p className="text-xs text-muted-foreground">
              默认装到当前项目，加 <code className="font-mono">-g</code>{" "}
              装到全局。也可以手动安装：把
              {source.path ? (
                <>
                  仓库里的 <code className="font-mono">{source.path}</code>{" "}
                  文件夹
                </>
              ) : (
                "仓库根目录（含 SKILL.md）"
              )}
              复制到{" "}
              <code className="font-mono">~/.claude/skills/{folder}/</code>。
            </p>
          )}
        </div>
      )}
      {!activeCommand && (
        <p className="mb-4 text-sm text-muted-foreground">
          暂无可用的安装命令，请前往源仓库查看安装说明。
        </p>
      )}

      {/* Dependencies section */}
      {(hasEnv || hasBins) && (
        <div className="space-y-3 pt-2">
          {hasEnv && (
            <div>
              <p className="mb-1.5 text-xs font-medium text-muted-foreground">
                必需环境变量
              </p>
              <div className="flex flex-wrap gap-1.5">
                {requiresEnv!.map((env) => (
                  <code
                    key={env}
                    className="rounded-md bg-muted px-2 py-0.5 font-mono text-xs"
                  >
                    {env}
                  </code>
                ))}
              </div>
            </div>
          )}
          {hasBins && (
            <div>
              <p className="mb-1.5 text-xs font-medium text-muted-foreground">
                必需命令行工具
              </p>
              <div className="flex flex-wrap gap-1.5">
                {requiresBins!.map((bin) => (
                  <code
                    key={bin}
                    className="rounded-md bg-muted px-2 py-0.5 font-mono text-xs"
                  >
                    {bin}
                  </code>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
