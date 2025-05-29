import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    PORT: z.coerce.number(),
    NODE_ENV: z.enum(["production", "development"]),
  },

  clientPrefix: "NEXT_PUBLIC_",

  client: {
    NEXT_PUBLIC_API_BASE_URL: z.string().url(),
  },

  runtimeEnv: process.env,

  emptyStringAsUndefined: true,
});
