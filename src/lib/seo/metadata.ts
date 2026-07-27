import "server-only";

import type { Metadata } from "next";
import { env } from "@/lib/config";
import { DEFAULT_SEO } from "@/lib/constants";
import type {
  IBlogPostingSchemaConfig,
  ICollectionPageSchemaConfig,
  IItemListSchemaConfig,
  IJsonLdScript,
  ISeoConfig,
  IVacationRentalSchemaConfig,
} from "@/lib/types";

export function getSiteUrl(): string {
  const url = env.NEXT_PUBLIC_SITE_URL;
  return url.replace(/\/$/u, "");
}

export function getAbsoluteUrl(path: string): string {
  const base = getSiteUrl();
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

export function buildSeoMetadata(config: ISeoConfig): Metadata {
  const {
    title,
    description,
    url,
    image,
    type = "website",
    noIndex,
    noFollow,
    publishedTime,
    author,
  } = config;
  const fullTitle = title.includes(DEFAULT_SEO.siteName)
    ? title
    : `${title}${DEFAULT_SEO.titleSuffix}`;
  const canonical = url.startsWith("http") ? url : `${getSiteUrl()}${url}`;
  const metadata: Metadata = {
    title: fullTitle,
    description,
    alternates: { canonical },
    openGraph: {
      title: fullTitle,
      description,
      url: canonical,
      type,
      siteName: DEFAULT_SEO.siteName,
      locale: DEFAULT_SEO.locale,
      ...(image ? { images: [{ url: image }] } : {}),
      ...(publishedTime ? { publishedTime } : {}),
      ...(author ? { authors: [author] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      ...(DEFAULT_SEO.twitterHandle
        ? { creator: DEFAULT_SEO.twitterHandle }
        : {}),
      ...(image ? { images: [image] } : {}),
    },
    robots: {
      index: !noIndex,
      follow: !noFollow,
    },
  };
  return metadata;
}

export function generateJsonLd(schema: object): IJsonLdScript {
  return { __html: JSON.stringify(schema) };
}

// ─── JSON-LD Structured Data Generators ────────────────────────────────

export function getOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: DEFAULT_SEO.siteName,
    url: getSiteUrl(),
    logo: `${getSiteUrl()}/logo.png`,
  } as const;
}

export function getWebsiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: DEFAULT_SEO.siteName,
    url: getSiteUrl(),
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${getSiteUrl()}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  } as const;
}

export function getBreadcrumbSchema(
  items: Array<{ name: string; url: string }>,
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${getSiteUrl()}${item.url}`,
    })),
  };
}

export function getFAQPageSchema(
  questions: Array<{ question: string; answer: string }>,
) {
  return {
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
  };
}

export function getBlogPostingSchema(config: IBlogPostingSchemaConfig) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: config.title,
    description: config.description,
    url: getAbsoluteUrl(config.url),
    datePublished: config.publishedTime,
    author: {
      "@type": "Person",
      name: config.author,
    },
    ...(config.image ? { image: getAbsoluteUrl(config.image) } : {}),
  };
}

export function getCollectionPageSchema(config: ICollectionPageSchemaConfig) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: config.name,
    description: config.description,
    url: getAbsoluteUrl(config.url),
    mainEntity: {
      "@type": "ItemList",
      itemListElement: config.items.map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        item: {
          "@type": "Thing",
          name: item.name,
          url: item.image ? undefined : getAbsoluteUrl(item.url),
          ...(item.image ? { image: item.image } : {}),
        },
        ...(item.image ? { url: getAbsoluteUrl(item.url) } : {}),
      })),
    },
  };
}

export function getItemListSchema(config: IItemListSchemaConfig) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: config.name,
    ...(config.description ? { description: config.description } : {}),
    url: getAbsoluteUrl(config.url),
    itemListElement: config.items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: getAbsoluteUrl(item.url),
      ...(item.image ? { image: item.image } : {}),
    })),
  };
}

export function getVacationRentalSchema(config: IVacationRentalSchemaConfig) {
  return {
    "@context": "https://schema.org",
    "@type": "VacationRental",
    name: config.name,
    description: config.description,
    url: getAbsoluteUrl(config.url),
    image: config.images,
    geo: {
      "@type": "GeoCoordinates",
      latitude: config.latitude,
      longitude: config.longitude,
    },
    containsPlace: {
      "@type": "Accommodation",
      occupancy: {
        "@type": "QuantitativeValue",
        maxValue: config.maxOccupancy,
      },
      amenityFeature: config.amenities.map((amenity) => ({
        "@type": "LocationFeatureSpecification",
        name: amenity,
      })),
    },
    petsAllowed: config.petsAllowed ?? false,
    checkinTime: config.checkIn,
    checkoutTime: config.checkOut,
    ...(config.priceFrom
      ? {
          offers: {
            "@type": "Offer",
            price: config.priceFrom,
            priceCurrency: "EUR",
          },
        }
      : {}),
  };
}
