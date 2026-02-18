import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url().optional(),
    PORT: z.coerce.number().default(3000),
    NODE_ENV: z
      .enum(["production", "development", "test"])
      .default("development"),
  },

  clientPrefix: "NEXT_PUBLIC_",

  client: {
    NEXT_PUBLIC_API_BASE_URL: z.string().url().default("http://localhost:3000"),
  },

  runtimeEnv: process.env,

  emptyStringAsUndefined: true,
});
