"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, ArrowRight, Check } from "lucide-react";

export function InlineNewsletterCta() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    // TODO: integrate with Resend API
    setSubmitted(true);
  }

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
          {submitted ? (
            <div className="mt-3 flex items-center gap-2 text-sm font-medium text-safe">
              <Check className="size-4" />
              订阅成功！请查看邮箱确认。
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-3 flex gap-2">
              <Input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-9 max-w-xs"
              />
              <Button type="submit" size="sm" className="h-9 shrink-0">
                订阅
                <ArrowRight className="ml-1 size-3.5" />
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
