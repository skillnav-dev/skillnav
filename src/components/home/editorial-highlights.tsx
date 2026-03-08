import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SectionHeader } from "@/components/shared/section-header";

// Placeholder: renders nothing until editorial content (e.g. weekly digest) exists.
// Will display a featured large card + article list once content_tier='editorial' records appear.
export async function EditorialHighlights() {
  // TODO: query articles where content_tier = 'editorial' or series = 'weekly'
  const hasEditorial = false;

  if (!hasEditorial) return null;

  return (
    <section className="py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex items-end justify-between">
          <SectionHeader
            title="编辑精选"
            description="本周值得关注的工具与文章"
          />
          <Link
            href="/articles"
            className="hidden items-center gap-1 text-sm font-medium text-primary transition-colors hover:text-primary/80 sm:flex"
          >
            查看全部
            <ArrowRight className="size-4" />
          </Link>
        </div>
        {/* Editorial content grid will be added when weekly digest is ready */}
      </div>
    </section>
  );
}
