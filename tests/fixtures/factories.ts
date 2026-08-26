import prisma from "@/lib/prisma";
import { toNameKey } from "@/lib/slugify";

export async function createTestProject(
  ownerId: string,
  name: string,
  overrides?: { description?: string; status?: "DRAFT" | "ACTIVED" },
) {
  return prisma.project.create({
    data: {
      ownerId,
      name,
      nameKey: toNameKey(name),
      description: overrides?.description ?? null,
      status: overrides?.status ?? "DRAFT",
    },
  });
}

export async function createTestCollaborator(projectId: string, email: string) {
  return prisma.projectCollaborator.create({
    data: { projectId, email },
  });
}

export async function createTestTaskRun(
  projectId: string,
  userId: string,
  runId: string,
  task = "design-agent",
) {
  return prisma.taskRun.create({
    data: { runId, task, projectId, userId },
  });
}

export async function cleanupTestData(): Promise<void> {
  await prisma.projectCollaborator.deleteMany({
    where: { project: { ownerId: { startsWith: "user_integration_" } } },
  });
  await prisma.taskRun.deleteMany({
    where: { userId: { startsWith: "user_integration_" } },
  });
  await prisma.project.deleteMany({
    where: { ownerId: { startsWith: "user_integration_" } },
  });
}
