export const DEFAULT_SEO = {
  siteName: "Nextjs Starter",
  titleSuffix: " | Nextjs Starter",
  twitterHandle: "",
  locale: "en_US",
} as const;

export const DISALLOWED_ROBOTS_PATHS = [
  "/api/",
  "/admin/",
  "/private/",
  "/_next/",
] as const;

export const SITEMAP_CONFIG = {
  maxEntries: 50000,
  priority: {
    home: 1.0,
    page: 0.8,
    post: 0.6,
    category: 0.5,
  },
} as const;
