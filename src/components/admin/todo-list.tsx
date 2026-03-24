import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TodoSummary } from "@/lib/data/admin";

interface TodoListProps {
  todos: TodoSummary;
}

export function TodoList({ todos }: TodoListProps) {
  const hasItems = todos.pendingBriefs > 0 || todos.recentDraftArticles > 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          今日待办
        </CardTitle>
      </CardHeader>
      <CardContent>
        {hasItems ? (
          <div className="space-y-3">
            {todos.pendingBriefs > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-sm">待审核日报</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">
                    {todos.pendingBriefs}
                  </span>
                  <Link
                    href="/admin/daily"
                    className="text-xs text-primary hover:underline"
                  >
                    查看
                  </Link>
                </div>
              </div>
            )}
            {todos.recentDraftArticles > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-sm">近期待复核文章</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">
                    {todos.recentDraftArticles}
                  </span>
                  <Link
                    href="/admin/articles?status=draft"
                    className="text-xs text-primary hover:underline"
                  >
                    查看
                  </Link>
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">今日无待办</p>
        )}
      </CardContent>
    </Card>
  );
}
