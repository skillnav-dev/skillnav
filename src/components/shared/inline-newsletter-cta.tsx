import Link from "next/link";
import { Rss } from "lucide-react";
import { siteConfig } from "@/lib/constants";

export function InlineNewsletterCta() {
  return (
    <div className="rounded-lg border border-border/40 bg-primary/5 px-6 py-6">
      <div className="flex items-start gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <Rss className="size-4 text-primary" />
        </div>
        <div className="flex-1">
          <p className="font-medium">获取每周 AI 工具精选</p>
          <p className="mt-1 text-sm text-muted-foreground">
            工具推荐、实战教程和生态洞察，每周更新。
          </p>
          <div className="mt-3 flex items-center gap-3">
            <a
              href={siteConfig.links.twitter}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-primary hover:underline"
            >
              关注 @skillnav_dev →
            </a>
            <Link
              href="/weekly"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              阅读周刊
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
