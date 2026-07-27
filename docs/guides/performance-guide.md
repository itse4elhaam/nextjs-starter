# Performance Implementation Guide

> A comprehensive performance guide for Next.js applications. Adaptable to any Next.js 14+ project with App Router.

---

## Table of Contents

1. [Core Web Vitals](#core-web-vitals)
2. [Configuration](#configuration)
3. [Static Generation (ISR/SSG)](#static-generation-isrssg)
4. [Image Optimization](#image-optimization)
5. [Font Optimization](#font-optimization)
6. [Dynamic Imports & Code Splitting](#dynamic-imports--code-splitting)
7. [Suspense & Streaming](#suspense--streaming)
8. [Parallel Data Fetching](#parallel-data-fetching)
9. [Third-Party Script Optimization](#third-party-script-optimization)
10. [Bundle Optimization](#bundle-optimization)
11. [Testing & Validation](#testing--validation)

---

## Core Web Vitals

| Metric | Target | What It Measures |
|--------|--------|------------------|
| LCP (Largest Contentful Paint) | < 2.5s | When the largest content element becomes visible |
| CLS (Cumulative Layout Shift) | < 0.1 | Visual stability during page load |
| FID (First Input Delay) | < 100ms | Time from user interaction to event handler |
| INP (Interaction to Next Paint) | < 200ms | Overall responsiveness |

### Priority Order

1. **LCP** - Most critical. Optimize hero images, server rendering
2. **CLS** - Prevent layout shifts with fixed dimensions
3. **INP** - Minimize JavaScript, defer non-critical

---

## Configuration

### next.config.ts

```typescript
// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Remove X-Powered-By header
  poweredByHeader: false,
  
  experimental: {
    // Optimize tree-shaking for large libraries
    optimizePackageImports: [
      "lucide-react",       // 1000+ icons
      "date-fns",
      "@radix-ui/react-*", // All Radix components
    ],
  },
  
  images: {
    // Remote image domains
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "**.amazonaws.com",
      },
    ],
    // Modern formats
    formats: ["image/avif", "image/webp"],
    // Responsive breakpoints
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
};

export default nextConfig;
```

---

## Static Generation (ISR/SSG)

### Why Static?

- **Fast TTFB**: Pre-built HTML served from edge/CDN
- **Scalable**: No server processing per request
- **Reliable**: No runtime errors

### ISR Pattern

```typescript
// src/app/product/[slug]/page.tsx

// Revalidate every 30 minutes
export const revalidate = 1800;

// Only allow pre-built routes (404 for unknown)
export const dynamicParams = false;

// Generate all pages at build time
export async function generateStaticParams() {
  const products = await fetchProducts();
  
  return products.map((product) => ({
    slug: product.slug,
  }));
}

export default async function ProductPage({ params }: Props) {
  const product = await getProduct(params.slug);
  
  return <ProductContent product={product} />;
}
```

### When to Use What

| Strategy | Use When | Revalidate |
|----------|----------|------------|
| SSG (static) | Pages never change | Never |
| ISR | Pages change occasionally | On interval |
| SSR | Highly dynamic | Always |

### Revalidation Guide

| Content Type | Revalue |
|--------------|---------|
| Homepage | 60-300 seconds |
| Product pages | 600-3600 seconds |
| Blog posts | 3600+ seconds |
| User data | Never (SSR) |

---

## Image Optimization

### Using next/image

#### LCP Images (Above the Fold)

```typescript
import Image from "next/image";

// Hero / above-fold images
<Image
  src={heroImage}
  alt="Descriptive text for accessibility"
  width={1920}
  height={1080}
  priority={true}        // CRITICAL: Preload
  fetchPriority="high"  // Browser priority hint
  sizes="100vw"
  className="object-cover"
/>
```

#### Below-the-Fold Images

```typescript
// Gallery, cards, lazy content
<Image
  src={thumbnail}
  alt="Description"
  width={600}
  height={400}
  loading="lazy"  // Default, but explicit
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
/>
```

### Common Mistakes

```typescript
// ❌ WRONG: Manual preload conflicts with next/image
<link rel="preload" href="/hero.jpg" />

// ✅ CORRECT: Let next/image handle it
<Image src="/hero.jpg" priority />
```

```typescript
// ❌ WRONG: Preloading below-fold images
<Image src="/gallery-1.jpg" priority />

// ✅ CORRECT: Lazy load below fold
<Image src="/gallery-1.jpg" loading="lazy" />
```

### Sizes Attribute Guide

| Layout | Sizes Value |
|--------|-------------|
| Full width (hero) | `100vw` |
| Half width (2 columns) | `(max-width: 768px) 100vw, 50vw` |
| Third width (3 columns) | `(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw` |
| Fourth width | `(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw` |

---

## Font Optimization

### Using next/font

```typescript
// src/app/layout.tsx
import { Inter, Playfair_Display } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

export default function RootLayout({ children }: Props) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body>{children}</body>
    </html>
  );
}
```

### Why next/font?

- Self-hosted at build time (no Google Fonts requests)
- Zero layout shift (size fallback)
- Automatic subsetting

### Don't Do This

```typescript
// ❌ WRONG: Manual Google Fonts
<link href="https://fonts.googleapis.com/css2?family=Inter" />

// ❌ WRONG: Preconnect not needed
<link rel="preconnect" href="https://fonts.gstatic.com" />

// ✅ CORRECT: next/font handles everything
import { Inter } from "next/font/google";
```

---

## Dynamic Imports & Code Splitting

### When to Use Dynamic

| Component | Use Dynamic | Reason |
|-----------|-------------|--------|
| Video backgrounds | ✅ | Heavy JS, not visible initially |
| Chat widgets | ✅ | Below fold, modal only |
| Analytics | ✅ | Can load after interaction |
| Navigation menus | ✅ | Not needed for LCP |
| Forms | ❌ | Need for interactivity |
| Hero content | ❌ | Above fold |

### Basic Pattern

```typescript
import dynamic from "next/dynamic";

// Lazy load with SSR disabled
const VideoBackground = dynamic(
  () => import("@/components/VideoBackground"),
  { 
    ssr: false,
    loading: () => <div className="bg-gray-200 animate-pulse" />
  }
);

export default function Hero() {
  return (
    <div className="relative">
      <HeroPoster />
      <VideoBackground />
    </div>
  );
}
```

### For Heavy Libraries

```typescript
// ❌ WRONG: Import in initial bundle
import { Chart } from "chart.js"; // 200KB+

// ✅ CORRECT: Dynamic import
const Chart = dynamic(() => import("chart.js"), { ssr: false });

// Or use next/dynamic
const ChartComponent = dynamic(
  () => import("@/components/Chart").then((mod) => mod.Chart),
  { ssr: false, loading: () => <ChartSkeleton /> }
);
```

---

## Suspense & Streaming

### Wrap Async Components

```typescript
import { Suspense } from "react";

export default function Page() {
  return (
    <main>
      {/* Hero doesn't need data - render immediately */}
      <Hero />
      
      {/* Products need data - wrap in Suspense */}
      <Suspense fallback={<ProductsSkeleton />}>
        <ProductList />
      </Suspense>
      
      <Suspense fallback={<ReviewsSkeleton />}>
        <Reviews />
      </Suspense>
    </main>
  );
}
```

### Fallback Best Practices

```typescript
// ✅ CORRECT: Match actual dimensions
function ProductsSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="aspect-video bg-gray-200 animate-pulse" />
      ))}
    </div>
  );
}

// ❌ WRONG: Empty or wrong size causes CLS
function BadSkeleton() {
  return <div className="animate-pulse" />;
}
```

### Streaming HTML

Next.js automatically streams HTML when you use async components:

```typescript
// This component streams to browser
async function ProductList() {
  const products = await fetchProducts(); // Can take time
  
  return (
    <div>
      {products.map((p) => <ProductCard key={p.id} product={p} />)}
    </div>
  );
}
```

---

## Parallel Data Fetching

### Sequential vs Parallel

```typescript
// ❌ WRONG: Sequential - blocks rendering
const t = await getTranslations("home");     // 100ms
const products = await getProducts();        // 200ms (waits for t)
const user = await getUser();               // 100ms (waits for products)
// Total: 400ms

// ✅ CORRECT: Parallel - concurrent execution
const [t, products, user] = await Promise.all([
  getTranslations("home"),
  getProducts(),
  getUser(),
]);
// Total: max(100, 200, 100) = 200ms
```

### Conditional Fetching

```typescript
// Only fetch what you need
const [translations, userData] = await Promise.all([
  getTranslations("page"),
  userId ? getUserData(userId) : Promise.resolve(null),
]);
```

### Don't Over-Parallelize

```typescript
// ⚠️ Too many parallel requests can overwhelm browser
// Limit to 3-5 concurrent requests
const [a, b, c, d, e] = await Promise.all([
  fetchA(),
  fetchB(),
  fetchC(),
  fetchD(),
  fetchE(),
]);
```

---

## Third-Party Script Optimization

### Partytown (Web Worker)

```typescript
// src/app/layout.tsx
import { Partytown } from "@builder.io/partytown/react";

export default function RootLayout({ children }: Props) {
  return (
    <html>
      <head>
        <Partytown forward={["dataLayer.push", "fbq"]} />
        
        {/* Analytics runs in web worker */}
        <script
          type="text/partytown"
          src="https://www.googletagmanager.com/gtag/js?id=GA_ID"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

### Manual Defer

```typescript
"use client";

import { useEffect } from "react";

export function Analytics() {
  useEffect(() => {
    // Load after page is interactive
    initAnalytics();
  }, []);
  
  return null;
}
```

---

## Bundle Optimization

### Check Your Bundle

```bash
# Build and analyze
npm run build

# Check chunk sizes
ls -la .next/static/chunks/
```

### Common Issues

```typescript
// ❌ WRONG: Import entire library
import _ from "lodash"; // 70KB+

// ✅ CORRECT: Import only what you need
import debounce from "lodash/debounce";
import clamp from "lodash/clamp";
```

### Library Alternatives

| Heavy Library | Lighter Alternative |
|---------------|---------------------|
| lodash | lodash-es, native methods |
| moment.js | date-fns, dayjs |
| axios | fetch, ky |
| fullcalendar | @fullcalendar/react |

---

## Testing & Validation

### Tools

| Tool | URL | Purpose |
|------|-----|---------|
| PageSpeed Insights | pagespeed.web.dev | Lighthouse scores |
| WebPageTest | webpagetest.org | Advanced metrics |
| Chrome DevTools | Lighthouse tab | Real device testing |
| Next.js Analytics | nextjs.org/docs/app/api-reference/next-config#analytics | Build analytics |

### Commands

```bash
# Full build
npm run build

# Analyze bundle
npm run build && ls -la .next/static/chunks/

# Lighthouse CI
npx lighthouse https://yoursite.com --output=json
```

### What to Check

1. **LCP < 2.5s** - Hero image priority, server components
2. **CLS < 0.1** - Fixed dimensions on images/embeds
3. **Bundle size** - < 200KB initial JS (aim for less)
4. **Images** - Use WebP/AVIF, proper sizing

---

## Quick Reference

### DO

1. Use Server Components by default
2. Add `priority` to LCP images
3. Use Suspense boundaries
4. Parallelize data fetching
5. Lazy load below-fold components
6. Use optimizePackageImports

### DON'T

1. Don't use `"use client"` unnecessarily
2. Don't preload below-fold images
3. Don't use sequential awaits
4. Don't import heavy libs eagerly
5. Don't block with non-critical JS

---

*Generic Performance Guide v1.0*
*Based on Next.js App Router best practices*
