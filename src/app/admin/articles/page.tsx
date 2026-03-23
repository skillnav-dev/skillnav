import type { Metadata } from "next";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import {
  getAdminArticles,
  getAdminArticleSources,
  getArticleStats,
  ADMIN_PAGE_SIZE,
} from "@/lib/data/admin";
import { adminArticlesParamsCache } from "@/lib/admin-search-params";
import { AdminArticlesToolbar } from "@/components/admin/articles-toolbar";
import { AdminArticlesTable } from "@/components/admin/articles-table";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { requireAdmin } from "@/lib/admin-auth";

export const metadata: Metadata = {
  title: "文章管理",
};

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function buildPageUrl(
  page: number,
  params: {
    status: string;
    source: string;
    contentTier: string;
    articleType: string;
    search: string;
  },
) {
  const sp = new URLSearchParams();
  if (params.status) sp.set("status", params.status);
  if (params.source) sp.set("source", params.source);
  if (params.contentTier) sp.set("contentTier", params.contentTier);
  if (params.articleType) sp.set("articleType", params.articleType);
  if (params.search) sp.set("search", params.search);
  if (page > 1) sp.set("page", String(page));
  const qs = sp.toString();
  return `/admin/articles${qs ? `?${qs}` : ""}`;
}

export default async function AdminArticlesPage({ searchParams }: PageProps) {
  await requireAdmin();
  const { status, source, contentTier, articleType, search, page } =
    await adminArticlesParamsCache.parse(searchParams);

  const [stats, sources, { articles, total }] = await Promise.all([
    getArticleStats(),
    getAdminArticleSources(),
    getAdminArticles({
      status: status || undefined,
      source: source || undefined,
      contentTier: contentTier || undefined,
      articleType: articleType || undefined,
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
      <h1 className="mb-6 text-2xl font-bold tracking-tight">文章管理</h1>

      {/* Status tabs */}
      <Tabs value={status} className="mb-4">
        <TabsList>
          {statusTabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} asChild>
              <Link
                href={buildPageUrl(1, {
                  status: tab.value,
                  source,
                  contentTier,
                  articleType,
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
        <AdminArticlesToolbar sources={sources} />
      </div>

      {/* Results info */}
      <p className="mb-3 text-sm text-muted-foreground">
        {search || source || contentTier || articleType
          ? `找到 ${total} 篇文章`
          : `共 ${total} 篇文章`}
      </p>

      {/* Table */}
      <AdminArticlesTable articles={articles} />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6">
          <AdminPagination
            currentPage={page}
            totalPages={totalPages}
            buildPageUrl={(p) =>
              buildPageUrl(p, {
                status,
                source,
                contentTier,
                articleType,
                search,
              })
            }
          />
        </div>
      )}
    </div>
  );
}
