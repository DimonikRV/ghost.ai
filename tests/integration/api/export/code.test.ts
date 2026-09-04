import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import prisma from "@/lib/prisma";
import { POST } from "@/app/api/export/code/route";
import { get } from "@vercel/blob";
import { clerkState } from "../../clerk-state";
import { cleanupTestData, makeJson } from "../../helpers";

const OWNER = "user_integration_export_owner";
const OUTSIDER = "user_integration_export_outsider";

vi.mock("@vercel/blob", () => ({
  get: vi.fn(),
  put: vi.fn(),
}));

let projectId: string;

beforeAll(async () => {
  await cleanupTestData();
});

beforeEach(async () => {
  await cleanupTestData();
  clerkState.userId = OWNER;
  clerkState.email = "export-owner@example.com";
  const created = await prisma.project.create({
    data: { ownerId: OWNER, name: "Export Test", nameKey: "export-test" },
  });
  projectId = created.id;
});

describe("POST /api/export/code", () => {
  it("returns 401 without auth", async () => {
    clerkState.userId = null;
    const res = await POST(
      makeJson("/api/export/code", "POST", {
        projectId,
        framework: "spring-boot",
      }),
    );
    expect(res.status).toBe(401);
  });

  it("returns 400 with missing projectId", async () => {
    const res = await POST(
      makeJson("/api/export/code", "POST", {
        framework: "spring-boot",
      }),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/missing/i);
  });

  it("returns 400 with missing framework", async () => {
    const res = await POST(
      makeJson("/api/export/code", "POST", {
        projectId,
      }),
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 with unknown framework", async () => {
    const res = await POST(
      makeJson("/api/export/code", "POST", {
        projectId,
        framework: "nonexistent-framework",
      }),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/unknown framework/i);
  });

  it("returns 403 without project access", async () => {
    clerkState.userId = OUTSIDER;
    clerkState.email = "outsider@example.com";
    const res = await POST(
      makeJson("/api/export/code", "POST", {
        projectId,
        framework: "spring-boot",
      }),
    );
    expect(res.status).toBe(403);
  });

  it("returns 400 when the canvas has no nodes", async () => {
    await prisma.project.update({
      where: { id: projectId },
      data: { canvasJsonPath: "https://blob.test/canvas-empty.json" },
    });

    const emptyCanvas = JSON.stringify({ nodes: [], edges: [] });
    vi.mocked(get).mockResolvedValueOnce({
      url: "https://blob.test/canvas-empty.json",
      statusCode: 200,
      stream: new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode(emptyCanvas));
          controller.close();
        },
      }),
    } as never);

    const res = await POST(
      makeJson("/api/export/code", "POST", {
        projectId,
        framework: "spring-boot",
      }),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/empty/i);
  });
});
