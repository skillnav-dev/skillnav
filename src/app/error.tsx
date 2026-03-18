"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { RefreshCw, Home } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <h1 className="text-7xl font-bold text-primary/20">500</h1>
      <h2 className="mt-4 text-2xl font-bold">出了点问题</h2>
      <p className="mt-2 text-muted-foreground">
        页面加载时遇到错误，请稍后重试。
      </p>
      <div className="mt-6 flex gap-3">
        <Button onClick={reset} variant="outline">
          <RefreshCw className="mr-2 size-4" />
          重试
        </Button>
        <Button asChild>
          <Link href="/">
            <Home className="mr-2 size-4" />
            返回首页
          </Link>
        </Button>
      </div>
    </div>
  );
}
