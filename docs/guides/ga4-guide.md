# GA4 & Analytics Implementation Guide

## Overview

The analytics system provides a production-ready Google Analytics 4 (GA4) integration for Next.js 16 applications. It covers client-side event tracking via `gtag.js`, server-side event tracking via the Measurement Protocol, UTM parameter persistence across sessions, Web Vitals monitoring, and client-side event deduplication — all wrapped in a consent-first, debug-friendly architecture.

**Design principles:**

- **Dedup-first** — Every client-side event is checked against an in-memory deduplication window before being sent. Duplicate events (same name + params within the TTL window) are silently dropped.
- **UTM persistence** — UTM parameters are extracted from the URL on arrival, stored in `sessionStorage`, and automatically appended to every subsequent event for the duration of the session (configurable expiry, default 24 hours).
- **Web Vitals** — Real-user performance metrics (CLS, LCP, INP, FCP, TTFB) are collected via the `web-vitals` library and reported as GA4 custom events, with automatic alerts for poor ratings.
- **Server-side support** — The Measurement Protocol integration allows tracking server-confirmed events (e.g., purchase confirmations) that are more reliable than client-side-only tracking.
- **Debug-friendly** — In development mode, all GA4 events are logged to the console with styled formatting so you can inspect what would be sent without actually sending it.

---

## Key Features

- **`trackPageView()`** — Fires a `page_view` event with UTM-enriched parameters. Call it from layout or page components after route changes.
- **`trackCustomEvent()`** — Fire any arbitrary GA4 event with custom params. All events are automatically UTM-enriched and deduplicated.
- **`trackPurchase()`** — Fires a `purchase` event with the full e-commerce payload (transaction_id, value, currency, items array, tax, shipping) plus UTM enrichment.
- **`trackServerPurchase()`** — Server-side purchase event via Measurement Protocol. Accepts the same `IPurchaseParams` shape but sends directly from the server using `GA_API_SECRET`. More reliable for post-checkout confirmation.
- **`trackServerEvent()`** — Generic server-side event sender. Useful for backend-orchestrated workflows and webhooks.
- **`useWebVitals()`** — React hook (client component) that registers `web-vitals` callbacks for CLS, LCP, INP, FCP, and TTFB, firing them as `web_vitals` GA4 events. Automatically fires `performance_alert` and `slow_lcp` alerts for poor ratings.
- **Event deduplication** — In-memory `Map<string, IEventRecord>` with configurable TTL (`DEDUP_WINDOW_MS` default 2000ms). Events matching by signature (name + sorted params) within the window are suppressed. History is capped at `MAX_HISTORY_SIZE` (default 100).
- **UTM auto-enrichment** — `extractUTMFromURL()`, `storeUTMParams()`, `getStoredUTMParams()`, `getCurrentUTMParams()`, and `initializeUTMTracking()` provide full UTM lifecycle. All client-side events flow through `enrichWithUTM()` automatically.
- **Consent gate** — Every client-side event checks `hasAnalyticsConsent()` before sending. The default implementation returns `true` — replace it with your CMP integration.
- **Debug console logging** — In `development` mode, `logGA4Event()` prints styled `[GA4] event_name (param=value, ...)` messages to the browser console. No events are sent to Google in dev mode.
- **Server-side guard** — `trackServerPurchase`/`trackServerEvent` silently skip (with a console log) when `GA_API_SECRET` is not configured, so they are safe to call even during local development.

---

## Architecture

