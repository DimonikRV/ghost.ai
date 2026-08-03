import { task } from "@trigger.dev/sdk";

// Example task — replace with your actual background job logic
export const exampleTask = task({
  id: "example-task",
  retry: {
    maxAttempts: 3,
    factor: 2,
    minTimeoutInMs: 1000,
    maxTimeoutInMs: 10000,
    randomize: true,
  },
  run: async (payload: { message: string }) => {
    console.log("Hello from Trigger.dev:", payload.message);
    return { processed: true, message: payload.message };
  },
});
