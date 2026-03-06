import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getArticleStats } from "@/lib/data/admin";
import { requireAdmin } from "@/lib/admin-auth";

export default async function AdminDashboardPage() {
  await requireAdmin();
  const stats = await getArticleStats();

  const cards = [
    { title: "总文章数", value: stats.total },
    { title: "已发布", value: stats.published },
    { title: "草稿", value: stats.draft },
    { title: "已隐藏", value: stats.hidden },
  ];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Dashboard</h1>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{card.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