The analytics system is split into two independent tracking paths — client-side and server-side — connected by shared types, constants, and UTM logic.

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CLIENT-SIDE TRACKER                          │
│                                                                     │
│  ┌──────────┐   ┌─────────────────┐   ┌─────────────────────────┐  │
│  │ Page     │   │  sendEvent()    │   │  gtag.js (window.gtag)  │  │
│  │ Component│──▶│                 │──▶│  Google Analytics 4      │  │
│  │ (hook)   │   │  ┌───────────┐  │   │  (production only)      │  │
│  └──────────┘   │  │ enrich-   │  │   └─────────────────────────┘  │
│                 │  │ WithUTM() │  │                                │
│  ┌──────────┐   │  └─────┬─────┘  │   ┌─────────────────────────┐  │
│  │ Custom   │   │        │        │   │  Debug Console          │  │
│  │ Event    │──▶│  ┌─────▼──────┐ │──▶│  logGA4Event()          │  │
│  │ (code)   │   │  │ isDup-    │ │   │  (dev mode only)        │  │
│  └──────────┘   │  │ licate()  │ │   └─────────────────────────┘  │
│                 │  └─────┬──────┘ │                                │
│  ┌──────────┐   │        │        │   ┌─────────────────────────┐  │
│  │ Purchase │──▶│  ┌─────▼──────┐ │   │  Event History (Map)    │  │
│  │ (form)   │   │  │ record-   │ │   │  deduplication.ts        │  │
│  └──────────┘   │  │ Event()   │ │   └─────────────────────────┘  │
│                 │  └───────────┘ │                                │
│                 └─────────────────┘                                │
│                       │                                            │
│                       ▼                                            │
│            ┌─────────────────────┐                                 │
│            │  UTM Subsystem      │                                 │
│            │                     │                                 │
│            │  extractUTMFromURL()│                                 │
│            │  storeUTMParams()   │──▶ sessionStorage               │
│            │  getCurrentUTMParams│                                 │
│            └─────────────────────┘                                 │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  Web Vitals (useWebVitals hook)                              │   │
│  │                                                              │   │
│  │  onCLS ──▶ handleMetric() ──▶ trackCustomEvent(web_vitals)   │   │
│  │  onLCP ──▶ handleMetric() ──▶ trackCustomEvent(web_vitals)   │   │
│  │  onINP ──▶ handleMetric() ──▶ trackCustomEvent(web_vitals)   │   │
│  │  onFCP ──▶ handleMetric() ──▶ trackCustomEvent(web_vitals)   │   │
│  │  onTTFB ─▶ handleMetric() ──▶ trackCustomEvent(web_vitals)   │   │
│  │              │                                               │   │
│  │              ├── Poor? ──▶ trackCustomEvent(performance_alert)│   │
│  │              └── Slow LCP? ─▶ trackCustomEvent(slow_lcp)     │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                        SERVER-SIDE TRACKER                          │
│                                                                     │
│  ┌──────────────┐   ┌─────────────────┐   ┌─────────────────────┐  │
│  │ Server Action │   │ sendMeasurement │   │ Measurement         │  │
│  │ or Route      │──▶│ Event()         │──▶│ Protocol API        │  │
│  │ Handler       │   │                 │   │ POST /mp/collect    │  │
│  └──────────────┘   │ client_id +      │   │ ?measurement_id=    │  │
│                     │ events[]         │   │ &api_secret=        │  │
│                     └─────────────────┘   └─────────────────────┘  │
│                                                                     │
│  Functions:                                                         │
│    trackServerPurchase(params, clientId?)                           │
│    trackServerEvent(name, params, clientId?)                        │
│                                                                     │
│  Guards:                                                            │
│    isConfigured() — skips if GA_API_SECRET is missing               │
│    clientId fallback — crypto.randomUUID() on server                │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                        SHARED LAYER                                │
│                                                                     │
│  constants.ts  ── DEDUP_WINDOW_MS, THRESHOLDS, UTM_KEYS, etc.     │
│  enums.ts      ── GA4Event, WebVitalsMetricName, PerfRating, etc. │
│  types.ts      ── IPurchaseParams, IUTMParameters, IEventRecord    │
│  cookie-consent.ts ── hasAnalyticsConsent()                        │
│  env.ts         ── NEXT_PUBLIC_GA_MEASUREMENT_ID, GA_API_SECRET   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Setup

### Environment Variables

All GA4 configuration is managed through validated environment variables in `src/lib/env.ts`. All values are optional — the system degrades gracefully when they are not set.

| Variable | Type | Required | Description |
|----------|------|----------|-------------|
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | string | No | Your GA4 Measurement ID (e.g., `G-XXXXXXXXXX`). Client-side tracking is enabled only when this is set **and** the app is in production mode. |
| `NEXT_PUBLIC_GA_ENDPOINT` | string | No | Custom Measurement Protocol endpoint URL. Defaults to `https://www.google-analytics.com/mp/collect`. Override for proxying or testing. |
| `GA_API_SECRET` | string | No | GA4 Measurement Protocol API Secret. Required for server-side tracking. Create one in GA4 Admin > Data Streams > Measurement Protocol API Secrets. |

**Example `.env.local`:**

```env
# GA4 Client-side
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX

# GA4 Server-side (Measurement Protocol)
GA_API_SECRET=your_api_secret_here

# Optional: custom endpoint for proxying
# NEXT_PUBLIC_GA_ENDPOINT=https://www.google-analytics.com/mp/collect
```

**Important:** `NEXT_PUBLIC_GA_MEASUREMENT_ID` is the only client-exposed variable (prefixed with `NEXT_PUBLIC_`). The `GA_API_SECRET` is server-only and must never be exposed to the browser.

