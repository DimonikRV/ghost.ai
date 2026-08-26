import { describe, expect, it, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/trigger-test/route";
import { makeGet } from "./helpers";
import { clerkState } from "./clerk-state";

vi.mock("@trigger.dev/sdk", () => ({
  tasks: {
    trigger: vi.fn().mockResolvedValue({ id: "run_example_123" }),
  },
  task: vi.fn().mockImplementation((config: unknown) => config),
}));

describe("GET /api/trigger-test", () => {
  beforeEach(() => {
    clerkState.userId = "user_integration_trigger_test";
  });

  it("triggers the example task and returns runId", async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.runId).toBe("run_example_123");
  });
});
