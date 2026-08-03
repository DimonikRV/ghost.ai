import { schedules } from "@trigger.dev/sdk";

// Scheduled task — runs every 2 hours (UTC)
export const periodicTask = schedules.task({
  id: "periodic-cleanup",
  cron: "0 */2 * * *",
  run: async (payload) => {
    console.log("Running periodic task at:", payload.timestamp.toISOString());
    console.log("Timezone:", payload.timezone);
    console.log("Next upcoming runs:", payload.upcoming.slice(0, 3).map((d) => d.toISOString()));

    return {
      ranAt: payload.timestamp.toISOString(),
      timezone: payload.timezone,
    };
  },
});
