import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import prisma from "@/lib/prisma";
import { GET } from "@/app/api/export/code/[runId]/download/route";
import { clerkState } from "../../clerk-state";
import { cleanupTestData } from "../../helpers";
import { runs } from "@trigger.dev/sdk";
import { get } from "@vercel/blob";

const OWNER = "user_integration_download_owner";
const OTHER = "user_integration_download_other";

const RUN_ID = "run_dl_test_1";

let runId: string;
let projectId: string;

vi.mock("@trigger.dev/sdk", () => ({
  runs: {
    retrieve: vi.fn(),
  },
}));

vi.mock("@vercel/blob", () => ({
  get: vi.fn(),
}));

beforeAll(async () => {
  await cleanupTestData();
});

beforeEach(async () => {
  await cleanupTestData();
  clerkState.userId = OWNER;
  clerkState.email = "dl-owner@example.com";

  const project = await prisma.project.create({
    data: { ownerId: OWNER, name: "DL Test", nameKey: "dl-test" },
  });
  projectId = project.id;

  const run = await prisma.exportRun.create({
    data: {
      runId: RUN_ID,
      projectId: project.id,
      userId: OWNER,
      framework: "spring-boot",
      status: "completed",
      blobUrl: "https://blob.test/test.zip",
    },
  });
  runId = run.runId;
});

async function createPendingRun(opts: {
  status?: string;
  createdAt?: Date;
  runId?: string;
}) {
  return prisma.exportRun.create({
    data: {
      runId: opts.runId ?? `run_pending_${Date.now()}`,
      projectId,
      userId: OWNER,
      framework: "spring-boot",
      status: opts.status ?? "pending",
      createdAt: opts.createdAt ?? new Date(),
    },
  });
}

function params(runId: string) {
  return { params: Promise.resolve({ runId }) };
}

describe("GET /api/export/code/[runId]/download", () => {
  it("returns 401 without auth", async () => {
    clerkState.userId = null;
    const res = await GET(new Request("http://localhost"), params(runId));
    expect(res.status).toBe(401);
  });

  it("returns 404 for a non-existent runId", async () => {
    const res = await GET(
      new Request("http://localhost"),
      params("run_does_not_exist"),
    );
    expect(res.status).toBe(404);
  });

  it("returns 403 for a run belonging to another user", async () => {
    clerkState.userId = OTHER;
    clerkState.email = "other@example.com";
    const res = await GET(new Request("http://localhost"), params(runId));
    expect(res.status).toBe(403);
  });

  it("returns a pending status envelope while processing", async () => {
    const pending = await createPendingRun({
      status: "pending",
      createdAt: new Date(Date.now() - 60_000),
    });
    vi.mocked(runs.retrieve).mockResolvedValue({
      id: pending.runId,
      isCompleted: false,
      isFailed: false,
      isCancelled: false,
      status: "QUEUED",
    } as never);

    const res = await GET(
      new Request("http://localhost"),
      params(pending.runId),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("pending");
    const after = await prisma.exportRun.findUnique({
      where: { runId: pending.runId },
    });
    expect(after?.status).toBe("pending");
  });

  it("reports failed after the queue timeout for a hung pending run", async () => {
    const pending = await createPendingRun({
      status: "pending",
      createdAt: new Date(Date.now() - 6 * 60 * 1000),
    });
    vi.mocked(runs.retrieve).mockResolvedValue({
      id: pending.runId,
      isCompleted: false,
      isFailed: false,
      isCancelled: false,
      status: "QUEUED",
    } as never);

    const res = await GET(
      new Request("http://localhost"),
      params(pending.runId),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("failed");
    const after = await prisma.exportRun.findUnique({
      where: { runId: pending.runId },
    });
    expect(after?.status).toBe("failed");
  });

  it("reports failed when Trigger.dev reports an expired/timed-out run", async () => {
    const pending = await createPendingRun({ status: "generating" });
    vi.mocked(runs.retrieve).mockResolvedValue({
      id: pending.runId,
      isCompleted: false,
      isFailed: false,
      isCancelled: false,
      status: "EXPIRED",
    } as never);

    const res = await GET(
      new Request("http://localhost"),
      params(pending.runId),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("failed");
    const after = await prisma.exportRun.findUnique({
      where: { runId: pending.runId },
    });
    expect(after?.status).toBe("failed");
  });

  it("returns a completed status envelope for a completed run", async () => {
    const res = await GET(
      new Request("http://localhost"),
      params(runId),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("completed");
  });

  it("streams the ZIP when ?file=1 on a completed run", async () => {
    const zipBytes = "PK\x03\x04fake-zip-content";
    vi.mocked(get).mockResolvedValueOnce({
      url: "https://blob.test/test.zip",
      statusCode: 200,
      stream: new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode(zipBytes));
          controller.close();
        },
      }),
      blob: {
        size: new TextEncoder().encode(zipBytes).length,
      },
    } as never);

    const res = await GET(
      new Request("http://localhost/download?file=1"),
      params(runId),
    );
    expect(res.status).toBe(200);
    expect(res.headers.get("content-length")).toBe(
      String(new TextEncoder().encode(zipBytes).length),
    );
    expect(res.headers.get("content-type")).toBe("application/zip");
    expect(res.headers.get("content-disposition")).toContain(
      `filename="dl-test-spring-boot.zip"`,
    );
    const text = await res.text();
    expect(text).toBe(zipBytes);
  });

  it("returns a pending status envelope for ?file=1 on a still-processing run", async () => {
    const pending = await createPendingRun({ status: "pending" });
    vi.mocked(runs.retrieve).mockResolvedValue({
      id: pending.runId,
      isCompleted: false,
      isFailed: false,
      isCancelled: false,
      status: "QUEUED",
    } as never);

    const res = await GET(
      new Request(`http://localhost/download?file=1`),
      params(pending.runId),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("pending");
  });
});
