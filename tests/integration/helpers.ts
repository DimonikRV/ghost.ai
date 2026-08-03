import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";

export function makeGet(path: string): NextRequest {
  return new NextRequest(new URL(path, "http://localhost"));
}

export function makeJson(
  path: string,
  method: "POST" | "PUT" | "PATCH" | "DELETE",
  body?: unknown
): NextRequest {
  const url = new URL(path, "http://localhost");
  if (body === undefined) {
    return new NextRequest(url, { method });
  }
  return new NextRequest(url, {
    method,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

export function routeParams(projectId: string): {
  params: Promise<{ projectId: string }>;
} {
  return { params: Promise.resolve({ projectId }) };
}

export async function cleanupTestData(): Promise<void> {
  await prisma.projectCollaborator.deleteMany({
    where: { project: { ownerId: { startsWith: "user_integration_" } } },
  });
  await prisma.project.deleteMany({
    where: { ownerId: { startsWith: "user_integration_" } },
  });
}
