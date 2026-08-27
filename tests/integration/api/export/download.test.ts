import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import prisma from "@/lib/prisma";
import { GET } from "@/app/api/export/code/[runId]/download/route";
import { clerkState } from "../../clerk-state";
import { cleanupTestData } from "../../helpers";

const OWNER = "user_integration_download_owner";
const OTHER = "user_integration_download_other";

let runId: string;

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

  const run = await prisma.exportRun.create({
    data: {
      runId: "run_dl_test_1",
      projectId: project.id,
      userId: OWNER,
      framework: "spring-boot",
      status: "completed",
      blobUrl: "https://blob.test/test.zip",
    },
  });
  runId = run.runId;
});

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
});
