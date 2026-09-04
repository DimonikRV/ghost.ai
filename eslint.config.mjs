import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import clerkNext from "@clerk/eslint-plugin/next";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Standalone dev/CLI scripts (not app code).
    "scripts/**",
    // Agent skills and template assets (not app code).
    ".agents/**",
    // Trigger.dev local dev state (generated build artifacts).
    ".trigger/**",
    // Coverage output.
    "coverage/**",
  ]),
  {
    plugins: {
      "@clerk/next": clerkNext,
    },
    rules: {
      // Require every App Router resource to enforce its own auth check
      // (auth()/auth.protect()), instead of relying on middleware matching.
      "@clerk/next/require-auth-protection": [
        "error",
        {
          protected: ["app/**"],
          public: [
            "app/(auth)/**",
            "app/api/health/**",
            "app/api/trigger-test/**",
            "app/api/trigger-job/**",
          ],
        },
      ],
    },
  },
  {
    files: ["tests/**/*.{ts,tsx}", "**/*.test.{ts,tsx}", "**/*.spec.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/no-unused-vars": "warn",
    },
  },
]);

export default eslintConfig;
