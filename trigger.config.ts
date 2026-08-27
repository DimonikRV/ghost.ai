import { defineConfig } from "@trigger.dev/sdk";
import { prismaExtension } from "@trigger.dev/build/extensions/prisma";
import { config } from "dotenv";

config({ path: [".env.local", ".env"] });

export default defineConfig({
  project: process.env.TRIGGER_PROJECT_REF!,
  dirs: ["trigger"],
  maxDuration: 3600,
  runtime: "node-24",
  logLevel: "info",
  build: {
    extensions: [prismaExtension({ mode: "modern" })],
  },
  retries: {
    enabledInDev: false,
    default: {
      maxAttempts: 3,
      minTimeoutInMs: 1000,
      maxTimeoutInMs: 10000,
      factor: 2,
      randomize: true,
    },
  },
});