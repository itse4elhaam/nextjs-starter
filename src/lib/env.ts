import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url().optional(),
    DATABASE_POOL_SIZE: z.coerce.number().default(10),
    PORT: z.coerce.number().default(3000),
    NODE_ENV: z
      .enum(["production", "development", "test"])
      .default("development"),
    SENTRY_DSN: z.string().url().optional(),
    SENTRY_AUTH_TOKEN: z.string().optional(),
    SENTRY_ORG: z.string().optional(),
    SENTRY_PROJECT: z.string().optional(),
  },

  clientPrefix: "NEXT_PUBLIC_",

  client: {
    NEXT_PUBLIC_API_BASE_URL: z.string().url().default("http://localhost:3000"),
    NEXT_PUBLIC_SITE_URL: z.string().url().default("http://localhost:3000"),
    NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
  },

  runtimeEnv: process.env,

  emptyStringAsUndefined: true,
});
