import { siteConfig } from "@/lib/constants";

interface JsonLdProps {
  data: Record<string, unknown>;
}

export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function WebsiteJsonLd() {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: siteConfig.name,
        description: siteConfig.description,
        url: siteConfig.url,
      }}
    />
  );
}

export function ArticleJsonLd({
  title,
  description,
  url,
  publishedAt,
  author,
  image,
  sourceUrl,
}: {
  title: string;
  description: string;
  url: string;
  publishedAt: string;
  author?: string;
  image?: string;
  sourceUrl?: string;
}) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "Article",
        headline: title,
        description,
        url,
        datePublished: publishedAt,
        inLanguage: "zh-CN",
        ...(image && { image }),
        ...(sourceUrl && {
          citation: {
            "@type": "CreativeWork",
            url: sourceUrl,
          },
          isBasedOn: sourceUrl,
        }),
        author: {
          "@type": "Organization",
          name: author ?? siteConfig.name,
        },
        publisher: {
          "@type": "Organization",
          name: siteConfig.name,
          url: siteConfig.url,
        },
      }}
    />
  );
}

export function SoftwareApplicationJsonLd({
  name,
  description,
  url,
  author,
  platform,
  category,
  stars,
  installCommand,
}: {
  name: string;
  description: string;
  url: string;
  author?: string;
  platform?: string[];
  category?: string;
  stars?: number;
  installCommand?: string;
}) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        name,
        description,
        url,
        applicationCategory: category ?? "DeveloperApplication",
        operatingSystem: platform?.join(", ") ?? "Cross-platform",
        ...(author && {
          author: {
            "@type": "Person",
            name: author,
          },
        }),
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
        ...(stars &&
          stars > 0 && {
            aggregateRating: {
              "@type": "AggregateRating",
              ratingValue: Math.min(
                5,
                Math.round((stars / 100) * 5 * 10) / 10 || 4,
              ),
              bestRating: 5,
              ratingCount: stars,
            },
          }),
        ...(installCommand && { installUrl: url }),
        publisher: {
          "@type": "Organization",
          name: siteConfig.name,
          url: siteConfig.url,
        },
      }}
    />
  );
}

export function FAQJsonLd({
  questions,
}: {
  questions: { question: string; answer: string }[];
}) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: questions.map((q) => ({
          "@type": "Question",
          name: q.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: q.answer,
          },
        })),
      }}
    />
  );
}

export function BreadcrumbJsonLd({
  items,
}: {
  items: { name: string; href: string }[];
}) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: items.map((item, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: item.name,
          item: `${siteConfig.url}${item.href}`,
        })),
      }}
    />
  );
}
