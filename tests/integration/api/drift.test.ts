import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import prisma from "@/lib/prisma";
import { GET } from "@/app/api/projects/[projectId]/drift/route";
import { get } from "@vercel/blob";
import { clerkState } from "../clerk-state";
import { cleanupTestData, makeGet } from "../helpers";
import { fingerprintCanvas } from "@/lib/export/canvas-hash";

const OWNER = "user_integration_drift_owner";
const OUTSIDER = "user_integration_drift_outsider";

vi.mock("@vercel/blob", () => ({
  get: vi.fn(),
  put: vi.fn(),
}));

let projectId: string;

const nodeA = { id: "n1", data: { label: "API", shape: "rectangle" } };
const nodeB = { id: "n2", data: { label: "DB", shape: "cylinder" } };
const edgeAB = { id: "e1", source: "n1", target: "n2", data: { label: "HTTP" } };

function makeCanvasBlob(nodes: unknown[], edges: unknown[]) {
  return {
    url: "https://blob.test/canvas.json",
    statusCode: 200,
    stream: new ReadableStream({
      start(controller) {
        controller.enqueue(
          new TextEncoder().encode(JSON.stringify({ nodes, edges })),
        );
        controller.close();
      },
    }),
  } as never;
}

beforeAll(async () => {
  await cleanupTestData();
});

beforeEach(async () => {
  await cleanupTestData();
  clerkState.userId = OWNER;
  clerkState.email = "drift-owner@example.com";
  const created = await prisma.project.create({
    data: { ownerId: OWNER, name: "Drift Test", nameKey: "drift-test" },
  });
  projectId = created.id;
});

async function seedCompletedExport(framework: string, nodes: unknown[], edges: unknown[]) {
  return prisma.exportRun.create({
    data: {
      runId: `run_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      projectId,
      userId: OWNER,
      framework,
      status: "completed",
      canvasHash: fingerprintCanvas(nodes, edges),
      blobUrl: "https://blob.test/export.zip",
      completedAt: new Date(),
    },
  });
}

async function pointCanvasAtBlob() {
  await prisma.project.update({
    where: { id: projectId },
    data: { canvasJsonPath: "https://blob.test/canvas.json" },
  });
}

describe("GET /api/projects/:projectId/drift", () => {
  it("returns 401 without auth", async () => {
    clerkState.userId = null;
    const res = await GET(makeGet(`/api/projects/${projectId}/drift`), {
      params: Promise.resolve({ projectId }),
    });
    expect(res.status).toBe(401);
  });

  it("returns 404 for a missing project", async () => {
    const res = await GET(makeGet("/api/projects/nope/drift"), {
      params: Promise.resolve({ projectId: "nope" }),
    });
    expect(res.status).toBe(404);
  });

  it("returns 403 for an outsider", async () => {
    clerkState.userId = OUTSIDER;
    clerkState.email = "outsider@example.com";
    const res = await GET(makeGet(`/api/projects/${projectId}/drift`), {
      params: Promise.resolve({ projectId }),
    });
    expect(res.status).toBe(403);
  });

  it("reports hasExport=false when there are no completed exports", async () => {
    const res = await GET(makeGet(`/api/projects/${projectId}/drift`), {
      params: Promise.resolve({ projectId }),
    });
    const body = await res.json();
    expect(body).toEqual({ hasExport: false, drifted: false });
  });

  it("ignores non-completed exports when deciding hasExport", async () => {
    await prisma.exportRun.create({
      data: {
        runId: "run_pending_drift",
        projectId,
        userId: OWNER,
        framework: "spring-boot",
        status: "pending",
        canvasHash: "abc",
      },
    });
    const res = await GET(makeGet(`/api/projects/${projectId}/drift`), {
      params: Promise.resolve({ projectId }),
    });
    const body = await res.json();
    expect(body).toEqual({ hasExport: false, drifted: false });
  });

  it("reports drifted=false when the canvas matches the last export", async () => {
    await seedCompletedExport("spring-boot", [nodeA, nodeB], [edgeAB]);
    await pointCanvasAtBlob();
    vi.mocked(get).mockResolvedValue(
      makeCanvasBlob([nodeA, nodeB], [edgeAB]),
    );

    const res = await GET(makeGet(`/api/projects/${projectId}/drift`), {
      params: Promise.resolve({ projectId }),
    });
    const body = await res.json();
    expect(body.hasExport).toBe(true);
    expect(body.drifted).toBe(false);
    expect(body.comparable).toBe(true);
    expect(body.framework).toBe("spring-boot");
  });

  it("reports drifted=true when the current canvas changed since export", async () => {
    await seedCompletedExport("spring-boot", [nodeA, nodeB], [edgeAB]);
    await pointCanvasAtBlob();
    // Canvas changed: node label renamed since the export.
    vi.mocked(get).mockResolvedValue(
      makeCanvasBlob(
        [
          { ...nodeA, data: { ...nodeA.data, label: "Gateway" } },
          nodeB,
        ],
        [edgeAB],
      ),
    );

    const res = await GET(makeGet(`/api/projects/${projectId}/drift`), {
      params: Promise.resolve({ projectId }),
    });
    const body = await res.json();
    expect(body.hasExport).toBe(true);
    expect(body.drifted).toBe(true);
  });

  it("filters by framework query param", async () => {
    // A stale docker-compose export exists, but a fresh spring-boot export was
    // completed after it. Scoped to spring-boot, drift should be false.
    await seedCompletedExport("docker-compose", [nodeA], []);
    await seedCompletedExport(
      "spring-boot",
      [nodeA, nodeB],
      [edgeAB],
    );
    await pointCanvasAtBlob();
    vi.mocked(get).mockResolvedValue(
      makeCanvasBlob([nodeA, nodeB], [edgeAB]),
    );

    const scoped = await GET(
      makeGet(`/api/projects/${projectId}/drift?framework=spring-boot`),
      { params: Promise.resolve({ projectId }) },
    );
    const scopedBody = await scoped.json();
    expect(scopedBody.framework).toBe("spring-boot");
    expect(scopedBody.drifted).toBe(false);
  });

  it("reports drifted=false when the current canvas cannot be read", async () => {
    await seedCompletedExport("spring-boot", [nodeA, nodeB], [edgeAB]);
    await pointCanvasAtBlob();
    vi.mocked(get).mockRejectedValue(new Error("blob missing"));

    const res = await GET(makeGet(`/api/projects/${projectId}/drift`), {
      params: Promise.resolve({ projectId }),
    });
    const body = await res.json();
    expect(body.hasExport).toBe(true);
    expect(body.drifted).toBe(false);
    expect(body.comparable).toBe(false);
  });
});
