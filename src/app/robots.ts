import type { MetadataRoute } from "next";
import { env } from "@/lib/config";
import { DISALLOWED_ROBOTS_PATHS } from "@/lib/constants";
import { getSiteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getSiteUrl();
  const isProduction = env.NODE_ENV === "production";

  return {
    rules: isProduction
      ? {
          userAgent: "*",
          allow: "/",
          disallow: [...DISALLOWED_ROBOTS_PATHS],
        }
      : {
          userAgent: "*",
          disallow: "/",
        },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
