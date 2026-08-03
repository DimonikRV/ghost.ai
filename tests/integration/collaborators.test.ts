import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import prisma from "@/lib/prisma";
import {
  GET as ListCollabs,
  POST as InviteCollab,
  DELETE as RemoveCollab,
} from "@/app/api/projects/[projectId]/collaborators/route";
import { clerkState } from "./clerk-state";
import { cleanupTestData, makeGet, makeJson, routeParams } from "./helpers";

const OWNER = "user_integration_owner";

let projectId: string;

beforeAll(async () => {
  await cleanupTestData();
});

beforeEach(async () => {
  await cleanupTestData();
  clerkState.userId = OWNER;
  clerkState.email = "owner@example.com";
  const created = await prisma.project.create({
    data: { ownerId: OWNER, name: "Shared" },
  });
  projectId = created.id;
});

afterAll(async () => {
  await cleanupTestData();
  await prisma.$disconnect();
});

describe("POST /api/projects/[projectId]/collaborators", () => {
  it("returns 401 when unauthenticated", async () => {
    clerkState.userId = null;
    const res = await InviteCollab(
      makeJson(`/api/projects/${projectId}/collaborators`, "POST", { email: "x@example.com" }),
      routeParams(projectId)
    );
    expect(res.status).toBe(401);
  });

  it("returns 404 for a nonexistent project", async () => {
    const res = await InviteCollab(
      makeJson("/api/projects/nope/collaborators", "POST", { email: "x@example.com" }),
      routeParams("nope")
    );
    expect(res.status).toBe(404);
  });

  it("returns 403 for a non-owner", async () => {
    clerkState.userId = "user_integration_outsider";
    const res = await InviteCollab(
      makeJson(`/api/projects/${projectId}/collaborators`, "POST", { email: "x@example.com" }),
      routeParams(projectId)
    );
    expect(res.status).toBe(403);
  });

  it("returns 400 for a missing or invalid email", async () => {
    const missing = await InviteCollab(
      makeJson(`/api/projects/${projectId}/collaborators`, "POST", {}),
      routeParams(projectId)
    );
    expect(missing.status).toBe(400);

    const invalid = await InviteCollab(
      makeJson(`/api/projects/${projectId}/collaborators`, "POST", { email: "not-an-email" }),
      routeParams(projectId)
    );
    expect(invalid.status).toBe(400);
  });

  it("returns 400 when inviting the owner's own email", async () => {
    const res = await InviteCollab(
      makeJson(`/api/projects/${projectId}/collaborators`, "POST", { email: "OWNER@example.com" }),
      routeParams(projectId)
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Cannot invite the project owner");
  });

  it("invites a collaborator and normalizes the email", async () => {
    const res = await InviteCollab(
      makeJson(`/api/projects/${projectId}/collaborators`, "POST", {
        email: "  Collab@Example.com  ",
      }),
      routeParams(projectId)
    );
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.email).toBe("collab@example.com");
    expect(body.displayName).toBe("Test User");
  });

  it("returns 400 when the user is already a collaborator", async () => {
    await InviteCollab(
      makeJson(`/api/projects/${projectId}/collaborators`, "POST", { email: "collab@example.com" }),
      routeParams(projectId)
    );
    const res = await InviteCollab(
      makeJson(`/api/projects/${projectId}/collaborators`, "POST", { email: "collab@example.com" }),
      routeParams(projectId)
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("User is already a collaborator");
  });
});

describe("GET /api/projects/[projectId]/collaborators", () => {
  it("returns 401 when unauthenticated", async () => {
    clerkState.userId = null;
    const res = await ListCollabs(makeGet(`/api/projects/${projectId}/collaborators`), routeParams(projectId));
    expect(res.status).toBe(401);
  });

  it("returns 403 for a user without access", async () => {
    clerkState.userId = "user_integration_outsider";
    clerkState.email = "outsider@example.com";
    const res = await ListCollabs(makeGet(`/api/projects/${projectId}/collaborators`), routeParams(projectId));
    expect(res.status).toBe(403);
  });

  it("lists collaborators for the owner with isOwner true", async () => {
    await prisma.projectCollaborator.create({ data: { projectId, email: "a@example.com" } });
    await prisma.projectCollaborator.create({ data: { projectId, email: "b@example.com" } });

    const res = await ListCollabs(makeGet(`/api/projects/${projectId}/collaborators`), routeParams(projectId));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.isOwner).toBe(true);
    expect(body.collaborators.map((c: { email: string }) => c.email)).toEqual([
      "a@example.com",
      "b@example.com",
    ]);
    expect(body.collaborators[0].displayName).toBe("Test User");
  });

  it("allows a collaborator to list collaborators", async () => {
    await prisma.projectCollaborator.create({ data: { projectId, email: "c@example.com" } });
    clerkState.userId = "user_integration_collab";
    clerkState.email = "c@example.com";

    const res = await ListCollabs(makeGet(`/api/projects/${projectId}/collaborators`), routeParams(projectId));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.isOwner).toBe(false);
    expect(body.collaborators).toHaveLength(1);
  });
});

describe("DELETE /api/projects/[projectId]/collaborators", () => {
  it("returns 401 when unauthenticated", async () => {
    clerkState.userId = null;
    const res = await RemoveCollab(
      makeJson(`/api/projects/${projectId}/collaborators`, "DELETE", { email: "x@example.com" }),
      routeParams(projectId)
    );
    expect(res.status).toBe(401);
  });

  it("returns 403 for a non-owner", async () => {
    clerkState.userId = "user_integration_outsider";
    const res = await RemoveCollab(
      makeJson(`/api/projects/${projectId}/collaborators`, "DELETE", { email: "x@example.com" }),
      routeParams(projectId)
    );
    expect(res.status).toBe(403);
  });

  it("returns 400 when neither collaboratorId nor email is provided", async () => {
    const res = await RemoveCollab(
      makeJson(`/api/projects/${projectId}/collaborators`, "DELETE", {}),
      routeParams(projectId)
    );
    expect(res.status).toBe(400);
  });

  it("returns 404 when the collaborator does not exist", async () => {
    const res = await RemoveCollab(
      makeJson(`/api/projects/${projectId}/collaborators`, "DELETE", { email: "ghost@example.com" }),
      routeParams(projectId)
    );
    expect(res.status).toBe(404);
  });

  it("removes a collaborator by email", async () => {
    await prisma.projectCollaborator.create({ data: { projectId, email: "gone@example.com" } });
    const res = await RemoveCollab(
      makeJson(`/api/projects/${projectId}/collaborators`, "DELETE", { email: "gone@example.com" }),
      routeParams(projectId)
    );
    expect(res.status).toBe(200);
    const count = await prisma.projectCollaborator.count({
      where: { projectId, email: "gone@example.com" },
    });
    expect(count).toBe(0);
  });

  it("removes a collaborator by id", async () => {
    const collab = await prisma.projectCollaborator.create({
      data: { projectId, email: "gone2@example.com" },
    });
    const res = await RemoveCollab(
      makeJson(`/api/projects/${projectId}/collaborators`, "DELETE", { collaboratorId: collab.id }),
      routeParams(projectId)
    );
    expect(res.status).toBe(200);
    const count = await prisma.projectCollaborator.count({ where: { id: collab.id } });
    expect(count).toBe(0);
  });
});
