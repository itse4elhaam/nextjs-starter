import { env } from "@/lib/env";

// ─── Site ─────────────────────────────────────────────────────────────────

export const SITE_URL = env.NEXT_PUBLIC_SITE_URL.replace(/\/+$/u, "");

// ─── Revalidation ─────────────────────────────────────────────────────────

export const PAGE_REVALIDATE = {
  never: false,
  oneMinute: 60,
  fiveMinutes: 300,
  fifteenMinutes: 900,
  thirtyMinutes: 1800,
  oneHour: 3600,
  oneDay: 86400,
} as const;
