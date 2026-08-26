import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname),
    },
  },
  test: {
    environment: "node",
    include: [
      "tests/unit/**/*.test.ts",
      "tests/integration/**/*.test.ts",
      "tests/components/**/*.test.tsx",
    ],
    setupFiles: ["tests/integration/setup.ts"],
    testTimeout: 20_000,
    hookTimeout: 30_000,
    fileParallelism: false,
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov", "json-summary"],
      reportsDirectory: "coverage",
      include: [
        "app/**/*.{ts,tsx}",
        "lib/**/*.ts",
        "hooks/**/*.ts",
        "components/**/*.{ts,tsx}",
      ],
      thresholds: {
        lines: 80,
        branches: 70,
        functions: 65,
        statements: 80,
      },
    },
  },
});
