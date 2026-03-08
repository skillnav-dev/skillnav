import type { Metadata } from "next";
import { SectionHeader } from "@/components/shared/section-header";
import { BreadcrumbJsonLd } from "@/components/shared/json-ld";
import { GitHubGrid } from "@/components/github/github-grid";

export const metadata: Metadata = {
  title: "AI Agent 开源项目精选导航",
  description:
    "精选 50+ AI Agent 生态核心开源项目，涵盖 Agent 框架、AI 编码、应用平台、RAG、模型推理等方向，中文点评。",
};

export default function GitHubPage() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "首页", href: "/" },
          { name: "GitHub 项目", href: "/github" },
        ]}
      />
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <SectionHeader
          as="h1"
          title="AI Agent 开源项目精选"
          description="精选 AI Agent 生态核心开源项目，中文介绍 + 编辑点评，助你快速找到合适的工具"
        />
        <GitHubGrid />
      </div>
    </>
  );
}
