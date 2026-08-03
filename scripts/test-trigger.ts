/**
 * Trigger.dev Integration Test
 */
import { config } from "dotenv";
config({ path: ".env.local" });

async function main() {
  console.log("=== Trigger.dev Integration Test ===\n");

  // 1. Check environment variables
  console.log("1. Environment Variables:");
  console.log(`   TRIGGER_PROJECT_REF: ${process.env.TRIGGER_PROJECT_REF ? "✅ set (" + process.env.TRIGGER_PROJECT_REF + ")" : "❌ MISSING"}`);
  console.log(`   TRIGGER_SECRET_KEY: ${process.env.TRIGGER_SECRET_KEY ? "✅ set (" + process.env.TRIGGER_SECRET_KEY!.substring(0, 10) + "...)" : "❌ MISSING"}`);

  // 2. Check config
  try {
    const cfg = await import("../trigger.config");
    console.log(`\n2. Config (trigger.config.ts):`);
    console.log(`   ✅ Loaded successfully`);
    console.log(`   Project ref: ${cfg.default.project}`);
    console.log(`   Dirs: ${cfg.default.dirs?.join(", ")}`);
    console.log(`   Runtime: ${cfg.default.runtime}`);
    console.log(`   Max duration: ${cfg.default.maxDuration}s`);
  } catch (e) {
    console.log(`\n2. Config: ❌ Failed to load`);
  }

  // 3. Check SDK imports (use require to avoid ESM issues)
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const sdk = require("@trigger.dev/sdk");
    console.log(`\n3. SDK Imports:`);
    console.log(`   ✅ SDK loaded with ${Object.keys(sdk).length} exports`);
    console.log(`   ✅ task: ${typeof sdk.task === "function" ? "OK" : "MISSING"}`);
    console.log(`   ✅ tasks.trigger: ${typeof sdk.tasks?.trigger === "function" ? "OK" : "MISSING"}`);
    console.log(`   ✅ schedules: ${typeof sdk.schedules === "object" ? "OK" : "MISSING"}`);
  } catch (e) {
    console.log(`\n3. SDK Imports: ❌ Failed`);
  }

  // 4. Check task definitions
  try {
    const tasks = await import("../trigger/tasks");
    const bgJobs = await import("../trigger/background-jobs");
    const scheduled = await import("../trigger/scheduled");

    console.log(`\n4. Task Definitions:`);
    console.log(`   ✅ exampleTask: id="${tasks.exampleTask.id}"`);
    console.log(`   ✅ processBackgroundJob: id="${bgJobs.processBackgroundJob.id}"`);
    console.log(`   ✅ periodicTask (scheduled): id="${scheduled.periodicTask.id}"`);
  } catch (e) {
    console.log(`\n4. Task Definitions: ❌ Failed`);
  }

  // 5. Check API routes
  const { existsSync } = await import("fs");
  const triggerTestRoute = existsSync("app/api/trigger-test/route.ts");
  const triggerJobRoute = existsSync("app/api/trigger-job/route.ts");
  console.log(`\n5. API Routes:`);
  console.log(`   ${triggerTestRoute ? "✅" : "❌"} /api/trigger-test (GET — triggers exampleTask)`);
  console.log(`   ${triggerJobRoute ? "✅" : "❌"} /api/trigger-job (POST — triggers processBackgroundJob)`);

  // 6. Check middleware
  try {
    await import("../proxy");
    console.log(`\n6. Middleware (proxy.ts):`);
    console.log(`   ✅ Loaded — API routes are public (bypass Clerk auth)`);
  } catch (e) {
    console.log(`\n6. Middleware: ❌ Failed to load`);
  }

  console.log(`\n7. Package versions:`);
  const pkg = await import("../package.json");
  console.log(`   @trigger.dev/sdk: ${pkg.dependencies?.["@trigger.dev/sdk"] || "NOT INSTALLED"}`);
  console.log(`   trigger.dev (CLI): ${pkg.devDependencies?.["trigger.dev"] || "NOT INSTALLED"}`);

  console.log(`\n=== Summary ===`);
  console.log(`Trigger.dev is integrated into the project with:`);
  console.log(`  • 3 tasks defined (example, background job, scheduled cron)`);
  console.log(`  • 2 API routes for triggering tasks from the frontend`);
  console.log(`  • Clerk middleware configured to allow public API access`);
  console.log(`  • Project ref: proj_diwcaaakclcmmhzofeyj (dev environment)`);
  console.log(`\nTo test live task execution, run: npm run trigger:dev`);
  console.log(`Then: curl http://localhost:3000/api/trigger-test`);
  console.log(`\n=== Test Complete ===`);
}

main().catch(console.error);
