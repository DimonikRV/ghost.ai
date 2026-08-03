import { task } from "@trigger.dev/sdk";

export const designAgent = task({
  id: "design-agent",
  retry: {
    maxAttempts: 3,
    factor: 2,
    minTimeoutInMs: 1000,
    maxTimeoutInMs: 10000,
    randomize: true,
  },
  run: async (payload: { prompt: string; roomId: string }) => {
    console.log("Design agent task started", {
      prompt: payload.prompt,
      roomId: payload.roomId,
    });

    // TODO: Add AI generation logic here
    return { status: "placeholder", prompt: payload.prompt };
  },
});
