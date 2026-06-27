// ─── HTTP ───────────────────────────────────────────────────────────────────

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

// ─── SEO ───────────────────────────────────────────────────────────────────

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

// ─── Page Routes (single source of truth) ─────────────────────────────────

export const ROUTES = {
  HOME: "/",
  API: {
    EXAMPLES: "/api/examples",
    EXAMPLE_BY_ID: (id: number | string) => `/api/examples/${id}`,
  },
} as const;

// ─── Form Field Names (NEVER hardcode strings) ──────────────────────────

export const FORM_FIELDS = {
  example: {
    NAME: "name",
    EMAIL: "email",
  },
} as const;

// ─── Search Param Keys ────────────────────────────────────────────────────

export const SEARCH_PARAM_KEYS = {
  PAGE: "page",
  LIMIT: "limit",
  QUERY: "q",
  SORT: "sort",
} as const;

// ─── Pagination ───────────────────────────────────────────────────────────

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  DEFAULT_PAGE: 1,
} as const;

// ─── Duration / TTL ───────────────────────────────────────────────────────

export const DURATION = {
  ONE_MINUTE_MS: 60_000,
  FIVE_MINUTES_MS: 300_000,
  FIFTEEN_MINUTES_MS: 900_000,
  ONE_HOUR_MS: 3_600_000,
  ONE_DAY_MS: 86_400_000,
  ONE_WEEK_MS: 604_800_000,
} as const;

export const ISR_REVALIDATE = {
  NEVER: false,
  ONE_MINUTE: 60,
  FIVE_MINUTES: 300,
  FIFTEEN_MINUTES: 900,
  THIRTY_MINUTES: 1800,
  ONE_HOUR: 3600,
  ONE_DAY: 86400,
} as const;

// ─── Analytics ────────────────────────────────────────────────────────────

export const ANALYTICS = {
  DEDUP_WINDOW_MS: 2000,
  MAX_HISTORY_SIZE: 100,
  WEB_VITALS_LOAD_DELAY_MS: 2_500,
  UTM_KEYS: [
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_term",
    "utm_content",
  ] as const,
  UTM_STORAGE_KEY: "app_utm_params",
  UTM_EXPIRY_HOURS: 24,
  THRESHOLDS: {
    LCP: { good: 2500, needsImprovement: 4000 },
    CLS: { good: 0.1, needsImprovement: 0.25 },
    INP: { good: 200, needsImprovement: 500 },
    FCP: { good: 1800, needsImprovement: 3000 },
    TTFB: { good: 800, needsImprovement: 1800 },
  },
  ERROR_MESSAGES: {
    WEB_VITALS_LOAD_FAILED: "[WebVitals] Failed to load web-vitals library:",
  },
} as const;

// ─── Motion Design Tokens ─────────────────────────────────────────────────

export const MOTION = {
  FAST: "150ms",
  BASE: "300ms",
  SLOW: "500ms",
  CRAWL: "1200ms",
  EASE_ORGANIC: "cubic-bezier(0.22, 1, 0.36, 1)",
  EASE_SPRING: "cubic-bezier(0.34, 1.56, 0.64, 1)",
} as const;
