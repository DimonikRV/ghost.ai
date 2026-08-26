import {
  describe,
  expect,
  it,
  vi,
  beforeEach,
  beforeAll,
  afterAll,
} from "vitest";
import prisma from "@/lib/prisma";
import { POST } from "@/app/api/ai/design/route";
import { makeJson } from "./helpers";
import { clerkState } from "./clerk-state";
import { createTestProject, cleanupTestData } from "../fixtures/factories";
import { tasks } from "@trigger.dev/sdk";

const OWNER = "user_integration_ai_design";

vi.mock("@trigger.dev/sdk", () => ({
  tasks: {
    trigger: vi.fn().mockResolvedValue({ id: "run_design_123" }),
  },
}));

beforeAll(async () => {
  await cleanupTestData();
});

afterAll(async () => {
  await cleanupTestData();
  await prisma.$disconnect();
});

describe("POST /api/ai/design", () => {
  beforeEach(async () => {
    await cleanupTestData();
    clerkState.userId = OWNER;
  });

  it("returns 401 when unauthenticated", async () => {
    clerkState.userId = null;
    const res = await POST(
      makeJson("/api/ai/design", "POST", { prompt: "test", roomId: "x" }),
    );
    expect(res.status).toBe(401);
  });

  it("returns 400 when prompt is missing", async () => {
    const project = await createTestProject(OWNER, "Test Project");
    const res = await POST(
      makeJson("/api/ai/design", "POST", { roomId: project.id }),
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 when roomId is missing", async () => {
    const res = await POST(
      makeJson("/api/ai/design", "POST", { prompt: "test" }),
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 when prompt exceeds max length", async () => {
    const project = await createTestProject(OWNER, "Test Project");
    const res = await POST(
      makeJson("/api/ai/design", "POST", {
        prompt: "x".repeat(4001),
        roomId: project.id,
      }),
    );
    expect(res.status).toBe(400);
  });

  it("returns 403 when user has no project access", async () => {
    const project = await createTestProject(
      "user_integration_other",
      "Other Project",
    );
    clerkState.userId = OWNER;
    const res = await POST(
      makeJson("/api/ai/design", "POST", {
        prompt: "test prompt",
        roomId: project.id,
      }),
    );
    expect(res.status).toBe(403);
  });

  it("triggers design agent and creates TaskRun on success", async () => {
    const project = await createTestProject(OWNER, "Test Project");
    const res = await POST(
      makeJson("/api/ai/design", "POST", {
        prompt: "Design a microservices architecture",
        roomId: project.id,
      }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.runId).toBe("run_design_123");

    const taskRun = await prisma.taskRun.findUnique({
      where: { runId: "run_design_123" },
    });
    expect(taskRun).toBeTruthy();
    expect(taskRun!.task).toBe("design-agent");
    expect(taskRun!.projectId).toBe(project.id);
    expect(taskRun!.userId).toBe(OWNER);
  });

  it("returns 502 when triggering design agent fails", async () => {
    const project = await createTestProject(OWNER, "Test Project");
    vi.mocked(tasks.trigger).mockRejectedValueOnce(new Error("Trigger failed"));

    const res = await POST(
      makeJson("/api/ai/design", "POST", {
        prompt: "Design a microservices architecture",
        roomId: project.id,
      }),
    );

    expect(res.status).toBe(502);
  });
});
