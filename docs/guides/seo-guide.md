# SEO Implementation Guide

> A comprehensive, production-ready SEO implementation guide for Next.js applications. Adaptable to any Next.js 14+ project with App Router.

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Architecture](#architecture)
3. [Metadata](#metadata)
4. [Structured Data (JSON-LD)](#structured-data-json-ld)
5. [Sitemap Generation](#sitemap-generation)
6. [Robots.txt](#robotstxt)
7. [Internationalization SEO](#internationalization-i18n-seo)
8. [AI SEO (llm.txt)](#ai-seo-llmtxt)
9. [Performance Considerations](#performance-considerations)
10. [Validation Checklist](#validation-checklist)

---

## Quick Start

### 1. Install Dependencies

No external packages required. Next.js provides all SEO features built-in.

### 2. Environment Variable

```bash
# .env.local
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
```

> **Important**: All route paths, metadata defaults, and SEO configuration values must be defined in `src/lib/constants.ts` — never hardcoded inline. Import `ROUTES`, `DEFAULT_SEO`, etc. from `@/lib/constants`.

### 3. Directory Structure

Create this structure in your project:

```
src/
├── app/
│   ├── sitemap.ts          # Dynamic sitemap
│   ├── robots.ts           # Robots.txt
│   └── llm.txt/route.ts    # AI SEO
├── components/
│   └── seo/
│       └── JsonLd.tsx      # JSON-LD component
└── lib/
    └── seo/
        ├── canonical.ts     # Canonical URL utility
        ├── constants.ts    # SEO constants
        ├── types.ts        # TypeScript types
        └── metadata/       # Page metadata generators
        └── jsonld/        # Schema builders
```

---

## Architecture

### Recommended File Organization

```
src/lib/seo/
├── index.ts              # Barrel exports
├── constants.ts          # Site name, default meta, social URLs
├── types.ts              # SEO-specific TypeScript types
├── canonical.ts          # Canonical URL builder
├── metadata/
│   ├── home.ts          # Homepage metadata
│   ├── page.ts          # Generic page metadata
│   └── product.ts       # Product/dynamic page metadata
└── jsonld/
    ├── common.ts         # Organization, WebSite schemas
    ├── product.ts       # Product schema
    ├── breadcrumb.ts    # BreadcrumbList schema
    └── localBusiness.ts # LocalBusiness schema (if applicable)
```

---

## Metadata

### Root Layout Metadata

```typescript
// src/app/layout.tsx
import { Metadata } from "next";
import { env } from "@/lib/env";

export const metadata: Metadata = {
  metadataBase: new URL(env.NEXT_PUBLIC_SITE_URL),
  title: {
    default: "Your Site Name",
    template: "%s | Your Site Name",
  },
  description: "Your site description (150-160 characters)",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Your Site Name",
  },
  twitter: {
    card: "summary_large_image",
  },
};
```

### Page-Specific Metadata

```typescript
// src/app/[locale]/(public)/page.tsx
import { Metadata } from "next";
import { generateMetadata as genMeta } from "@/lib/seo/metadata/home";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return genMeta(locale);
}
```

### Metadata Generator Pattern

```typescript
// src/lib/seo/metadata/home.ts
import { Metadata } from "next";
import { getCanonicalUrl } from "@/lib/seo/canonical";

type Locale = "en" | "es" | string;

export function generateMetadata(locale: Locale): Metadata {
  const titles: Record<Locale, string> = {
    en: "Your Site - English Title",
    es: "Tu Sitio - Título en Español",
  };

  const descriptions: Record<Locale, string> = {
    en: "English description of your site",
    es: "Descripción en español de tu sitio",
  };

  const title = titles[locale as Locale] || titles.en;
  const description = descriptions[locale as Locale] || descriptions.en;

  return {
    title,
    description,
    alternates: {
      canonical: getCanonicalUrl("/", locale),
      languages: {
        en: getCanonicalUrl("/", "en"),
        es: getCanonicalUrl("/", "es"),
        "x-default": getCanonicalUrl("/", "en"),
      },
    },
    openGraph: {
      title,
      description,
      url: getCanonicalUrl("/", locale),
    },
  };
}
```

---

## Structured Data (JSON-LD)

### JsonLd Component

```typescript
// src/components/seo/JsonLd.tsx
type JsonLdProps = {
  data: Record<string, unknown>;
};

export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
```

### Organization Schema

```typescript
// src/lib/seo/jsonld/common.ts
import { env } from "@/lib/env";

export function getOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Your Company Name",
    url: env.NEXT_PUBLIC_SITE_URL,
    logo: `${env.NEXT_PUBLIC_SITE_URL}/logo.png`,
    description: "Your company description",
    contactPoint: {
      "@type": "ContactPoint",
      email: "contact@yourdomain.com",
      contactType: "customer service",
    },
    sameAs: [
      "https://facebook.com/yourcompany",
      "https://twitter.com/yourcompany",
      "https://instagram.com/yourcompany",
    ],
  };
}
```

### Breadcrumb Schema

```typescript
// src/lib/seo/jsonld/breadcrumb.ts
type BreadcrumbItem = {
  name: string;
  url: string;
};

export function getBreadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
```

### Using in Pages

```typescript
// src/app/product/[slug]/page.tsx
import { JsonLd } from "@/components/seo/JsonLd";
import { getBreadcrumbSchema } from "@/lib/seo/jsonld/breadcrumb";

export default async function ProductPage({ params }: Props) {
  const product = await getProduct(params.slug);

  const jsonLd = {
    ...getOrganizationSchema(),
    ...getBreadcrumbSchema([
      { name: "Home", url: "https://yoursite.com/" },
      { name: "Products", url: "https://yoursite.com/products" },
      { name: product.name, url: `https://yoursite.com/product/${product.slug}` },
    ]),
  };

  return (
    <>
      <JsonLd data={jsonLd} />
      {/* Page content */}
    </>
  );
}
```

---

## Sitemap Generation

### Basic Sitemap

```typescript
// src/app/sitemap.ts
import { MetadataRoute } from "next";
import { env } from "@/lib/env";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = env.NEXT_PUBLIC_SITE_URL;
  const now = new Date();

  return [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    // Add more static pages
  ];
}
```

### Change Frequency Guide

| Page Type | Frequency | Priority |
|-----------|-----------|----------|
| Homepage | daily | 1.0 |
| Product/Service | weekly | 0.9 |
| Category | weekly | 0.8 |
| About/Contact | monthly | 0.6 |
| Blog posts | weekly | 0.7 |

---

## Robots.txt

```typescript
// src/app/robots.ts
import { MetadataRoute } from "next";
import { env } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = env.NEXT_PUBLIC_SITE_URL;
  const isProduction = process.env.NODE_ENV === "production";

  return {
    rules: isProduction
      ? {
          userAgent: "*",
          allow: "/",
          disallow: [
            "/api/",
            "/admin/",
            "/private/",
            "/account/",
          ],
        }
      : {
          userAgent: "*",
          disallow: "/",
        },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
```

### Common Disallow Rules

| Path | Reason |
|------|--------|
| `/api/` | Internal APIs |
| `/admin/` | Admin panels |
| `/account/` | User dashboards |

---

## AI SEO (llm.txt)

### Implementation

```typescript
// src/app/llm.txt/route.ts
import { NextResponse } from "next/server";
import { env } from "@/lib/env";

export async function GET() {
  const content = `# Your Company Name

> Your tagline or short description.

## About
Your company description for AI systems.

## Services
- Service 1
- Service 2
- Service 3

## Contact
- Email: contact@yourdomain.com
- Website: ${env.NEXT_PUBLIC_SITE_URL}
`;

  return new NextResponse(content, {
    headers: {
      "Content-Type": "text/plain",
    },
  });
}
```

---

## Performance Considerations

### SEO Impact on Core Web Vitals

| SEO Element | Performance Impact | Mitigation |
|-------------|-------------------|-------------|
| JSON-LD | ~1KB per page | Keep payloads minimal |
| Metadata | Server-side only | No client impact |
| Sitemap | Cached by Next.js | Use ISR/SSG |
| Images | LCP risk | Use next/image with priority |

### Image SEO

```typescript
import Image from "next/image";

// Above fold - LCP candidates
<Image
  src={heroImage}
  alt="Descriptive alt text"
  width={1200}
  height={630}
  priority={true}
  fetchPriority="high"
/>

// Below fold
<Image
  src={galleryImage}
  alt="Descriptive alt text"
  width={600}
  height={400}
  loading="lazy"
/>
```

---

## Validation Checklist

### Pre-Production

- [ ] All public pages have unique titles
- [ ] All public pages have unique meta descriptions (150-160 chars)
- [ ] Every image has descriptive alt text
- [ ] Each page has exactly one `<h1>`
- [ ] Heading hierarchy is correct (no skipping levels)
- [ ] Canonical URLs are correct

### Testing

| Tool | URL | Purpose |
|------|-----|---------|
| Google Search Console | search.google.com/search-console | Crawl status, indexing |
| Schema Validator | https://validator.schema.org | JSON-LD validation |
| Rich Results Test | https://search.google.com/test/rich-results | Rich snippets |
| Lighthouse | Chrome DevTools | Core Web Vitals |

### Common Issues

| Issue | Solution |
|-------|----------|
| Pages not indexed | Check robots.txt and meta robots |
| Missing rich results | Validate JSON-LD schema |
| Duplicate content | Implement canonical URLs |
| Slow LCP | Optimize above-fold images |
