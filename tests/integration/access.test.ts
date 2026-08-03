import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { checkProjectAccess } from "@/lib/project-access";
import { GET as GetCanvas, PUT as PutCanvas } from "@/app/api/projects/[projectId]/canvas/route";
import {
  PATCH as PatchProject,
  DELETE as DeleteProject,
} from "@/app/api/projects/[projectId]/route";
import { blobGet, blobPut, clerkState } from "./clerk-state";
import { cleanupTestData, makeGet, makeJson, routeParams } from "./helpers";

const OWNER = "user_integration_owner";
const COLLABORATOR = "user_integration_collaborator";
const OUTSIDER = "user_integration_outsider";

let projectId: string;

beforeAll(async () => {
  await cleanupTestData();
});

beforeEach(async () => {
  await cleanupTestData();
  clerkState.userId = OWNER;
  clerkState.email = "owner@example.com";
  const created = await prisma.project.create({
    data: { ownerId: OWNER, name: "Test Project" },
  });
  projectId = created.id;
  blobPut.mockImplementation(() =>
    Promise.resolve({ url: `https://blob.test/${projectId}.json` })
  );
  blobGet.mockImplementation(() => Promise.resolve(null));
});

afterAll(async () => {
  await cleanupTestData();
  await prisma.$disconnect();
});

describe("checkProjectAccess", () => {
  it("returns found:false for a nonexistent project", async () => {
    const result = await checkProjectAccess("does_not_exist");
    expect(result).toEqual({ found: false });
  });

  it("grants access to the owner", async () => {
    const result = await checkProjectAccess(projectId);
    expect(result).toEqual({
      found: true,
      access: { exists: true, isOwner: true, isCollaborator: false, hasAccess: true },
    });
  });

  it("grants access to a collaborator by email", async () => {
    await prisma.projectCollaborator.create({
      data: { projectId, email: "collab@example.com" },
    });
    clerkState.userId = COLLABORATOR;
    clerkState.email = "collab@example.com";
    const result = await checkProjectAccess(projectId);
    expect(result).toEqual({
      found: true,
      access: { exists: true, isOwner: false, isCollaborator: true, hasAccess: true },
    });
  });

  it("denies access to a user who is neither owner nor collaborator", async () => {
    clerkState.userId = OUTSIDER;
    clerkState.email = "outsider@example.com";
    const result = await checkProjectAccess(projectId);
    expect(result).toEqual({
      found: true,
      access: { exists: true, isOwner: false, isCollaborator: false, hasAccess: false },
    });
  });

  it("returns no access when unauthenticated", async () => {
    clerkState.userId = null;
    const result = await checkProjectAccess(projectId);
    expect(result).toEqual({
      found: true,
      access: { exists: false, isOwner: false, isCollaborator: false, hasAccess: false },
    });
  });
});

describe("PATCH /api/projects/[projectId]", () => {
  it("returns 401 when unauthenticated", async () => {
    clerkState.userId = null;
    const res = await PatchProject(
      makeJson(`/api/projects/${projectId}`, "PATCH", { name: "x" }),
      routeParams(projectId)
    );
    expect(res.status).toBe(401);
  });

  it("returns 404 for a nonexistent project", async () => {
    const res = await PatchProject(
      makeJson("/api/projects/nope", "PATCH", { name: "x" }),
      routeParams("nope")
    );
    expect(res.status).toBe(404);
  });

  it("returns 403 for a non-owner", async () => {
    clerkState.userId = OUTSIDER;
    clerkState.email = "outsider@example.com";
    const res = await PatchProject(
      makeJson(`/api/projects/${projectId}`, "PATCH", { name: "x" }),
      routeParams(projectId)
    );
    expect(res.status).toBe(403);
  });

  it("updates and trims the name", async () => {
    const res = await PatchProject(
      makeJson(`/api/projects/${projectId}`, "PATCH", { name: "  New Name  " }),
      routeParams(projectId)
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.name).toBe("New Name");
  });

  it("rejects a name longer than 255 characters", async () => {
    const res = await PatchProject(
      makeJson(`/api/projects/${projectId}`, "PATCH", { name: "x".repeat(256) }),
      routeParams(projectId)
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 when no updatable fields are provided", async () => {
    const res = await PatchProject(
      makeJson(`/api/projects/${projectId}`, "PATCH", {}),
      routeParams(projectId)
    );
    expect(res.status).toBe(400);
  });
});

describe("DELETE /api/projects/[projectId]", () => {
  it("returns 401 when unauthenticated", async () => {
    clerkState.userId = null;
    const res = await DeleteProject(
      makeJson(`/api/projects/${projectId}`, "DELETE"),
      routeParams(projectId)
    );
    expect(res.status).toBe(401);
  });

  it("returns 404 for a nonexistent project", async () => {
    const res = await DeleteProject(
      makeJson("/api/projects/nope", "DELETE"),
      routeParams("nope")
    );
    expect(res.status).toBe(404);
  });

  it("returns 403 for a non-owner", async () => {
    clerkState.userId = OUTSIDER;
    const res = await DeleteProject(
      makeJson(`/api/projects/${projectId}`, "DELETE"),
      routeParams(projectId)
    );
    expect(res.status).toBe(403);
  });

  it("deletes the project for the owner", async () => {
    const res = await DeleteProject(
      makeJson(`/api/projects/${projectId}`, "DELETE"),
      routeParams(projectId)
    );
    expect(res.status).toBe(200);
    const count = await prisma.project.count({ where: { id: projectId } });
    expect(count).toBe(0);
  });
});

describe("GET /api/projects/[projectId]/canvas", () => {
  it("returns 401 when unauthenticated", async () => {
    clerkState.userId = null;
    const res = await GetCanvas(makeGet(`/api/projects/${projectId}/canvas`), routeParams(projectId));
    expect(res.status).toBe(401);
  });

  it("returns 404 for a nonexistent project", async () => {
    const res = await GetCanvas(makeGet("/api/projects/nope/canvas"), routeParams("nope"));
    expect(res.status).toBe(404);
  });

  it("returns 403 for a user without access", async () => {
    clerkState.userId = OUTSIDER;
    clerkState.email = "outsider@example.com";
    const res = await GetCanvas(makeGet(`/api/projects/${projectId}/canvas`), routeParams(projectId));
    expect(res.status).toBe(403);
  });

  it("returns an empty canvas when nothing is saved", async () => {
    const res = await GetCanvas(makeGet(`/api/projects/${projectId}/canvas`), routeParams(projectId));
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ nodes: [], edges: [] });
  });

  it("returns saved canvas data from blob storage", async () => {
    await prisma.project.update({
      where: { id: projectId },
      data: { canvasJsonPath: `https://blob.test/${projectId}.json` },
    });
    blobGet.mockImplementation(() =>
      Promise.resolve({
        stream: new ReadableStream({
          start(controller) {
            controller.enqueue(new TextEncoder().encode('{"nodes":[{"id":"n1"}],"edges":[]}'));
            controller.close();
          },
        }),
      })
    );
    const res = await GetCanvas(makeGet(`/api/projects/${projectId}/canvas`), routeParams(projectId));
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ nodes: [{ id: "n1" }], edges: [] });
  });
});

