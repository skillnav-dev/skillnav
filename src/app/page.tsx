import { HeroSection } from "@/components/home/hero-section";
import { ScenarioShortcuts } from "@/components/home/scenario-shortcuts";
import { EditorialHighlights } from "@/components/home/editorial-highlights";
import { FeaturedSkills } from "@/components/home/featured-skills";
import { FeaturedMcp } from "@/components/home/featured-mcp";
import { LatestArticles } from "@/components/home/latest-articles";
import { NewsletterCta } from "@/components/home/newsletter-cta";
import { WebsiteJsonLd } from "@/components/shared/json-ld";

export default function Home() {
  return (
    <>
      <WebsiteJsonLd />
      <HeroSection />
      <ScenarioShortcuts />
      <EditorialHighlights />
      <FeaturedSkills />
      <FeaturedMcp />
      <LatestArticles />
      <NewsletterCta />
    </>
  );
}
