import { getArticlesWithCount } from "@/lib/data/articles";
import { ARTICLES_PAGE_SIZE } from "@/lib/articles-search-params";
import { ArticleCard } from "./article-card";
import { ArticlesEmpty } from "./articles-empty";
import { ArticlesPagination } from "./articles-pagination";

interface ArticlesGridProps {
  q: string;
  category: string;
  page: number;
}

function buildPageUrl(q: string, category: string) {
  return (page: number) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (category) params.set("category", category);
    if (page > 1) params.set("page", String(page));
    const qs = params.toString();
    return qs ? `/articles?${qs}` : "/articles";
  };
}

export async function ArticlesGrid({ q, category, page }: ArticlesGridProps) {
  const validPage = Math.max(1, page);
  const offset = (validPage - 1) * ARTICLES_PAGE_SIZE;

  const { articles, total } = await getArticlesWithCount({
    limit: ARTICLES_PAGE_SIZE,
    offset,
    category: category || undefined,
    search: q || undefined,
  });

  const totalPages = Math.ceil(total / ARTICLES_PAGE_SIZE);

  if (articles.length === 0) {
    return (
      <ArticlesEmpty search={q || undefined} category={category || undefined} />
    );
  }

  return (
    <div className="mt-6">
      <div className="grid gap-4 sm:grid-cols-2">
        {articles.map((article) => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </div>
      <div className="mt-8">
        <ArticlesPagination
          currentPage={validPage}
          totalPages={totalPages}
          buildPageUrl={buildPageUrl(q, category)}
        />
      </div>
    </div>
  );
}
