"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "next-themes";

const GISCUS_CONFIG = {
  repo: "skillnav-dev/discussions" as `${string}/${string}`,
  repoId: "R_kgDORhTuFw",
  category: "General",
  categoryId: "DIC_kwDORhTuF84C37gL",
};

export function SkillComments() {
  const ref = useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    if (!ref.current || !GISCUS_CONFIG.repoId) return;

    // Remove existing iframe if re-rendering
    const existing = ref.current.querySelector("iframe.giscus-frame");
    if (existing) existing.remove();

    const script = document.createElement("script");
    script.src = "https://giscus.app/client.js";
    script.setAttribute("data-repo", GISCUS_CONFIG.repo);
    script.setAttribute("data-repo-id", GISCUS_CONFIG.repoId);
    script.setAttribute("data-category", GISCUS_CONFIG.category);
    script.setAttribute("data-category-id", GISCUS_CONFIG.categoryId);
    script.setAttribute("data-mapping", "pathname");
    script.setAttribute("data-strict", "0");
    script.setAttribute("data-reactions-enabled", "1");
    script.setAttribute("data-emit-metadata", "0");
    script.setAttribute("data-input-position", "top");
    script.setAttribute(
      "data-theme",
      resolvedTheme === "dark" ? "dark" : "light",
    );
    script.setAttribute("data-lang", "zh-CN");
    script.setAttribute("crossorigin", "anonymous");
    script.async = true;

    ref.current.appendChild(script);

    return () => {
      script.remove();
    };
  }, [resolvedTheme]);

  // Don't render if giscus is not configured yet
  if (!GISCUS_CONFIG.repoId) return null;

  return (
    <div className="rounded-lg border border-border/40 bg-card p-6">
      <h2 className="mb-4 text-lg font-semibold">评论</h2>
      <div ref={ref} />
    </div>
  );
}
