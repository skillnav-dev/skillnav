"use client";

import { useState } from "react";
import { Check, Copy, Terminal } from "lucide-react";

interface SkillInstallProps {
  installCommand?: string;
  requiresEnv?: string[];
  requiresBins?: string[];
  githubUrl?: string;
}

/** Small client component that copies text to clipboard with check animation */
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: ignore clipboard errors silently
    }
  }

  return (
    <button
      onClick={handleCopy}
      aria-label="复制命令"
      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
    >
      {copied ? (
        <Check className="size-3.5 text-green-500" />
      ) : (
        <Copy className="size-3.5" />
      )}
    </button>
  );
}

export function SkillInstall({
  installCommand,
  requiresEnv,
  requiresBins,
  githubUrl,
}: SkillInstallProps) {
  // Derive a fallback command from githubUrl when no installCommand provided
  const command =
    installCommand ?? (githubUrl ? `git clone ${githubUrl}` : null);

  const hasEnv = requiresEnv && requiresEnv.length > 0;
  const hasBins = requiresBins && requiresBins.length > 0;

  // Render nothing if there is no useful content to display
  if (!command && !hasEnv && !hasBins) return null;

  return (
    <div className="rounded-lg border border-border/50 bg-card p-6">
      <div className="mb-4 flex items-center gap-2">
        <Terminal className="size-4 text-muted-foreground" />
        <h2 className="text-lg font-semibold">安装</h2>
      </div>

      {/* Install command block */}
      {command && (
        <div className="mb-4">
          <p className="mb-2 text-xs text-muted-foreground">安装命令</p>
          <div className="flex items-center justify-between gap-2 rounded-md bg-muted px-4 py-3">
            <code className="flex-1 overflow-x-auto font-mono text-sm">
              {command}
            </code>
            <CopyButton text={command} />
          </div>
        </div>
      )}

      {/* Dependencies section */}
      {(hasEnv || hasBins) && (
        <div className="space-y-3 pt-2">
          {/* Required environment variables */}
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

          {/* Required binaries / CLI tools */}
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
