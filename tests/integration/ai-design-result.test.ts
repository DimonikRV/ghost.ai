import { describe, expect, it, vi, beforeEach, beforeAll, afterAll } from "vitest";
import prisma from "@/lib/prisma";
import { GET } from "@/app/api/ai/design/[runId]/result/route";
import { makeGet } from "./helpers";
import { clerkState } from "./clerk-state";
import { createTestProject, createTestTaskRun, cleanupTestData } from "../fixtures/factories";
import { runs } from "@trigger.dev/sdk";

const OWNER = "user_integration_result";

vi.mock("@trigger.dev/sdk", () => ({
  runs: {
    retrieve: vi.fn(),
  },
}));

beforeAll(async () => {
  await cleanupTestData();
});

afterAll(async () => {
  await cleanupTestData();
  await prisma.$disconnect();
});

describe("GET /api/ai/design/[runId]/result", () => {
  beforeEach(async () => {
    await cleanupTestData();
    clerkState.userId = OWNER;
  });

  it("returns 401 when unauthenticated", async () => {
    clerkState.userId = null;
    const res = await GET(makeGet("/api/ai/design/run_1/result"), {
      params: Promise.resolve({ runId: "run_1" }),
    });
    expect(res.status).toBe(401);
  });

  it("returns 404 when runId does not exist", async () => {
    const res = await GET(makeGet("/api/ai/design/run_1/result"), {
      params: Promise.resolve({ runId: "run_1" }),
    });
    expect(res.status).toBe(404);
  });

  it("returns 403 when runId belongs to another user", async () => {
    const project = await createTestProject(OWNER, "Test Project");
    await createTestTaskRun(project.id, "user_integration_other", "run_other");
    const res = await GET(makeGet("/api/ai/design/run_other/result"), {
      params: Promise.resolve({ runId: "run_other" }),
    });
    expect(res.status).toBe(403);
  });

  it("returns 200 with nodes/edges when run is completed", async () => {
    const project = await createTestProject(OWNER, "Test Project");
    await createTestTaskRun(project.id, OWNER, "run_mine");
    const nodes = [
      { id: "n1", type: "canvasNode", position: { x: 10, y: 20 }, data: { label: "A", color: "red", shape: "rectangle" } },
    ];
    const edges = [{ id: "e1", source: "n1", target: "n2", type: "canvasEdge" }];
    vi.mocked(runs.retrieve).mockResolvedValue({
      id: "run_mine",
      isCompleted: true,
      isFailed: false,
      isCancelled: false,
      output: { nodes, edges },
    } as never);

    const res = await GET(makeGet("/api/ai/design/run_mine/result"), {
      params: Promise.resolve({ runId: "run_mine" }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("completed");
    expect(body.nodes).toEqual(nodes);
    expect(body.edges).toEqual(edges);
  });

  it("returns 409 while run is still processing", async () => {
    const project = await createTestProject(OWNER, "Test Project");
    await createTestTaskRun(project.id, OWNER, "run_mine");
    vi.mocked(runs.retrieve).mockResolvedValue({
      id: "run_mine",
      isCompleted: false,
      isFailed: false,
      isCancelled: false,
    } as never);

    const res = await GET(makeGet("/api/ai/design/run_mine/result"), {
      params: Promise.resolve({ runId: "run_mine" }),
    });
    expect(res.status).toBe(409);
  });

  it("returns 500 when run failed", async () => {
    const project = await createTestProject(OWNER, "Test Project");
    await createTestTaskRun(project.id, OWNER, "run_mine");
    vi.mocked(runs.retrieve).mockResolvedValue({
      id: "run_mine",
      isCompleted: false,
      isFailed: true,
      isCancelled: false,
    } as never);

    const res = await GET(makeGet("/api/ai/design/run_mine/result"), {
      params: Promise.resolve({ runId: "run_mine" }),
    });
    expect(res.status).toBe(500);
  });
});