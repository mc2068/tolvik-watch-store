import { defineConfig } from "vitest/config";

export default defineConfig({
  // Resolve the `@/` alias from tsconfig.json, so tests import like the app does.
  resolve: { tsconfigPaths: true },
  test: {
    // Unit tests sit beside the pure functions they cover; e2e/ belongs to Playwright.
    include: ["src/**/*.test.ts"],
    environment: "node",
  },
});
