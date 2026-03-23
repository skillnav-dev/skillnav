import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getArticleStats, getSkillStats, getMcpStats } from "@/lib/data/admin";
import { requireAdmin } from "@/lib/admin-auth";

export default async function AdminDashboardPage() {
  await requireAdmin();
  const [articleStats, skillStats, mcpStats] = await Promise.all([
    getArticleStats(),
    getSkillStats(),
    getMcpStats(),
  ]);

  const articleCards = [
    { title: "总文章数", value: articleStats.total },
    { title: "已发布", value: articleStats.published },
    { title: "草稿", value: articleStats.draft },
    { title: "已隐藏", value: articleStats.hidden },
  ];

  const skillCards = [
    { title: "总 Skill 数", value: skillStats.total },
    { title: "已发布", value: skillStats.published },
    { title: "草稿", value: skillStats.draft },
    { title: "已隐藏", value: skillStats.hidden },
  ];

  const mcpCards = [
    { title: "总 MCP 数", value: mcpStats.total },
    { title: "已发布", value: mcpStats.published },
    { title: "草稿", value: mcpStats.draft },
    { title: "已隐藏", value: mcpStats.hidden },
  ];

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>

      {/* Articles section */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">文章</h2>
          <Link
            href="/admin/articles"
            className="text-sm text-primary hover:underline"
          >
            管理文章
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {articleCards.map((card) => (
            <Card key={card.title}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {card.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold tracking-tight">{card.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Skills section */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Skills</h2>
          <Link
            href="/admin/skills"
            className="text-sm text-primary hover:underline"
          >
            管理 Skills
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {skillCards.map((card) => (
            <Card key={card.title}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {card.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold tracking-tight">{card.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* MCP section */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">MCP Servers</h2>
          <Link
            href="/admin/mcp"
            className="text-sm text-primary hover:underline"
          >
            管理 MCP
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {mcpCards.map((card) => (
            <Card key={card.title}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {card.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold tracking-tight">{card.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
