import { SearchX } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface ArticlesEmptyProps {
  search?: string;
  category?: string;
}

export function ArticlesEmpty({ search, category }: ArticlesEmptyProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <SearchX className="mb-4 size-10 text-muted-foreground/50" />
      <h3 className="text-lg font-semibold">未找到匹配的文章</h3>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        {search && category
          ? `没有找到分类为「${category}」且包含「${search}」的文章。`
          : search
            ? `没有找到包含「${search}」的文章。`
            : `没有找到分类为「${category}」的文章。`}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        试试其他关键词或浏览全部文章
      </p>
      <Button variant="outline" className="mt-6" asChild>
        <Link href="/articles">浏览全部文章</Link>
      </Button>
    </div>
  );
}
