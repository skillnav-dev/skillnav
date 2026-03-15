import { HeroSection } from "@/components/home/hero-section";
import { StatsBar } from "@/components/home/stats-bar";
import { ScenarioShortcuts } from "@/components/home/scenario-shortcuts";
import { EditorialHighlights } from "@/components/home/editorial-highlights";
import { FeaturedTools } from "@/components/home/featured-tools";
import { LatestArticles } from "@/components/home/latest-articles";
import { NewsletterCta } from "@/components/home/newsletter-cta";
import { WebsiteJsonLd } from "@/components/shared/json-ld";
import { getFeaturedSkills, getFeaturedMcpServers } from "@/lib/data";

export default async function Home() {
  const [skills, mcpServers] = await Promise.all([
    getFeaturedSkills(10),
    getFeaturedMcpServers(10),
  ]);

  return (
    <>
      <WebsiteJsonLd />
      <HeroSection />
      <section className="border-b border-border/40 bg-muted/30">
        <StatsBar />
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="border-t border-border/20" />
        </div>
        <ScenarioShortcuts />
      </section>
      <EditorialHighlights />
      <FeaturedTools skills={skills} mcpServers={mcpServers} />
      <LatestArticles />
      <NewsletterCta />
    </>
  );
}
