import { task } from "@trigger.dev/sdk";

// Background job example — e.g., process uploaded files, send emails, etc.
export const processBackgroundJob = task({
  id: "background-job",
  retry: {
    maxAttempts: 3,
    factor: 2,
    minTimeoutInMs: 2000,
    maxTimeoutInMs: 30000,
    randomize: true,
  },
  run: async (payload: { type: string; data: Record<string, unknown> }) => {
    console.log(`Processing background job: ${payload.type}`, payload.data);

    // Simulate work
    await new Promise((resolve) => setTimeout(resolve, 2000));

    return {
      type: payload.type,
      processedAt: new Date().toISOString(),
      status: "completed",
    };
  },
});
