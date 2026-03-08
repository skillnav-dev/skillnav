"use client";

import { useState } from "react";
import { Terminal } from "lucide-react";
import { cn } from "@/lib/utils";
import { CopyButton } from "@/components/shared/copy-button";

interface SkillInstallTabsProps {
  installCommand?: string;
  requiresEnv?: string[];
  requiresBins?: string[];
  githubUrl?: string;
  platform?: string[];
  skillName?: string;
}

interface TabDef {
  id: string;
  label: string;
  command: string;
}

function buildTabs(
  platform: string[],
  installCommand?: string,
  githubUrl?: string,
  skillName?: string,
): TabDef[] {
  const tabs: TabDef[] = [];
  const fallback = githubUrl ? `git clone ${githubUrl}` : "";
  const name = skillName || "skill";

  if (platform.includes("claude")) {
    tabs.push({
      id: "claude",
      label: "Claude Code",
      command: installCommand || fallback || `claude skill add ${name}`,
    });
  }

  if (platform.includes("codex")) {
    tabs.push({
      id: "codex",
      label: "Codex",
      command: installCommand || fallback || `codex skill add ${name}`,
    });
  }

  // Always show a generic tab if there are any commands
  if (tabs.length === 0 && (installCommand || fallback)) {
    tabs.push({
      id: "generic",
      label: "安装",
      command: installCommand || fallback,
    });
  }

  return tabs;
}

export function SkillInstallTabs({
  installCommand,
  requiresEnv,
  requiresBins,
  githubUrl,
  platform,
  skillName,
}: SkillInstallTabsProps) {
  const tabs = buildTabs(platform ?? [], installCommand, githubUrl, skillName);
  const [activeTab, setActiveTab] = useState(tabs[0]?.id ?? "");

  const hasEnv = requiresEnv && requiresEnv.length > 0;
  const hasBins = requiresBins && requiresBins.length > 0;

  if (tabs.length === 0 && !hasEnv && !hasBins) return null;

  const activeCommand = tabs.find((t) => t.id === activeTab)?.command ?? "";

  return (
    <div className="rounded-lg border border-border/40 bg-card p-6">
      <div className="mb-4 flex items-center gap-2">
        <Terminal className="size-4 text-muted-foreground" />
        <h2 className="text-lg font-semibold">安装</h2>
      </div>

      {/* Tab buttons */}
      {tabs.length > 1 && (
        <div className="mb-3 flex gap-1 rounded-md bg-muted p-1">
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
        <div className="mb-4">
          {tabs.length <= 1 && (
            <p className="mb-2 text-xs text-muted-foreground">安装命令</p>
          )}
          <div className="flex items-center justify-between gap-2 rounded-md bg-muted px-4 py-3">
            <code className="flex-1 overflow-x-auto font-mono text-sm">
              {activeCommand}
            </code>
            <CopyButton text={activeCommand} />
          </div>
        </div>
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
