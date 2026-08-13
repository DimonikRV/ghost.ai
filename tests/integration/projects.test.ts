import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import prisma from "@/lib/prisma";
import { GET, POST } from "@/app/api/projects/route";
import { clerkState } from "./clerk-state";
import { cleanupTestData, makeGet, makeJson } from "./helpers";

const OWNER = "user_integration_projects";

beforeAll(async () => {
  await cleanupTestData();
});

beforeEach(async () => {
  await cleanupTestData();
  clerkState.userId = OWNER;
});

afterAll(async () => {
  await cleanupTestData();
  await prisma.$disconnect();
});

describe("GET /api/projects", () => {
  it("returns 401 when unauthenticated", async () => {
    clerkState.userId = null;
    const res = await GET(makeGet("/api/projects"));
    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  it("returns an empty list when the user has no projects", async () => {
    const res = await GET(makeGet("/api/projects"));
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ projects: [], nextCursor: null });
  });

  it("lists owned projects newest first and paginates", async () => {
    await prisma.project.createMany({
      data: [
        { ownerId: OWNER, name: "A", nameKey: "a", createdAt: new Date("2026-01-01T00:00:00Z") },
        { ownerId: OWNER, name: "B", nameKey: "b", createdAt: new Date("2026-01-02T00:00:00Z") },
        { ownerId: OWNER, name: "C", nameKey: "c", createdAt: new Date("2026-01-03T00:00:00Z") },
      ],
    });

    const res = await GET(makeGet("/api/projects?limit=2"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.projects).toHaveLength(2);
    expect(body.projects.map((p: { name: string }) => p.name)).toEqual(["C", "B"]);
    expect(typeof body.nextCursor).toBe("string");

    const res2 = await GET(makeGet(`/api/projects?limit=2&cursor=${body.nextCursor}`));
    const body2 = await res2.json();
    expect(body2.projects).toHaveLength(1);
    expect(body2.projects[0].name).toBe("A");
    expect(body2.nextCursor).toBeNull();
  });

  it("does not expose other users' projects", async () => {
    await prisma.project.create({
      data: { ownerId: "user_integration_other", name: "Other", nameKey: "other" },
    });
    const res = await GET(makeGet("/api/projects"));
    const body = await res.json();
    expect(body.projects).toHaveLength(0);
  });

  it("clamps the limit to the maximum", async () => {
    await prisma.project.createMany({
      data: Array.from({ length: 5 }, (_, i) => ({ ownerId: OWNER, name: `P${i}`, nameKey: `p${i}` })),
    });
    const res = await GET(makeGet("/api/projects?limit=1000"));
    const body = await res.json();
    expect(body.projects.length).toBeLessThanOrEqual(100);
  });
});

describe("POST /api/projects", () => {
  it("returns 401 when unauthenticated", async () => {
    clerkState.userId = null;
    const res = await POST(makeJson("/api/projects", "POST", { name: "x" }));
    expect(res.status).toBe(401);
  });

  it("creates a project with the default name when none given", async () => {
    const res = await POST(makeJson("/api/projects", "POST", {}));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.id).toBeTruthy();
    expect(body.name).toBe("Untitled Project");
    expect(body.description).toBeNull();
    expect(body.ownerId).toBeUndefined();
  });

  it("trims the provided name", async () => {
    const res = await POST(makeJson("/api/projects", "POST", { name: "  hello  " }));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.name).toBe("hello");
  });

  it("rejects names longer than 255 characters", async () => {
    const res = await POST(makeJson("/api/projects", "POST", { name: "x".repeat(256) }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("255");
  });

  it("rejects duplicates with the same canonicalized name", async () => {
    await prisma.project.create({
      data: {
        ownerId: OWNER,
        name: "Alpha Project",
        nameKey: "alpha-project",
      },
    });

    const res = await POST(makeJson("/api/projects", "POST", { name: "alpha project!" }));
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error).toBe("A project with this name already exists");
    expect(body.suggestions).toEqual(["Alpha Project 2", "Alpha Project 3", "Alpha Project 4"]);
  });

  it("suggests the next available names after existing numbered duplicates", async () => {
    await prisma.project.createMany({
      data: [
        { ownerId: OWNER, name: "Alpha Project", nameKey: "alpha-project" },
        { ownerId: OWNER, name: "Alpha Project 2", nameKey: "alpha-project-2" },
      ],
    });

    const res = await POST(makeJson("/api/projects", "POST", { name: "alpha project!" }));
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.suggestions).toEqual(["Alpha Project 3", "Alpha Project 4", "Alpha Project 5"]);
  });

  it("allows distinct special-character-only names", async () => {
    const first = await POST(makeJson("/api/projects", "POST", { name: "!!!" }));
    expect(first.status).toBe(201);

    const second = await POST(makeJson("/api/projects", "POST", { name: "???" }));
    expect(second.status).toBe(201);
  });

  it("rejects recreating a special-character-only name", async () => {
    await POST(makeJson("/api/projects", "POST", { name: "!!!" }));

    const res = await POST(makeJson("/api/projects", "POST", { name: "!!!" }));
    expect(res.status).toBe(409);
  });
});
