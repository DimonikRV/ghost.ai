import { describe, it, expect, vi, beforeEach } from "vitest";
import { clerkState } from "../integration/clerk-state";

vi.mock("@/lib/prisma", () => ({
  default: {
    project: { findMany: vi.fn() },
    projectCollaborator: { findMany: vi.fn() },
  },
}));

const prisma = (await import("@/lib/prisma")).default;
const findManyMock = vi.mocked(prisma.project.findMany);
const collabFindManyMock = vi.mocked(prisma.projectCollaborator.findMany);

function makeProject(overrides: Partial<{ id: string; name: string; description: string | null; status: string; createdAt: Date; updatedAt: Date }> = {}) {
  return {
    id: overrides.id ?? "proj_1",
    name: overrides.name ?? "Test Project",
    description: overrides.description ?? null,
    status: overrides.status ?? "active",
    createdAt: overrides.createdAt ?? new Date("2025-01-01T00:00:00Z"),
    updatedAt: overrides.updatedAt ?? new Date("2025-06-01T00:00:00Z"),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  clerkState.userId = "user_default";
  clerkState.email = "default@example.com";
  findManyMock.mockResolvedValue([]);
  collabFindManyMock.mockResolvedValue([]);
});

describe("getProjects", () => {
  it("returns owned and shared projects for an authenticated user", async () => {
    clerkState.userId = "user_1";
    clerkState.email = "alice@example.com";

    const owned = [makeProject({ id: "p1", name: "Owned" })];
    const shared = [
      {
        id: "collab_1",
        createdAt: new Date(),
        project: makeProject({ id: "p2", name: "Shared" }),
      },
    ];

    findManyMock.mockResolvedValue(owned as any);
    collabFindManyMock.mockResolvedValue(shared as any);

    const { getProjects } = await import("@/lib/get-projects");
    const result = await getProjects();

    expect(result.owned).toHaveLength(1);
    expect(result.owned[0].name).toBe("Owned");
    expect(result.owned[0].createdAt).toBe("2025-01-01T00:00:00.000Z");
    expect(result.shared).toHaveLength(1);
    expect(result.shared[0].name).toBe("Shared");
  });

  it("returns empty arrays when user has no projects", async () => {
    clerkState.userId = "user_empty";
    clerkState.email = "empty@example.com";
    findManyMock.mockResolvedValue([]);
    collabFindManyMock.mockResolvedValue([]);

    const { getProjects } = await import("@/lib/get-projects");
    const result = await getProjects();

    expect(result.owned).toEqual([]);
    expect(result.shared).toEqual([]);
  });

  it("returns empty arrays when user is not authenticated", async () => {
    clerkState.userId = null;

    const { getProjects } = await import("@/lib/get-projects");
    const result = await getProjects();

    expect(result.owned).toEqual([]);
    expect(result.shared).toEqual([]);
    expect(findManyMock).not.toHaveBeenCalled();
    expect(collabFindManyMock).not.toHaveBeenCalled();
  });

  it("queries prisma with the correct ownerId", async () => {
    clerkState.userId = "user_xyz";
    clerkState.email = "x@example.com";

    const { getProjects } = await import("@/lib/get-projects");
    await getProjects();

    expect(findManyMock).toHaveBeenCalledWith(
      expect.objectContaining({ where: { ownerId: "user_xyz" } }),
    );
  });

  it("queries collaborators with the user's email", async () => {
    clerkState.userId = "u1";
    clerkState.email = "test@dev.io";

    const { getProjects } = await import("@/lib/get-projects");
    await getProjects();

    expect(collabFindManyMock).toHaveBeenCalledWith(
      expect.objectContaining({ where: { email: "test@dev.io" } }),
    );
  });

  it("returns shared as empty when currentUser has no email", async () => {
    clerkState.userId = "u1";
    clerkState.email = null as any;

    const { getProjects } = await import("@/lib/get-projects");
    const result = await getProjects();

    expect(result.shared).toEqual([]);
    expect(collabFindManyMock).not.toHaveBeenCalled();
  });
});
