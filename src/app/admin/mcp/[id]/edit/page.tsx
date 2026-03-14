import { notFound } from "next/navigation";
import { getAdminMcpById } from "@/lib/data/admin";
import { McpEditor } from "@/components/admin/mcp-editor";
import { requireAdmin } from "@/lib/admin-auth";

export default async function EditMcpPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const server = await getAdminMcpById(id);

  if (!server) notFound();

  return <McpEditor server={server} />;
}