### Analytics Constants

Key tunables in `src/lib/constants.ts` (under the `ANALYTICS` object):

| Constant | Default | Description |
|----------|---------|-------------|
| `DEDUP_WINDOW_MS` | `2000` | Time window (ms) within which duplicate events are suppressed |
| `MAX_HISTORY_SIZE` | `100` | Max in-memory event signatures stored for dedup |
| `WEB_VITALS_LOAD_DELAY_MS` | `2500` | Delay before loading the `web-vitals` library (defers to after LCP) |
| `UTM_KEYS` | `[utm_source, utm_medium, utm_campaign, utm_term, utm_content]` | UTM parameters tracked |
| `UTM_STORAGE_KEY` | `"app_utm_params"` | sessionStorage key for persisted UTM data |
| `UTM_EXPIRY_HOURS` | `24` | Hours before stored UTM params are considered stale and cleared |
| `THRESHOLDS` | LCP: 2500/4000, CLS: 0.1/0.25, INP: 200/500, FCP: 1800/3000, TTFB: 800/1800 | Web Vitals thresholds (good / needs-improvement) in their respective units |

---

## Core Modules Reference

All analytics modules live under `src/lib/analytics/`. The barrel export at `src/lib/analytics/index.ts` re-exports every public function.

### `client.ts` — Client-Side GA4 Tracking

Functions that run in the browser, sending events via `window.gtag()`.

```typescript
import {
  trackPageView,
  trackPurchase,
  trackCustomEvent,
} from "@/lib/analytics";
```

| Function | Description |
|----------|-------------|
| `trackPageView(params?)` | Fires a `page_view` event. Optional overrides for `page_location` and `page_title`. Enriched with UTM params. |
| `trackPurchase(params)` | Fires a `purchase` event with e-commerce data. Takes `IPurchaseParams`. Enriched with UTM params. |
| `trackCustomEvent(name, params)` | Fires an arbitrary event. Name must be a string; params must be `Record<string, unknown>`. Enriched with UTM params. |

**Flow (all functions):**

1. Guard: skip if `typeof window === "undefined"` (SSR safety).
2. Enrich: `enrichWithUTM()` merges current UTM params into the event payload.
3. Log: `logGA4Event()` prints styled console output in dev mode.
4. Gate: `isGAEnabled()` checks production mode, measurement ID presence, and consent.
5. Dedup: `isDuplicate()` checks if an identical event (name + sorted params) was sent within `DEDUP_WINDOW_MS`. If so, the event is dropped.
6. Send: If all gates pass, `window.gtag("event", name, params)` is called.
7. Record: `recordEvent()` stores the event signature for future dedup checks.

### `server.ts` — Server-Side GA4 via Measurement Protocol

Server-only functions that send events directly to the Measurement Protocol API.

```typescript
import { trackServerPurchase, trackServerEvent } from "@/lib/analytics";
```

| Function | Description |
|----------|-------------|
| `trackServerPurchase(params, clientId?)` | Sends a `purchase` event from the server. Maps `IPurchaseParams` to the Measurement Protocol payload format. Returns `Promise<boolean>`. |
| `trackServerEvent(name, params, clientId?)` | Sends an arbitrary event from the server. Trims the event name, guards against empty names. Returns `Promise<boolean>`. |

**Flow:**

1. Guard: `isConfigured()` returns `false` if `GA_MEASUREMENT_ID` or `GA_API_SECRET` is missing.
2. Build payload: wraps the event in `IMeasurementEventPayload` format with `client_id` and `engagement_time_msec`.
3. POST: sends to `GA_ENDPOINT?measurement_id=...&api_secret=...`.
4. Return: `true` on 2xx, `false` on failure (error logged to server console).

Both functions accept an optional `clientId` parameter. Pass the client-side client ID (from `gtag('get', ...)`) to correlate server events with the user's client-side session. If omitted, a UUID v4 is generated server-side.

### `utm.ts` — UTM Parameter Extraction & Persistence

```typescript
import {
  extractUTMFromURL,
  storeUTMParams,
  getStoredUTMParams,
  getCurrentUTMParams,
  initializeUTMTracking,
} from "@/lib/analytics";
```

