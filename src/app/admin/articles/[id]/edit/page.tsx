import { notFound } from "next/navigation";
import { getAdminArticleById } from "@/lib/data/admin";
import { ArticleEditor } from "@/components/admin/article-editor";
import { requireAdmin } from "@/lib/admin-auth";

export default async function EditArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const article = await getAdminArticleById(id);

  if (!article) notFound();

  return <ArticleEditor article={article} />;
}
