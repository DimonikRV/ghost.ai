import { auth, currentUser } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export interface ProjectIdentity {
  userId: string;
  email: string | null;
}

export interface ProjectAccessCheck {
  exists: boolean;
  isOwner: boolean;
  isCollaborator: boolean;
  hasAccess: boolean;
}

/**
 * Get the current Clerk user's identity.
 * Returns null if unauthenticated.
 */
export async function getCurrentIdentity(): Promise<ProjectIdentity | null> {
  const { userId } = await auth();
  if (!userId) return null;

  const user = await currentUser();
  return {
    userId,
    email: user?.primaryEmailAddress?.emailAddress ?? null,
  };
}

/**
 * Check whether a project exists and whether the current user has access.
 * Access = owner OR collaborator (by email).
 */
export async function checkProjectAccess(
  projectId: string,
): Promise<{ found: false } | { found: true; access: ProjectAccessCheck }> {
  const identity = await getCurrentIdentity();
  if (!identity) {
    return { found: true, access: { exists: false, isOwner: false, isCollaborator: false, hasAccess: false } };
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      ownerId: true,
    },
  });

  if (!project) {
    return { found: false };
  }

  const isOwner = project.ownerId === identity.userId;

  let isCollaborator = false;
  if (identity.email && !isOwner) {
    const collab = await prisma.projectCollaborator.findFirst({
      where: {
        projectId,
        email: identity.email,
      },
    });
    isCollaborator = !!collab;
  }

  return {
    found: true,
    access: {
      exists: true,
      isOwner,
      isCollaborator,
      hasAccess: isOwner || isCollaborator,
    },
  };
}

/**
 * Get the full project record with collaborators for a user with access.
 * Returns null if project doesn't exist, user has no access, or is unauthenticated.
 */
export async function getProjectWithAccess(projectId: string) {
  const result = await checkProjectAccess(projectId);
  if (result.found === false) return null;
  if (!result.access.hasAccess) return null;

  return prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      name: true,
      description: true,
      status: true,
      ownerId: true,
      createdAt: true,
      updatedAt: true,
      collaborators: {
        select: {
          id: true,
          email: true,
          createdAt: true,
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });
}

/**
 * Get all collaborator emails for a project.
 * Returns empty array if project doesn't exist.
 */
export async function getProjectCollaboratorEmails(
  projectId: string,
): Promise<string[]> {
  const collaborators = await prisma.projectCollaborator.findMany({
    where: { projectId },
    select: { email: true },
  });

  return collaborators.map((c) => c.email);
}
