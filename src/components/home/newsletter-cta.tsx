import { Mail, Clock } from "lucide-react";

export function NewsletterCta() {
  return (
    <section className="py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="rounded-2xl bg-primary/5 px-6 py-12 sm:px-12">
          <div className="mx-auto max-w-xl text-center">
            <div className="mb-4 inline-flex items-center justify-center rounded-full bg-primary/10 p-3">
              <Mail className="size-6 text-primary" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              订阅 AI 工具周刊
            </h2>
            <p className="mt-3 text-muted-foreground">
              每周精选 AI 工具推荐、实战教程和生态洞察，直达你的收件箱。
            </p>
            <div className="mt-6 flex items-center justify-center gap-2 text-sm font-medium text-muted-foreground">
              <Clock className="size-4" />
              邮件订阅即将推出，敬请期待
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              无垃圾邮件，随时退订。
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
