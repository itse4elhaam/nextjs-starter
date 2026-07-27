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
    exclude: ["e2e/**", "**/node_modules/**", ".next/**"],
    environment: "node",
    globals: true,
    setupFiles: [path.resolve(__dirname, "./src/__tests__/setup.ts")],
    sequence: { hooks: "stack" },
    maxConcurrency: 1,
    fileParallelism: false,
    clearMocks: true,
    restoreMocks: true,
  },
});
