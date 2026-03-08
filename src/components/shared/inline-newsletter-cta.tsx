import { Mail, Clock } from "lucide-react";

export function InlineNewsletterCta() {
  return (
    <div className="rounded-lg border border-border/40 bg-primary/5 px-6 py-6">
      <div className="flex items-start gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <Mail className="size-4 text-primary" />
        </div>
        <div className="flex-1">
          <p className="font-medium">每周精选 AI 工具资讯，直达收件箱</p>
          <p className="mt-1 text-sm text-muted-foreground">
            精选工具推荐、实战教程和生态洞察，无垃圾邮件。
          </p>
          <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="size-3.5" />
            邮件订阅即将推出，敬请期待
          </div>
        </div>
      </div>
    </div>
  );
}
