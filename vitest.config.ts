import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "server-only": path.resolve(
        __dirname,
        "./src/__tests__/mocks/server-only.ts",
      ),
    },
  },
  test: {
    environment: "node",
    globals: true,
    maxConcurrency: 1,
    fileParallelism: false,
    clearMocks: true,
    restoreMocks: true,
  },
});
