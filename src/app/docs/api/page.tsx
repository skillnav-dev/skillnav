import type { Metadata } from "next";
import Link from "next/link";
import { SectionHeader } from "@/components/shared/section-header";
import { BreadcrumbJsonLd } from "@/components/shared/json-ld";
import { PageBreadcrumb } from "@/components/shared/page-breadcrumb";
import { ApiTypeCard } from "@/components/docs/api-type-card";
import { API_ENDPOINT, API_NOTES, API_TYPES } from "@/data/public-api";
import { siteConfig } from "@/lib/constants";

export const metadata: Metadata = {
  title: "公开 API",
  description:
    "SkillNav 公开查询 API：免密钥搜索精选 MCP Server、Skills、日报和论文导读。Public read-only API for curated AI agent tools.",
  alternates: { canonical: `${siteConfig.url}/docs/api` },
  openGraph: {
    title: "公开 API | SkillNav",
    description: "免密钥搜索精选 MCP Server、Skills、日报和论文导读。",
    url: `${siteConfig.url}/docs/api`,
  },
};

export default function ApiDocsPage() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "首页", href: "/" },
          { name: "公开 API", href: "/docs/api" },
        ]}
      />
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <PageBreadcrumb
          items={[{ label: "首页", href: "/" }, { label: "公开 API" }]}
        />
        <SectionHeader
          as="h1"
          title="公开 API · Public API"
          description="一个只读接口，查询 SkillNav 精选的 MCP Server、Skills、日报和论文。SkillNav Skill 在 Agent 里用的也是它。"
        />

        <div className="mt-8 rounded-xl bg-muted/30 p-6 ring-1 ring-border/60">
          <code className="break-all font-mono text-sm">
            GET {API_ENDPOINT}?type=&lt;type&gt;&amp;…
          </code>
          <ul className="mt-4 space-y-1.5 text-sm">
            {API_NOTES.zh.map((note, i) => (
              <li key={note}>
                {note}
                <span className="block text-xs text-muted-foreground">
                  {API_NOTES.en[i]}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-muted-foreground">
            给 LLM 读的版本见{" "}
            <Link href="/llms.txt" className="text-primary hover:underline">
              /llms.txt
            </Link>
            。
          </p>
        </div>

        <div className="mt-8 space-y-6">
          {API_TYPES.map((api) => (
            <ApiTypeCard key={api.type} api={api} />
          ))}
        </div>
      </div>
    </>
  );
}
