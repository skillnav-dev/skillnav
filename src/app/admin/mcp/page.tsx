import type { Metadata } from "next";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import {
  getAdminMcpServers,
  getAdminMcpSources,
  getAdminMcpCategories,
  getMcpStats,
  ADMIN_PAGE_SIZE,
} from "@/lib/data/admin";
import { adminMcpParamsCache } from "@/lib/admin-search-params";
import { AdminMcpToolbar } from "@/components/admin/mcp-toolbar";
import { AdminMcpTable } from "@/components/admin/mcp-table";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { requireAdmin } from "@/lib/admin-auth";

export const metadata: Metadata = {
  title: "MCP 管理",
};

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function buildPageUrl(
  page: number,
  params: {
    status: string;
    qualityTier: string;
    category: string;
    source: string;
    search: string;
  },
) {
  const sp = new URLSearchParams();
  if (params.status) sp.set("status", params.status);
  if (params.qualityTier) sp.set("qualityTier", params.qualityTier);
  if (params.category) sp.set("category", params.category);
  if (params.source) sp.set("source", params.source);
  if (params.search) sp.set("search", params.search);
  if (page > 1) sp.set("page", String(page));
  const qs = sp.toString();
  return `/admin/mcp${qs ? `?${qs}` : ""}`;
}

export default async function AdminMcpPage({ searchParams }: PageProps) {
  await requireAdmin();
  const { status, qualityTier, category, source, search, page } =
    await adminMcpParamsCache.parse(searchParams);

  const [stats, sources, categories, { servers, total }] = await Promise.all([
    getMcpStats(),
    getAdminMcpSources(),
    getAdminMcpCategories(),
    getAdminMcpServers({
      status: status || undefined,
      qualityTier: qualityTier || undefined,
      category: category || undefined,
      source: source || undefined,
      search: search || undefined,
      page,
    }),
  ]);

  const totalPages = Math.ceil(total / ADMIN_PAGE_SIZE);

  const statusTabs = [
    { value: "", label: "全部", count: stats.total },
    { value: "published", label: "已发布", count: stats.published },
    { value: "draft", label: "草稿", count: stats.draft },
    { value: "hidden", label: "已隐藏", count: stats.hidden },
  ];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">MCP 管理</h1>

      {/* Status tabs */}
      <Tabs value={status} className="mb-4">
        <TabsList>
          {statusTabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} asChild>
              <Link
                href={buildPageUrl(1, {
                  status: tab.value,
                  qualityTier,
                  category,
                  source,
                  search,
                })}
              >
                {tab.label} ({tab.count})
              </Link>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Filters */}
      <div className="mb-4">
        <AdminMcpToolbar sources={sources} categories={categories} />
      </div>

      {/* Results info */}
      <p className="mb-3 text-sm text-muted-foreground">
        {search || qualityTier || category || source
          ? `找到 ${total} 个 MCP Server`
          : `共 ${total} 个 MCP Server`}
      </p>

      {/* Table */}
      <AdminMcpTable servers={servers} />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6">
          <AdminPagination
            currentPage={page}
            totalPages={totalPages}
            buildPageUrl={(p) =>
              buildPageUrl(p, { status, qualityTier, category, source, search })
            }
          />
        </div>
      )}
    </div>
  );
}
