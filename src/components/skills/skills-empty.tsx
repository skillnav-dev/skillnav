import { SearchX } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface SkillsEmptyProps {
  search?: string;
  category?: string;
}

export function SkillsEmpty({ search, category }: SkillsEmptyProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <SearchX className="mb-4 size-10 text-muted-foreground/50" />
      <h3 className="text-lg font-semibold">未找到匹配的 Skills</h3>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        {search && category
          ? `没有找到分类为「${category}」且包含「${search}」的 Skills。`
          : search
            ? `没有找到包含「${search}」的 Skills。`
            : `没有找到分类为「${category}」的 Skills。`}
      </p>
      <Button variant="outline" className="mt-6" asChild>
        <Link href="/skills">清除筛选</Link>
      </Button>
    </div>
  );
}