| Function | Description |
|----------|-------------|
| `extractUTMFromURL(url?)` | Parses UTM params from the current or provided URL. Returns `IUTMParameters`. SSR-safe — returns `{}` on server. |
| `storeUTMParams(params)` | Persists UTM params to `sessionStorage` with a timestamp. Only stores if at least one UTM key has a truthy value. |
| `getStoredUTMParams()` | Retrieves UTM params from `sessionStorage`. Validates the stored object shape and checks expiry (`UTM_EXPIRY_HOURS`). Returns `{}` if stale, malformed, or absent. |
| `getCurrentUTMParams()` | First tries to extract UTM from the current URL. If present, stores them and returns. Otherwise, falls back to stored params. This is the function used internally by `enrichWithUTM()`. |
| `initializeUTMTracking()` | Convenience wrapper around `getCurrentUTMParams()`. Call on app load to pre-populate UTM data. |

**UTM Lifecycle:**

```
User arrives with UTM params
  └─▶ extractUTMFromURL() finds utm_source, utm_medium, etc.
      └─▶ storeUTMParams() writes to sessionStorage with timestamp
          └─▶ User navigates to page without UTM params
              └─▶ getCurrentUTMParams() → getStoredUTMParams()
                  └─▶ Returns stored params (if within 24h expiry)
                      └─▶ enrichWithUTM() merges into every event
```

### `deduplication.ts` — Client-Side Event Deduplication

```typescript
import { isDuplicate, recordEvent, clearEventHistory } from "@/lib/analytics";
```

| Function | Description |
|----------|-------------|
| `isDuplicate(eventName, params)` | Generates a deterministic signature from the event name and sorted params, then checks if a record with that signature exists within `DEDUP_WINDOW_MS`. Returns `boolean`. |
| `recordEvent(eventName, params)` | Generates a signature and stores it in the in-memory `Map` with the current timestamp. Triggers cleanup if history exceeds `MAX_HISTORY_SIZE`. |
| `clearEventHistory()` | Empties the entire dedup history. Useful for testing or session reset. |

Deduplication uses an in-memory `Map<string, IEventRecord>` (not persisted across page loads). The signature is `"eventName::{"alpha_sorted_keys":"values"}"`. When the history map reaches capacity, a scavenger pass removes entries older than `DEDUP_WINDOW_MS`. If still over capacity, the single oldest entry is evicted.

### `debug.ts` — Dev-Mode Logging

```typescript
import { logAnalyticsEvent, logGA4Event } from "@/lib/analytics";
```

| Function | Description |
|----------|-------------|
| `logAnalyticsEvent({ platform, event, params, eventId })` | Generic styled console logger. Only executes in `development` mode. Formats params as `key="value"` pairs. |
| `logGA4Event(event, params?)` | Convenience wrapper that calls `logAnalyticsEvent` with `platform: "GA4"`. |

Output in development mode browser console:

```
GA4 page_view (page_location="https://example.com", utm_source="google")
GA4 purchase (transaction_id="txn_123", value=99.99, currency="USD")
```

Styled with a blue Google-branded background on the `GA4` label.

### `web-vitals.ts` — Real-User Performance Monitoring

```typescript
import { useWebVitals } from "@/lib/analytics";
```

A React hook (client component) that registers `web-vitals` callbacks and maps them to GA4 custom events.

**Metrics tracked:**

| Metric | Enum | Threshold (good / needs-improvement) | Unit |
|--------|------|--------------------------------------|------|
| CLS | `WebVitalsMetricName.Cls` | 0.1 / 0.25 | Score (×1000 in event) |
| FCP | `WebVitalsMetricName.Fcp` | 1800 / 3000 | ms |
| INP | `WebVitalsMetricName.Inp` | 200 / 500 | ms |
| LCP | `WebVitalsMetricName.Lcp` | 2500 / 4000 | ms |
| TTFB | `WebVitalsMetricName.Ttfb` | 800 / 1800 | ms |

**Events fired (via `GA4Event` enum):**

| Event | Condition | Params |
|-------|-----------|--------|
| `web_vitals` | Every metric report | `metric_name`, `metric_value`, `metric_rating`, `metric_delta`, `metric_id` |
| `performance_alert` | When `metric_rating === "poor"` | `alert_type: "poor_performance"`, `metric_name`, `metric_value`, `metric_rating` |
| `slow_lcp` | When LCP > 4000ms (needs-improvement threshold) | `lcp_value`, `lcp_rating`, `alert_type: "slow_lcp"` |

---

## Implementation Guide

### 1. Install the `web-vitals` dependency (optional)

Only needed if you plan to use `useWebVitals()`. The library is loaded dynamically via `import("web-vitals")` at runtime, but it must be in your `package.json`.

```bash
bun add web-vitals
```

