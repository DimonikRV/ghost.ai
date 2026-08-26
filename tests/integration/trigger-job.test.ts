import { describe, expect, it, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/trigger-job/route";
import { makeJson } from "./helpers";
import { clerkState } from "./clerk-state";
import { tasks } from "@trigger.dev/sdk";

vi.mock("@trigger.dev/sdk", () => ({
  tasks: {
    trigger: vi.fn().mockResolvedValue({ id: "run_bg_123" }),
  },
  task: vi.fn().mockImplementation((config: unknown) => config),
}));

describe("POST /api/trigger-job", () => {
  beforeEach(() => {
    clerkState.userId = "user_integration_trigger_job";
  });

  it("triggers background job and returns runId", async () => {
    const res = await POST(
      makeJson("/api/trigger-job", "POST", { type: "cleanup", data: {} }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.runId).toBe("run_bg_123");
  });

  it("uses default type when none provided", async () => {
    const res = await POST(makeJson("/api/trigger-job", "POST", {}));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(tasks.trigger).toHaveBeenCalledWith("background-job", {
      type: "default",
      data: {},
    });
  });
});
