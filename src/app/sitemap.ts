import type { MetadataRoute } from "next";
import { SITEMAP_CONFIG } from "@/lib/constants";
import { ChangeFrequency } from "@/lib/enums";
import { getSiteUrl } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getSiteUrl();

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: ChangeFrequency.Weekly,
      priority: SITEMAP_CONFIG.priority.home,
    },
  ];

  return staticRoutes;
}
