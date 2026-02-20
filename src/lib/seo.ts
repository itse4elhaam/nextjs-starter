import "server-only";

import type { Metadata } from "next";
import { env } from "@/lib/config";
import { DEFAULT_SEO } from "@/lib/constants";
import type { IJsonLdScript, ISeoConfig } from "@/lib/types";

const getSiteUrl = (): string => {
  const url = env.NEXT_PUBLIC_SITE_URL;
  return url.replace(/\/$/, "");
};

export const buildSeoMetadata = (config: ISeoConfig): Metadata => {
  const {
    title,
    description,
    url,
    image,
    type = "website",
    noIndex,
    noFollow,
  } = config;

  const fullTitle = title.includes(DEFAULT_SEO.siteName)
    ? title
    : `${title}${DEFAULT_SEO.titleSuffix}`;

  const canonical = url.startsWith("http") ? url : `${getSiteUrl()}${url}`;

  const metadata: Metadata = {
    title: fullTitle,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title: fullTitle,
      description,
      url: canonical,
      type,
      siteName: DEFAULT_SEO.siteName,
      locale: DEFAULT_SEO.locale,
      ...(image ? { images: [{ url: image }] } : {}),
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
};

export const generateJsonLd = (schema: object): IJsonLdScript => {
  return {
    __html: JSON.stringify(schema),
  };
};

export const getOrganizationSchema = () => {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: DEFAULT_SEO.siteName,
    url: getSiteUrl(),
    logo: `${getSiteUrl()}/logo.png`,
  };
};

export const getWebsiteSchema = () => {
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
  };
};

export { getSiteUrl };
