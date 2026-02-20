import { withSentryConfig } from "@sentry/nextjs";
import { createJiti } from "jiti";
import type { NextConfig } from "next";

const jiti = createJiti(import.meta.url);

async function runEnvValidation() {
  await jiti.import("./src/lib/config");
}
runEnvValidation();

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
};

const shouldEnableSentry = Boolean(
  process.env.SENTRY_AUTH_TOKEN &&
    process.env.SENTRY_ORG &&
    process.env.SENTRY_PROJECT,
);

const sentryConfig = {
  disableLogger: true,
  silent: !process.env.CI,
};

const exportConfig = shouldEnableSentry
  ? withSentryConfig(nextConfig, sentryConfig)
  : nextConfig;

export default exportConfig;