### 2. Add `useWebVitals` to the root layout

The hook should be mounted once at the application root. Create a client component wrapper if your root layout is a Server Component.

**`src/app/layout.tsx`:**

```typescript
import RootLayoutClient from "@/components/app/atoms/root-layout-client";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <RootLayoutClient />
        {children}
      </body>
    </html>
  );
}
```

**`src/components/app/atoms/root-layout-client.tsx`:**

```typescript
"use client";

import { useWebVitals } from "@/lib/analytics";

export default function RootLayoutClient() {
  useWebVitals();
  return null;
}
```

The `useWebVitals` hook loads the `web-vitals` library after a 2500ms delay (configurable via `ANALYTICS.WEB_VITALS_LOAD_DELAY_MS`) to avoid competing with critical rendering. It then registers all five metric callbacks.

### 3. Add the GA4 script to the root layout

GA4's `gtag.js` script must be loaded once. Add it to the `<head>` or end of `<body>` in your root layout.

**`src/app/layout.tsx`:**

```typescript
import { GA4Script } from "@/components/app/atoms/ga4-script";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <GA4Script />
        {children}
      </body>
    </html>
  );
}
```

**`src/components/app/atoms/ga4-script.tsx`:**

```typescript
"use client";

import { GA_MEASUREMENT_ID } from "@/lib/analytics/client";

export function GA4Script() {
  if (!GA_MEASUREMENT_ID) return null;

  return (
    <>
      <script
        async
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
      />
      <script
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}');
          `,
        }}
      />
    </>
  );
}
```

> **Note:** The `GA_MEASUREMENT_ID` constant is exported from `src/lib/analytics/client.ts` and reads from `env.NEXT_PUBLIC_GA_MEASUREMENT_ID`. When unset, the component renders nothing.

### 4. Track page views on route change

For client-side navigation (App Router), subscribe to route changes in a layout component. Since Next.js 16 App Router does not expose a built-in route change event, the recommended approach is to call `trackPageView()` from page components or use a client component in the layout with the `usePathname` hook.

**`src/components/app/atoms/page-view-tracker.tsx`:**

```typescript
"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { trackPageView } from "@/lib/analytics";

export function PageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const url = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;
    trackPageView({
      page_location: url,
      page_title: document.title,
    });
  }, [pathname, searchParams]);

  return null;
}
```

Mount this once in your root layout alongside `RootLayoutClient`.

### 5. Track custom events in components

Call `trackCustomEvent` from any client component in response to user actions:

```typescript
"use client";

import { trackCustomEvent } from "@/lib/analytics";

function NewsletterSignup() {
  function handleSubmit(email: string) {
    trackCustomEvent("newsletter_signup", { email_domain: email.split("@")[1] });
    // ... form submission logic
  }

  return <form onSubmit={/* ... */}>...</form>;
}
```

Event names should follow GA4 naming conventions: `snake_case` with no spaces. Params should be flat key-value pairs with primitive values (strings, numbers, booleans).

---

## Usage Patterns

### Page Views

**Automatic tracking (recommended):** Use the `PageViewTracker` component mounted in your root layout. It fires a `page_view` event on every route change, enriched with the current URL path + search params and any active UTM parameters.

```typescript
// In root layout:
<PageViewTracker />
```

**Manual tracking:** Call `trackPageView()` directly in a page or component:

```typescript
import { trackPageView } from "@/lib/analytics";

// Inside a component:
trackPageView({
  page_location: "/products/special-offer",
  page_title: "Special Offer - My Site",
});
```

### Custom Events

Any user interaction can be tracked with `trackCustomEvent`. The event name becomes the GA4 event name, and the params become the event parameters.

```typescript
import { trackCustomEvent } from "@/lib/analytics";

// Button click
trackCustomEvent("button_click", {
  button_id: "cta-hero",
  button_text: "Get Started",
  page_section: "hero",
});

// Form interaction
trackCustomEvent("form_step_completed", {
  form_name: "checkout",
  step_number: 2,
  step_name: "shipping",
});

// Search
trackCustomEvent("search_performed", {
  search_term: "wireless headphones",
  result_count: 42,
});
```

**Rules for custom event names:**
- Use `snake_case`.
- Max 40 characters.
- Avoid Personally Identifiable Information (PII) in event names or params.
- Prefix with your app name if you use multiple tracking systems.

### Purchase Tracking (Client + Server)

For maximum reliability, fire the purchase event **both** client-side (for real-time reporting) and server-side (for authoritative revenue attribution).

**Step 1: Client-side (on the thank-you/confirmation page):**

```typescript
"use client";

