import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Compass } from "lucide-react";
import { HeroSearch } from "./hero-search";
import { getSkillsCount, getMcpServersCount } from "@/lib/data";

// Format total as friendly string: 5481 → "5,400+"
function formatTotal(n: number): string {
  if (n >= 1000) {
    const hundreds = Math.floor(n / 100) * 100;
    return `${hundreds.toLocaleString("en-US")}+`;
  }
  return String(n);
}

export async function HeroSection() {
  const [skillsCount, mcpCount] = await Promise.all([
    getSkillsCount(),
    getMcpServersCount(),
  ]);
  const totalCount = formatTotal(skillsCount + mcpCount);
  return (
    <section className="relative overflow-hidden py-20 sm:py-28">
      {/* Subtle gradient background */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/40 bg-muted/50 px-4 py-1.5 text-sm text-muted-foreground">
            <Compass className="size-4 text-primary" />
            Skills · MCP · 实战资讯
          </div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            中文开发者的
            <br />
            <span className="text-primary">AI 工具生态指南</span>
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
            {totalCount} AI 开发工具收录 · 每日更新
          </p>
          <div className="mt-8">
            <HeroSearch />
          </div>
          <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Button size="lg" className="w-full sm:w-auto" asChild>
              <Link href="/skills">
                浏览工具
                <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="w-full sm:w-auto"
              asChild
            >
              <Link href="/weekly">阅读周刊</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
