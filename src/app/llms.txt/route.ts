import { getSiteUrl } from "@/lib/seo";

export const dynamic = "force-static";
export const revalidate = 1800;

export function GET() {
  const baseUrl = getSiteUrl();

  const content = [
    "# Nextjs Starter",
    "",
    "A production-ready Next.js 16 starter template with TypeScript, Tailwind CSS v4, shadcn/ui, and modern best practices.",
    "",
    "## Site Information",
    `- Site URL: ${baseUrl}`,
    `- Sitemap: ${baseUrl}/sitemap.xml`,
    `- Robots: ${baseUrl}/robots.txt`,
    "",
    "## Technology Stack",
    "- Next.js 16 (App Router)",
    "- React 19",
    "- TypeScript (strict)",
    "- Tailwind CSS v4",
    "- shadcn/ui (New York style)",
    "- Drizzle ORM (Postgres)",
    "- Biome for linting/formatting",
    "- Vitest for testing",
    "- Bun as package manager",
    "",
    "## Pages",
    `- Home: ${baseUrl} — Landing page and overview`,
    "",
    "## Crawler Guidance",
    "- Use the sitemap for complete page discovery",
    "- The site uses Next.js App Router with ISR for content updates",
    "- Dynamic OG images are generated for social sharing",
    "- Structured data (JSON-LD) is embedded in page HTML",
  ].join("\n");

  return new Response(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