import { useEffect } from "react";
import { trackPurchase } from "@/lib/analytics";

function OrderConfirmation({ order }: { order: IOrderData }) {
  useEffect(() => {
    trackPurchase({
      transaction_id: order.id,
      value: order.total,
      currency: "USD",
      tax: order.tax,
      shipping: order.shipping,
      items: order.items.map((item) => ({
        item_id: item.sku,
        item_name: item.name,
        item_category: item.category,
        price: item.price,
        quantity: item.quantity,
      })),
    });
  }, [order]);

  return <div>Thank you for your order!</div>;
}
```

**Step 2: Server-side (in the order confirmation server action):**

```typescript
import { trackServerPurchase } from "@/lib/analytics";

export async function confirmOrder(orderId: string) {
  const order = await getOrder(orderId);

  // Fire server-side purchase event
  await trackServerPurchase({
    transaction_id: order.id,
    value: order.total,
    currency: "USD",
    tax: order.tax,
    shipping: order.shipping,
    items: order.items.map((item) => ({
      item_id: item.sku,
      item_name: item.name,
      item_category: item.category,
      price: item.price,
      quantity: item.quantity,
    })),
  });

  return { success: true };
}
```

**Why both?** Client-side events can be lost due to ad blockers, network interruptions, or users closing the page before the event fires. Server-side events are more authoritative since they fire after the server confirms the transaction. The `clientId` parameter can be passed from client to server to correlate both events to the same user.

### Web Vitals

Web Vitals are automatically tracked by mounting `useWebVitals()` once in your root layout. The hook handles:

1. **Delayed loading** — The `web-vitals` library is loaded via dynamic `import()` after a configurable delay (2500ms), ensuring it does not compete with page rendering.
2. **Metric collection** — All five Core Web Vitals (CLS, LCP, INP, FCP, TTFB) are registered.
3. **Rating classification** — Each metric is classified as `good`, `needs-improvement`, or `poor` based on the thresholds in `ANALYTICS.THRESHOLDS`.
4. **Alerting** — Poor ratings trigger a `performance_alert` event. LCP exceeding the needs-improvement threshold (4000ms) triggers a dedicated `slow_lcp` event.

View the collected metrics in GA4 under Events > `web_vitals`, `performance_alert`, and `slow_lcp`.

---

## Best Practices

### Consent-First Tracking

The `hasAnalyticsConsent()` function in `src/lib/cookie-consent.ts` is the single gate for all client-side tracking. The default implementation returns `true` (analytics allowed). Integrate with your Consent Management Platform (CMP):

```typescript
// src/lib/cookie-consent.ts
export function hasAnalyticsConsent(): boolean {
  if (typeof window === "undefined") return false;

  const consent = localStorage.getItem("consent_preferences");
  if (!consent) return false;

  try {
    const parsed = JSON.parse(consent);
    return parsed.analytics === true;
  } catch {
    return false;
  }
}
```

When consent is denied, `isGAEnabled()` returns `false` and all `sendEvent()` calls return before hitting `gtag`. The debug logger still fires in dev mode regardless of consent, so you can verify events during development.

### Deduplication Windows

The default dedup window (`DEDUP_WINDOW_MS`: 2000ms) prevents duplicate events from rapid interactions — e.g., double-clicks on a purchase button, React Strict Mode double-mounts in development, or analytics scripts re-firing on route changes.

**Tuning guidelines:**

| Scenario | Recommended Window | Rationale |
|----------|-------------------|-----------|
| Default (general use) | 2000ms | Balances safety with accuracy |
| Page views only | 5000ms | Page navigation rarely fires twice within 5s |
| High-frequency interactions | 500ms | Search-as-you-type or slider events need shorter windows |
| Purchase/submit events | 3000ms | Longer window to catch double-submits |

Adjust in `src/lib/constants.ts`:

```typescript
export const ANALYTICS = {
  DEDUP_WINDOW_MS: 2000, // Adjust as needed
  // ...
} as const;
```

**Important:** The dedup history is in-memory only and resets on page load. If the user navigates to a new page (full navigation, not client-side), the history is empty and events will fire fresh.

### UTM Expiry

UTM parameters are stored in `sessionStorage` with a default expiry of 24 hours (`UTM_EXPIRY_HOURS: 24`). This means:

- UTM attribution persists across pages within the same browser tab.
- Closing the tab clears `sessionStorage`, so a new session starts fresh.
- After 24 hours of continuous use (unlikely but possible), stored UTM params are considered stale and discarded.

Adjust the expiry in `src/lib/constants.ts`:

```typescript
export const ANALYTICS = {
  UTM_EXPIRY_HOURS: 48, // Extend attribution window to 48 hours
  // ...
} as const;
```

### Error Handling

The analytics system uses a fail-silent approach:

- **Client-side:** All guards (window undefined, no measurement ID, no consent, dedup match) return early without throwing. Errors from `window.gtag` are not caught — GA4's gtag.js handles its own errors internally.
- **Server-side:** `trackServerPurchase` and `trackServerEvent` return `boolean`. Errors are logged to the server console with `console.error` but never thrown. `sendMeasurementEvent` catches fetch failures and returns `false`.

This means you can call analytics functions without try/catch wrappers. They are safe to use anywhere in your component tree.

### Event Naming Convention

- Use `snake_case` for all event names and parameter keys.
- Prefix event names with your domain if using shared GA4 properties: `app_login`, `app_tutorial_complete`.
- Parameter values should be primitives (string, number, boolean). Avoid nested objects — flatten them.
- Never send PII (email, name, phone) in event parameters.

### Development Workflow

1. Set `NEXT_PUBLIC_GA_MEASUREMENT_ID` to your dev GA4 property (or leave unset).
2. Run `bun run dev` — events appear in the browser console with styled `[GA4]` output.
3. Verify event structure by inspecting the console log.
4. No real events are sent to Google in `development` mode — `isGAEnabled()` checks `process.env.NODE_ENV === "production"`.
5. For server-side testing, temporarily set `GA_API_SECRET` in `.env.local` and inspect server logs for the `[GA4 Server]` output.

---

## Testing & Debugging

### Dev Mode Console Logging

When running in development mode (`bun run dev`), every analytics function logs styled output to the browser console:

```
GA4 page_view (page_location="/products", page_title="Products - My Site")
GA4 custom_event (button_id="cta-hero", button_text="Get Started")
GA4 purchase (transaction_id="txn_abc123", value=49.99, currency="USD")
GA4 web_vitals (metric_name="LCP", metric_value=2134, metric_rating="good")
```

The `logGA4Event` function in `src/lib/analytics/debug.ts` formats this output with:

- **`%cGA4%c`** — Blue background (`#4285F4`) with white text for the platform tag.
- **Event name** — Plain text.
- **Params** — Styled italic gray, truncated to non-empty values only.

