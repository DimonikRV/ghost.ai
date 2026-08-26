import { describe, expect, it, vi } from "vitest";

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn().mockResolvedValue({ userId: "user_test_123" }),
  currentUser: vi.fn().mockResolvedValue({
    primaryEmailAddress: { emailAddress: "test@example.com" },
  }),
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    project: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    projectCollaborator: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

import {
  getCurrentIdentity,
  checkProjectAccess,
  getProjectCollaboratorEmails,
} from "@/lib/project-access";
import { auth, currentUser } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

const mockedAuth = vi.mocked(auth);
const mockedCurrentUser = vi.mocked(currentUser);
const mockedPrisma = vi.mocked(prisma);

describe("getCurrentIdentity", () => {
  it("returns userId and email when authenticated", async () => {
    const identity = await getCurrentIdentity();
    expect(identity).toEqual({
      userId: "user_test_123",
      email: "test@example.com",
    });
  });

  it("returns null when unauthenticated", async () => {
    mockedAuth.mockResolvedValueOnce({ userId: null } as never);
    const identity = await getCurrentIdentity();
    expect(identity).toBeNull();
  });

  it("returns null email when user has no email", async () => {
    mockedAuth.mockResolvedValueOnce({ userId: "user_test" } as never);
    mockedCurrentUser.mockResolvedValueOnce({
      primaryEmailAddress: null,
    } as never);
    const identity = await getCurrentIdentity();
    expect(identity).toEqual({ userId: "user_test", email: null });
  });
});

describe("checkProjectAccess", () => {
  it("returns hasAccess=true for owner", async () => {
    mockedPrisma.project.findUnique.mockResolvedValueOnce({
      id: "proj_1",
      ownerId: "user_test_123",
    } as never);

    const result = await checkProjectAccess("proj_1");
    expect(result).toEqual({
      found: true,
      access: {
        exists: true,
        isOwner: true,
        isCollaborator: false,
        hasAccess: true,
      },
    });
  });

  it("returns hasAccess=true for collaborator", async () => {
    mockedPrisma.project.findUnique.mockResolvedValueOnce({
      id: "proj_1",
      ownerId: "user_other",
    } as never);
    mockedPrisma.projectCollaborator.findFirst.mockResolvedValueOnce({
      id: "collab_1",
      projectId: "proj_1",
      email: "test@example.com",
    } as never);

    const result = await checkProjectAccess("proj_1");
    expect(result).toEqual({
      found: true,
      access: {
        exists: true,
        isOwner: false,
        isCollaborator: true,
        hasAccess: true,
      },
    });
  });

  it("returns hasAccess=false for non-owner non-collaborator", async () => {
    mockedPrisma.project.findUnique.mockResolvedValueOnce({
      id: "proj_1",
      ownerId: "user_other",
    } as never);
    mockedPrisma.projectCollaborator.findFirst.mockResolvedValueOnce(null);

    const result = await checkProjectAccess("proj_1");
    expect(result).toEqual({
      found: true,
      access: {
        exists: true,
        isOwner: false,
        isCollaborator: false,
        hasAccess: false,
      },
    });
  });

  it("returns found=false when project does not exist", async () => {
    mockedPrisma.project.findUnique.mockResolvedValueOnce(null);
    const result = await checkProjectAccess("nonexistent");
    expect(result).toEqual({ found: false });
  });

  it("returns no access when unauthenticated", async () => {
    mockedAuth.mockResolvedValueOnce({ userId: null } as never);
    const result = await checkProjectAccess("proj_1");
    expect(result).toEqual({
      found: true,
      access: {
        exists: false,
        isOwner: false,
        isCollaborator: false,
        hasAccess: false,
      },
    });
  });
});

describe("getProjectCollaboratorEmails", () => {
  it("returns email list for project", async () => {
    mockedPrisma.projectCollaborator.findMany.mockResolvedValueOnce([
      { email: "a@test.com" },
      { email: "b@test.com" },
    ] as never);

    const emails = await getProjectCollaboratorEmails("proj_1");
    expect(emails).toEqual(["a@test.com", "b@test.com"]);
  });

  it("returns empty array when no collaborators", async () => {
    mockedPrisma.projectCollaborator.findMany.mockResolvedValueOnce([]);
    const emails = await getProjectCollaboratorEmails("proj_1");
    expect(emails).toEqual([]);
  });
});
