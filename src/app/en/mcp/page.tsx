import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { BreadcrumbJsonLd } from "@/components/shared/json-ld";
import { CopyButton } from "@/components/shared/copy-button";
import { siteConfig } from "@/lib/constants";
import { mcpServers } from "@/data/mcp-servers";

export const metadata: Metadata = {
  title: "MCP Servers Directory",
  description:
    "Curated collection of high-quality MCP (Model Context Protocol) servers. Connect AI agents to filesystems, databases, APIs, and more.",
  alternates: {
    canonical: `${siteConfig.url}/en/mcp`,
    languages: {
      "zh-CN": `${siteConfig.url}/mcp`,
      en: `${siteConfig.url}/en/mcp`,
    },
  },
};

export default function EnMCPPage() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", href: "/en" },
          { name: "MCP Servers", href: "/en/mcp" },
        ]}
      />
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          MCP Servers Directory
        </h1>
        <p className="mt-2 text-muted-foreground">
          {mcpServers.length} curated Model Context Protocol servers.{" "}
          <Link href="/mcp" className="text-primary hover:underline">
            View Chinese version
          </Link>
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {mcpServers.map((server) => (
            <div
              key={server.slug}
              id={server.slug}
              className="rounded-lg border border-border/40 bg-card p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <h2 className="font-semibold">{server.name}</h2>
                <Badge variant="outline" className="shrink-0 text-xs">
                  {server.category}
                </Badge>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                by {server.author}
              </p>
              <p className="mt-2 text-sm text-foreground/80">
                {server.description}
              </p>
              <div className="mt-3 flex items-center gap-2">
                <code className="flex-1 truncate rounded bg-muted px-2 py-1 text-xs">
                  {server.installCommand}
                </code>
                <CopyButton text={server.installCommand} />
              </div>
              <div className="mt-2 flex gap-2">
                <a
                  href={server.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline"
                >
                  GitHub
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
