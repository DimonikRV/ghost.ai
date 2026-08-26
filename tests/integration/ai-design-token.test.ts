import { describe, expect, it, vi, beforeEach, beforeAll, afterAll } from "vitest";
import prisma from "@/lib/prisma";
import { POST } from "@/app/api/ai/design/token/route";
import { makeJson } from "./helpers";
import { clerkState } from "./clerk-state";
import { createTestProject, createTestTaskRun, cleanupTestData } from "../fixtures/factories";

const OWNER = "user_integration_ai_token";

vi.mock("@trigger.dev/sdk", () => ({
  auth: {
    createPublicToken: vi.fn().mockResolvedValue("tok_public_123"),
  },
}));

beforeAll(async () => {
  await cleanupTestData();
});

afterAll(async () => {
  await cleanupTestData();
  await prisma.$disconnect();
});

describe("POST /api/ai/design/token", () => {
  beforeEach(async () => {
    await cleanupTestData();
    clerkState.userId = OWNER;
  });

  it("returns 401 when unauthenticated", async () => {
    clerkState.userId = null;
    const res = await POST(
      makeJson("/api/ai/design/token", "POST", { runId: "run_123" }),
    );
    expect(res.status).toBe(401);
  });

  it("returns 400 when runId is missing", async () => {
    const res = await POST(
      makeJson("/api/ai/design/token", "POST", {}),
    );
    expect(res.status).toBe(400);
  });

  it("returns 404 when runId does not exist", async () => {
    const res = await POST(
      makeJson("/api/ai/design/token", "POST", { runId: "nonexistent" }),
    );
    expect(res.status).toBe(404);
  });

  it("returns 403 when runId belongs to another user", async () => {
    const project = await createTestProject(OWNER, "Test Project");
    await createTestTaskRun(project.id, "user_integration_other", "run_other");
    const res = await POST(
      makeJson("/api/ai/design/token", "POST", { runId: "run_other" }),
    );
    expect(res.status).toBe(403);
  });

  it("returns token when runId belongs to current user", async () => {
    const project = await createTestProject(OWNER, "Test Project");
    await createTestTaskRun(project.id, OWNER, "run_mine");
    const res = await POST(
      makeJson("/api/ai/design/token", "POST", { runId: "run_mine" }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.token).toBe("tok_public_123");
  });
});
