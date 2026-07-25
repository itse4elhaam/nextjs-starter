import type { MetadataRoute } from "next";
import { isProduction } from "@/lib/config";
import { DISALLOWED_ROBOTS_PATHS } from "@/lib/constants";
import { getSiteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getSiteUrl();

  if (!isProduction()) {
    return {
      rules: {
        userAgent: "*",
        disallow: "/",
      },
    };
  }

  return {
    rules: [
      {
        // AI training crawlers — disallow entirely
        userAgent: "CCBot",
        disallow: "/",
      },
      {
        userAgent: "GPTBot",
        disallow: "/",
      },
      {
        userAgent: "Claude-Web",
        disallow: "/",
      },
      {
        userAgent: "anthropic-ai",
        disallow: "/",
      },
      {
        userAgent: "cohere-ai",
        disallow: "/",
      },
      {
        // All other crawlers (search engines, etc.)
        userAgent: "*",
        allow: "/",
        disallow: [...DISALLOWED_ROBOTS_PATHS],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
