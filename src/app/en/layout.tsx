import type { Metadata } from "next";
import { siteConfig } from "@/lib/constants";

export const metadata: Metadata = {
  title: {
    default: "SkillNav — AI Agent Tools Directory",
    template: `%s | ${siteConfig.name}`,
  },
  description:
    "Curated directory of AI agent tools — Claude Code Skills, MCP Servers, and open-source projects.",
  openGraph: {
    locale: "en_US",
  },
};

export default function EnLayout({ children }: { children: React.ReactNode }) {
  return <div lang="en">{children}</div>;
}
