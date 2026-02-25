import { getSiteUrl } from "@/lib/seo";

export const dynamic = "force-static";

export function GET() {
  const baseUrl = getSiteUrl();

  const llmsFullText = `# Welcome to Nextjs Starter

## Site Information
- Site Name: Nextjs Starter
- URL: ${baseUrl}
- Description: A production-ready Next.js starter template

## Pages
- Home: ${baseUrl}

## Technology Stack
- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS v4
- shadcn/ui
- Drizzle ORM
`;

  return new Response(llmsFullText, {
    headers: {
      "Content-Type": "text/plain",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
