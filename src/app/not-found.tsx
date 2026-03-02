import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <h1 className="text-7xl font-bold text-primary/20">404</h1>
      <h2 className="mt-4 text-2xl font-bold">页面未找到</h2>
      <p className="mt-2 text-muted-foreground">
        你访问的页面不存在或已被移除。
      </p>
      <Button asChild className="mt-6">
        <Link href="/">
          <Home className="mr-2 size-4" />
          返回首页
        </Link>
      </Button>
    </div>
  );
}
