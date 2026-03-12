import type { Metadata } from "next";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import {
  getAdminSkills,
  getAdminSkillSources,
  getAdminSkillCategories,
  getSkillStats,
  ADMIN_PAGE_SIZE,
} from "@/lib/data/admin";
import { adminSkillsParamsCache } from "@/lib/admin-search-params";
import { AdminSkillsToolbar } from "@/components/admin/skills-toolbar";
import { AdminSkillsTable } from "@/components/admin/skills-table";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { requireAdmin } from "@/lib/admin-auth";

export const metadata: Metadata = {
  title: "Skill 管理",
};

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function buildPageUrl(
  page: number,
  params: {
    status: string;
    source: string;
    category: string;
    search: string;
  },
) {
  const sp = new URLSearchParams();
  if (params.status) sp.set("status", params.status);
  if (params.source) sp.set("source", params.source);
  if (params.category) sp.set("category", params.category);
  if (params.search) sp.set("search", params.search);
  if (page > 1) sp.set("page", String(page));
  const qs = sp.toString();
  return `/admin/skills${qs ? `?${qs}` : ""}`;
}

export default async function AdminSkillsPage({ searchParams }: PageProps) {
  await requireAdmin();
  const { status, source, category, search, page } =
    await adminSkillsParamsCache.parse(searchParams);

  const [stats, sources, categories, { skills, total }] = await Promise.all([
    getSkillStats(),
    getAdminSkillSources(),
    getAdminSkillCategories(),
    getAdminSkills({
      status: status || undefined,
      source: source || undefined,
      category: category || undefined,
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
      <h1 className="mb-6 text-2xl font-bold">Skill 管理</h1>

      {/* Status tabs */}
      <Tabs value={status} className="mb-4">
        <TabsList>
          {statusTabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} asChild>
              <Link
                href={buildPageUrl(1, {
                  status: tab.value,
                  source,
                  category,
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
        <AdminSkillsToolbar sources={sources} categories={categories} />
      </div>

      {/* Results info */}
      <p className="mb-3 text-sm text-muted-foreground">
        {search || source || category
          ? `找到 ${total} 个 Skill`
          : `共 ${total} 个 Skill`}
      </p>

      {/* Table */}
      <AdminSkillsTable skills={skills} />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6">
          <AdminPagination
            currentPage={page}
            totalPages={totalPages}
            buildPageUrl={(p) =>
              buildPageUrl(p, { status, source, category, search })
            }
          />
        </div>
      )}
    </div>
  );
}
