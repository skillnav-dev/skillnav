import Link from "next/link";
import { Rss } from "lucide-react";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/lib/constants";

export function NewsletterCta() {
  return (
    <section className="py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="rounded-2xl bg-primary/5 px-6 py-12 sm:px-12">
          <div className="mx-auto max-w-xl text-center">
            <div className="mb-4 inline-flex items-center justify-center rounded-full bg-primary/10 p-3">
              <Rss className="size-6 text-primary" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              获取 AI 工具动态
            </h2>
            <p className="mt-3 text-muted-foreground">
              每周精选 AI Agent 工具推荐、实战教程和生态洞察。
            </p>
            <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Button asChild>
                <a
                  href={siteConfig.links.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  关注 @skillnav_dev
                </a>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/weekly">阅读周刊</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
