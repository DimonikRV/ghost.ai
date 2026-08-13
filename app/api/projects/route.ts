import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { suggestAlternativeNames, toNameKey } from "@/lib/slugify";

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;
const MAX_NAME_LENGTH = 255;
const DEFAULT_PROJECT_NAME = "Untitled Project";

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = req.nextUrl.searchParams;
  let limit = parseInt(searchParams.get("limit") ?? String(DEFAULT_LIMIT), 10);
  if (isNaN(limit) || limit < 1) limit = DEFAULT_LIMIT;
  if (limit > MAX_LIMIT) limit = MAX_LIMIT;

  const cursor = searchParams.get("cursor") ?? undefined;

  const projects = await prisma.project.findMany({
    where: { ownerId: userId },
    take: limit,
    skip: cursor ? 1 : 0,
    cursor: cursor ? { id: cursor } : undefined,
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

  const nextCursor =
    projects.length === limit && projects.length > 0
      ? projects[projects.length - 1].id
      : null;

  return NextResponse.json({
    projects,
    nextCursor,
  });
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  let name: string = body.name;

  if (name === undefined || name === null || name.trim() === "") {
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

  const nameKey = toNameKey(name);

  const existing = await prisma.project.findUnique({
    where: { ownerId_nameKey: { ownerId: userId, nameKey } },
    select: { id: true, name: true },
  });

  if (existing) {
    return duplicateNameResponse(existing.name, userId);
  }

  try {
    const project = await prisma.project.create({
      data: {
        ownerId: userId,
        name,
        nameKey,
        description: body.description ?? null,
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

    return NextResponse.json(project, { status: 201 });
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
      const collides = await prisma.project.findUnique({
        where: { ownerId_nameKey: { ownerId: userId, nameKey } },
        select: { name: true },
      });
      return duplicateNameResponse(collides?.name ?? name, userId);
    }
    throw error;
  }
}

async function duplicateNameResponse(existingName: string, userId: string) {
  const existingKeys = await prisma.project.findMany({
    where: { ownerId: userId },
    select: { nameKey: true },
  });
  return NextResponse.json(
    {
      error: "A project with this name already exists",
      suggestions: suggestAlternativeNames(
        existingName,
        existingKeys.map((p) => p.nameKey),
        3,
        MAX_NAME_LENGTH,
      ),
    },
    { status: 409 },
  );
}
