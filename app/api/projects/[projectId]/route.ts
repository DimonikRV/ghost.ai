import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { slugify } from "@/lib/slugify";

const MAX_NAME_LENGTH = 255;
const DEFAULT_PROJECT_NAME = "Untitled Project";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await params;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (project.ownerId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));

  if (body.name === undefined && body.description === undefined) {
    return NextResponse.json(
      { error: "No updatable fields provided" },
      { status: 400 },
    );
  }

  let name: string | undefined = body.name;
  if (name !== undefined) {
    if (name === null || name.trim() === "") {
      name = DEFAULT_PROJECT_NAME;
    } else {
      name = name.trim();
    }

    if (name.length > MAX_NAME_LENGTH) {
      return NextResponse.json(
        { error: `Name must be ${MAX_NAME_LENGTH} characters or less` },
        { status: 400 },
      );
    }
  }

  try {
    const updated = await prisma.project.update({
      where: { id: projectId },
      data: {
        ...(name !== undefined && { name, nameKey: slugify(name) }),
        ...(body.description !== undefined && {
          description: body.description,
        }),
      },
      select: {
        id: true,
        name: true,
        description: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (
      error instanceof Error &&
      "code" in error &&
      error.code === "P2002" &&
      "meta" in error &&
      error.meta &&
      typeof error.meta === "object" &&
      "target" in error.meta &&
      Array.isArray(error.meta.target) &&
      error.meta.target.includes("nameKey")
    ) {
      return NextResponse.json(
        { error: "A project with this name already exists" },
        { status: 409 },
      );
    }
    throw error;
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await params;

  // Check existence first (404 before 403) to prevent ID enumeration
  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (project.ownerId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.project.delete({
    where: { id: projectId },
  });

  return NextResponse.json({ message: "Deleted" });
}
