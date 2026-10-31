import type { Metadata } from "next";
import { BreadcrumbJsonLd, FAQJsonLd } from "@/components/shared/json-ld";
import { siteConfig } from "@/lib/constants";
import { grokBotFaqs } from "@/data/grok-bot";
import { GrokBotHero } from "@/components/grok-bot/grok-bot-hero";
import { GrokBotCapabilities } from "@/components/grok-bot/grok-bot-capabilities";
import { GrokBotGetStarted } from "@/components/grok-bot/grok-bot-get-started";
import { GrokBotCompare } from "@/components/grok-bot/grok-bot-compare";
import {
  GrokBotFaq,
  GrokBotResources,
} from "@/components/grok-bot/grok-bot-resources";

export const metadata: Metadata = {
  title: "Grok Bot 中文导航：xAI 桌面 Agent 上手指南",
  description:
    "Grok Bot 是 xAI 推出的通用工作 Agent，每个 bot 自带云电脑，支持定时/事件触发、多 bot 协作、MCP 和 Skills。中文整理核心能力、上手步骤、落地场景与教程。",
  openGraph: {
    title: "Grok Bot 中文导航 | SkillNav",
    description:
      "xAI Grok Bot 中文上手指南：核心能力、套餐、落地场景、和 MCP / Skills 的关系。",
    url: `${siteConfig.url}/grok-bot`,
  },
  alternates: {
    canonical: `${siteConfig.url}/grok-bot`,
  },
};

export default function GrokBotPage() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "首页", href: "/" },
          { name: "Grok Bot", href: "/grok-bot" },
        ]}
      />
      <FAQJsonLd questions={grokBotFaqs} />
      <div className="mx-auto max-w-6xl space-y-16 px-4 py-12 sm:px-6">
        <GrokBotHero />
        <GrokBotCapabilities />
        <GrokBotGetStarted />
        <GrokBotCompare />
        <GrokBotResources />
        <GrokBotFaq />
      </div>
    </>
  );
}
