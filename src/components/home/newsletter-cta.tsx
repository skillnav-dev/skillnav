"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, ArrowRight, Check } from "lucide-react";

export function NewsletterCta() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    // TODO: integrate with Resend API
    setSubmitted(true);
  }

  return (
    <section className="py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="rounded-2xl bg-primary/5 px-6 py-12 sm:px-12">
          <div className="mx-auto max-w-xl text-center">
            <div className="mb-4 inline-flex items-center justify-center rounded-full bg-primary/10 p-3">
              <Mail className="size-6 text-primary" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              订阅 AI Skills 周报
            </h2>
            <p className="mt-3 text-muted-foreground">
              每周精选最新 Skills
              动态、安全报告和开发者资源，直达你的收件箱。
            </p>
            {submitted ? (
              <div className="mt-6 flex items-center justify-center gap-2 text-sm font-medium text-safe">
                <Check className="size-4" />
                订阅成功！请查看邮箱确认。
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-center"
              >
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11 sm:w-72"
                />
                <Button type="submit" size="lg" className="h-11">
                  订阅
                  <ArrowRight className="ml-1 size-4" />
                </Button>
              </form>
            )}
            <p className="mt-3 text-xs text-muted-foreground">
              无垃圾邮件，随时退订。
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
