import { HeroSection } from "@/components/home/hero-section";
import { StatsBar } from "@/components/home/stats-bar";
import { ScenarioShortcuts } from "@/components/home/scenario-shortcuts";
import { EditorialHighlights } from "@/components/home/editorial-highlights";
import { FeaturedTools } from "@/components/home/featured-tools";
import { LatestArticles } from "@/components/home/latest-articles";
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
      <StatsBar />
      <ScenarioShortcuts />
      <EditorialHighlights />
      <FeaturedTools skills={skills} mcpServers={mcpServers} />
      <LatestArticles />
    </>
  );
}
