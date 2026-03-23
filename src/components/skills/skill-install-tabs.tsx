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

/**
 * Derive the owner/repo slug from a GitHub URL.
 * e.g. "https://github.com/anthropics/skill-foo" -> "anthropics/skill-foo"
 */
function ownerRepoFromUrl(url: string): string | null {
  try {
    const { pathname } = new URL(url);
    const parts = pathname
      .replace(/^\//, "")
      .replace(/\.git$/, "")
      .split("/");
    if (parts.length >= 2) return `${parts[0]}/${parts[1]}`;
  } catch {
    // ignore
  }
  return null;
}

/**
 * Build a Claude Code install command from available data.
 */
function claudeCommand(
  installCommand?: string,
  githubUrl?: string,
  skillName?: string,
): string {
  if (installCommand) return installCommand;
  if (githubUrl) {
    const slug = ownerRepoFromUrl(githubUrl);
    if (slug) return `claude skill add --url https://github.com/${slug}`;
  }
  return `claude skill add ${skillName || "skill"}`;
}

/**
 * Transform a Claude Code command into the equivalent for another CLI.
 */
function transformCommand(claudeCmd: string, targetPrefix: string): string {
  // Replace "claude skill add" / "claude skill install" variants
  return claudeCmd.replace(/^claude\s+skill\s+(add|install)/, targetPrefix);
}

function buildTabs(
  installCommand?: string,
  githubUrl?: string,
  skillName?: string,
): TabDef[] {
  const base = claudeCommand(installCommand, githubUrl, skillName);

  return [
    {
      id: "claude",
      label: "Claude Code",
      command: base,
    },
    {
      id: "codex",
      label: "Codex CLI",
      command: transformCommand(base, "codex skill install"),
    },
    {
      id: "gemini",
      label: "Gemini CLI",
      command: transformCommand(base, "gemini skill add"),
    },
  ];
}

export function SkillInstallTabs({
  installCommand,
  requiresEnv,
  requiresBins,
  githubUrl,
  skillName,
}: SkillInstallTabsProps) {
  const tabs = buildTabs(installCommand, githubUrl, skillName);
  const [activeTab, setActiveTab] = useState(tabs[0].id);

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

      {/* Command block */}
      {activeCommand && (
        <div className="mb-4">
          <div className="flex items-center justify-between gap-2 rounded-md bg-muted px-4 py-3">
            <code className="flex-1 overflow-x-auto font-mono text-xs sm:text-sm">
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
