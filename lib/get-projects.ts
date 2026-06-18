import { auth, currentUser } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export interface ProjectListItem {
  id: string;
  name: string;
  description: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectsData {
  owned: ProjectListItem[];
  shared: ProjectListItem[];
}

function toListItem(p: {
  id: string;
  name: string;
  description: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}): ProjectListItem {
  return {
    id: p.id,
    name: p.name,
    description: p.description,
    status: p.status,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}

/**
 * Fetch owned and shared projects for the authenticated user.
 * Server-only — must not be called from client components.
 */
export async function getProjects(): Promise<ProjectsData> {
  const { userId } = await auth();
  if (!userId) {
    return { owned: [], shared: [] };
  }

  // Owned projects
  const ownedProjects = await prisma.project.findMany({
    where: { ownerId: userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      description: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  // Shared projects — find projects where user is a collaborator
  const user = await currentUser();
  const email = user?.primaryEmailAddress?.emailAddress;

  let sharedProjects: typeof ownedProjects = [];
  if (email) {
    const collaborators = await prisma.projectCollaborator.findMany({
      where: { email },
      select: { project: true },
      orderBy: { createdAt: "desc" },
    });
    sharedProjects = collaborators.map((c) => c.project);
  }

  return {
    owned: ownedProjects.map(toListItem),
    shared: sharedProjects.map(toListItem),
  };
}
