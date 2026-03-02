import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Compass } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden py-20 sm:py-28">
      {/* Subtle gradient background */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/60 bg-muted/50 px-4 py-1.5 text-sm text-muted-foreground">
            <Compass className="size-4 text-primary" />
            中文世界的 AI Skills 导航
          </div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            发现最好用的
            <br />
            <span className="text-primary">AI Agent Skills</span>
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
            探索、评估、管理 AI Agent
            技能。帮你找到最安全、最高效的 Skills，让 AI 真正为你所用。
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Button size="lg" className="w-full sm:w-auto" asChild>
              <Link href="/skills">
                浏览 Skills
                <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="w-full sm:w-auto"
              asChild
            >
              <Link href="/articles">最新资讯</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
