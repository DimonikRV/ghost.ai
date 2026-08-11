import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { put, get } from "@vercel/blob";
import prisma from "@/lib/prisma";
import { checkProjectAccess } from "@/lib/project-access";

const EMPTY_CANVAS = { nodes: [], edges: [] };

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await params;

  const accessResult = await checkProjectAccess(projectId);
  if (accessResult.found === false) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (!accessResult.access.hasAccess) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { canvasJsonPath: true },
  });

  if (!project || !project.canvasJsonPath) {
    return NextResponse.json(EMPTY_CANVAS);
  }

  try {
    const result = await get(project.canvasJsonPath, { access: "private" });
    if (!result || result.stream === null) {
      return NextResponse.json(EMPTY_CANVAS);
    }
    const text = await new Response(result.stream).text();
    const parsed = JSON.parse(text) as { nodes: unknown[]; edges: unknown[] };
    return NextResponse.json({ nodes: parsed.nodes, edges: parsed.edges });
  } catch {
    return NextResponse.json(
      { error: "Failed to load canvas data" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await params;

  const accessResult = await checkProjectAccess(projectId);
  if (accessResult.found === false) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (!accessResult.access.hasAccess) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { nodes?: unknown; edges?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const MAX_CANVAS_BYTES = 1_000_000;

  function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
  }

  function hasStringId(value: unknown): boolean {
    return isRecord(value) && typeof value.id === "string";
  }

  if (!Array.isArray(body.nodes) || !Array.isArray(body.edges)) {
    return NextResponse.json(
      { error: "Body must contain nodes and edges arrays" },
      { status: 400 }
    );
  }

  if (!body.nodes.every(hasStringId) || !body.edges.every(hasStringId)) {
    return NextResponse.json(
      { error: "Canvas nodes and edges must contain string ids" },
      { status: 400 }
    );
  }

  const canvasData = JSON.stringify({ nodes: body.nodes, edges: body.edges });
  if (new TextEncoder().encode(canvasData).length > MAX_CANVAS_BYTES) {
    return NextResponse.json(
      { error: "Canvas payload is too large" },
      { status: 413 }
    );
  }
  const blobKey = `canvas-${projectId}.json`;

  try {
    const blob = await put(blobKey, canvasData, {
      access: "private",
      addRandomSuffix: false,
      allowOverwrite: true,
    });

    await prisma.project.update({
      where: { id: projectId },
      data: { canvasJsonPath: blob.url },
    });

    return NextResponse.json({ url: blob.url });
  } catch {
    return NextResponse.json(
      { error: "Failed to save canvas data" },
      { status: 500 }
    );
  }
}
