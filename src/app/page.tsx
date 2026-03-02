import { HeroSection } from "@/components/home/hero-section";
import { StatsBar } from "@/components/home/stats-bar";
import { FeaturedSkills } from "@/components/home/featured-skills";
import { LatestArticles } from "@/components/home/latest-articles";
import { NewsletterCta } from "@/components/home/newsletter-cta";
import { WebsiteJsonLd } from "@/components/shared/json-ld";

export default function Home() {
  return (
    <>
      <WebsiteJsonLd />
      <HeroSection />
      <StatsBar />
      <FeaturedSkills />
      <LatestArticles />
      <NewsletterCta />
    </>
  );
}