### Verifying Events in Production

1. **GA4 DebugView** — Enable Google Analytics DebugView in your GA4 property (Admin > DebugView). Then load your site with `?gtm_debug=x` or use the GA4 Chrome extension to see real-time events.

2. **GA4 Realtime Report** — In GA4, navigate to Reports > Realtime. Events should appear within seconds of firing.

3. **GA4 Events Report** — For historical data, check Reports > Engagement > Events.

### Verifying Server-Side Events

Server-side events do not appear in the browser console since they fire from the server. To verify:

1. Check your server logs for `[GA4 Server]` messages.
2. Use GA4 DebugView if you pass a consistent `clientId` from the client.
3. Check the GA4 Realtime report for the `purchase` event (server-side only events).

### Testing Deduplication

Open the browser console in dev mode and rapidly call:

```typescript
trackCustomEvent("test_event", { key: "value" });
trackCustomEvent("test_event", { key: "value" });
trackCustomEvent("test_event", { key: "value" });
```

You should see only one event logged. Subsequent calls within the `DEDUP_WINDOW_MS` (2000ms) window are suppressed. Wait 2+ seconds and call it again — it fires again.

### Testing UTM Persistence

1. Visit your site with UTM params: `https://localhost:3000/?utm_source=google&utm_medium=cpc`.
2. Open `sessionStorage` in DevTools — verify `app_utm_params` is set with the UTM data and a timestamp.
3. Navigate to another page without UTM params.
4. Verify UTM params are still appended to events (check console logs for `utm_source="google"`).
5. Alternatively, clear `sessionStorage` and call `getCurrentUTMParams()` — it should return `{}`.

### Using `clearEventHistory()`

For test suites or manual QA, you can reset the dedup history:

```typescript
import { clearEventHistory } from "@/lib/analytics";

// After each test
clearEventHistory();
```

---

## Troubleshooting

### Events Not Showing in GA4