describe("PUT /api/projects/[projectId]/canvas", () => {
  it("returns 401 when unauthenticated", async () => {
    clerkState.userId = null;
    const res = await PutCanvas(
      makeJson(`/api/projects/${projectId}/canvas`, "PUT", { nodes: [], edges: [] }),
      routeParams(projectId)
    );
    expect(res.status).toBe(401);
  });

  it("returns 404 for a nonexistent project", async () => {
    const res = await PutCanvas(
      makeJson("/api/projects/nope/canvas", "PUT", { nodes: [], edges: [] }),
      routeParams("nope")
    );
    expect(res.status).toBe(404);
  });

  it("returns 403 for a user without access", async () => {
    clerkState.userId = OUTSIDER;
    clerkState.email = "outsider@example.com";
    const res = await PutCanvas(
      makeJson(`/api/projects/${projectId}/canvas`, "PUT", { nodes: [], edges: [] }),
      routeParams(projectId)
    );
    expect(res.status).toBe(403);
  });

  it("returns 400 when nodes and edges are not arrays", async () => {
    const res = await PutCanvas(
      makeJson(`/api/projects/${projectId}/canvas`, "PUT", { nodes: [], edges: "oops" }),
      routeParams(projectId)
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 when nodes/edges lack string ids", async () => {
    const res = await PutCanvas(
      makeJson(`/api/projects/${projectId}/canvas`, "PUT", { nodes: [{ type: "x" }], edges: [] }),
      routeParams(projectId)
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid JSON", async () => {
    const res = await PutCanvas(
      new NextRequest(new URL(`http://localhost/api/projects/${projectId}/canvas`), {
        method: "PUT",
        body: "{not-json",
      }),
      routeParams(projectId)
    );
    expect(res.status).toBe(400);
  });

  it("returns 413 for an oversized payload", async () => {
    const bigId = "x".repeat(1_100_000);
    const res = await PutCanvas(
      makeJson(`/api/projects/${projectId}/canvas`, "PUT", { nodes: [{ id: bigId }], edges: [] }),
      routeParams(projectId)
    );
    expect(res.status).toBe(413);
  });

  it("saves the canvas and persists the blob url", async () => {
    const res = await PutCanvas(
      makeJson(`/api/projects/${projectId}/canvas`, "PUT", { nodes: [{ id: "n1" }], edges: [] }),
      routeParams(projectId)
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.url).toBe(`https://blob.test/${projectId}.json`);
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    expect(project?.canvasJsonPath).toBe(`https://blob.test/${projectId}.json`);
  });

  it("allows a collaborator to save the canvas", async () => {
    await prisma.projectCollaborator.create({
      data: { projectId, email: "collab@example.com" },
    });
    clerkState.userId = COLLABORATOR;
    clerkState.email = "collab@example.com";
    const res = await PutCanvas(
      makeJson(`/api/projects/${projectId}/canvas`, "PUT", { nodes: [{ id: "n1" }], edges: [] }),
      routeParams(projectId)
    );
    expect(res.status).toBe(200);
  });

  it("returns 500 when blob storage fails", async () => {
    blobPut.mockImplementation(() => Promise.reject(new Error("blob down")));
    const res = await PutCanvas(
      makeJson(`/api/projects/${projectId}/canvas`, "PUT", { nodes: [{ id: "n1" }], edges: [] }),
      routeParams(projectId)
    );
    expect(res.status).toBe(500);
  });
});