| Possible Cause | Check |
|---|---|
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` not set | Verify `.env.local` contains the correct ID. |
| Running in development mode | `isGAEnabled()` requires `NODE_ENV === "production"`. Events are only logged to console in dev mode. |
| Ad blocker / browser extension | Disable ad blockers or test in an incognito window. |
| Consent not granted | `hasAnalyticsConsent()` must return `true`. Check the implementation in `src/lib/cookie-consent.ts`. |
| Event deduplicated | Check browser console — if only one event appears from a rapid sequence, dedup is working correctly. Add a longer delay between events. |
| GA4 data processing delay | GA4 can take 24–48 hours to process events. Use DebugView or Realtime for immediate verification. |

### Server-Side Events Not Sending

| Possible Cause | Check |
|---|---|
| `GA_API_SECRET` not set | Verify `.env.local` contains the API secret. |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` not set | Required for server-side events too. |
| Invalid API secret | Re-generate the secret in GA4 Admin > Data Streams > Measurement Protocol API Secrets. |
| CORS / network error | Check server logs for `[GA4 Server]` error messages with HTTP status codes. |
| Event payload too large | Measurement Protocol has a 130KB payload limit. Large item arrays may need batching. |

### UTM Params Not Appearing

| Possible Cause | Check |
|---|---|
| `sessionStorage` cleared | Closing a tab clears `sessionStorage`. Navigate within the same tab. |
| UTM expiry exceeded | Default is 24 hours (`UTM_EXPIRY_HOURS`). Check `ANALYTICS.UTM_EXPIRY_HOURS` in constants. |
| URL parsed incorrectly | `extractUTMFromURL()` uses `new URL(url).searchParams`. Ensure the UTM params are in the query string. |
| SSR rendering | UTM functions are SSR-safe and return `{}` when `window` is undefined. Events on the server won't have UTM enrichment. |

### Web Vitals Not Firing

| Possible Cause | Check |
|---|---|
| `web-vitals` package not installed | Run `bun add web-vitals`. |
| `useWebVitals()` not mounted | Ensure the hook is called in a client component that is rendered on every page. |
| Page loaded too quickly | The hook uses a 2500ms delay (`WEB_VITALS_LOAD_DELAY_MS`). Metrics that fire before the library loads are missed. |
| Browser compatibility | `web-vitals` supports all modern browsers. Check browser console for the `[WebVitals]` error message. |

### Missing `gtag` Function Errors

If you see `Uncaught ReferenceError: gtag is not defined`:

1. Verify `GA4Script` is mounted in your layout and `GA_MEASUREMENT_ID` is set.
2. The `sendEvent` function guards with `typeof window.gtag === "function"`, so this error should not occur from analytics code. If you see it, it may come from other custom gtag calls.
3. Ensure the gtag script is loaded before the analytics events fire. The script is `async` and may not be available immediately on very fast initial loads. The `PageViewTracker` fires on `useEffect`, which runs after paint and hydration, by which point the script should be loaded.

### Console Shows Events in Dev But Not Production

This is expected behavior. The `isGAEnabled()` function checks:

```typescript
process.env.NODE_ENV === "production"
```

In development mode, events are only logged to the console. In production, they are both logged (if debug mode is on) and sent to GA4. To test real GA4 event delivery during development:

1. Set `NODE_ENV=production` temporarily (not recommended — affects other behavior).
2. Use GA4 DebugView with the `gtm_debug` parameter.
3. Or explicitly call `window.gtag("event", ...)` in the console for manual testing.

---

## File Reference

```
src/lib/
├── analytics/
│   ├── index.ts            # Barrel export (all public functions)
│   ├── client.ts           # Client-side GA4: trackPageView, trackPurchase, trackCustomEvent
│   ├── server.ts           # Server-side GA4 (Measurement Protocol): trackServerPurchase, trackServerEvent
│   ├── utm.ts              # UTM extraction, storage, persistence, expiry
│   ├── deduplication.ts    # In-memory event dedup by signature + TTL
│   ├── debug.ts            # Dev-mode styled console logging
│   └── web-vitals.ts       # useWebVitals hook (CLS, LCP, INP, FCP, TTFB)
├── constants.ts            # ANALYTICS config: DEDUP_WINDOW_MS, THRESHOLDS, UTM_KEYS, etc.
├── enums.ts                # GA4Event, WebVitalsMetricName, PerfRating, GA4AlertType
├── types.ts                # IPurchaseParams, IUTMParameters, IEventRecord, IEventSignature, etc.
├── cookie-consent.ts       # hasAnalyticsConsent() — consent gate
└── env.ts                  # NEXT_PUBLIC_GA_MEASUREMENT_ID, GA_API_SECRET, NEXT_PUBLIC_GA_ENDPOINT
```
