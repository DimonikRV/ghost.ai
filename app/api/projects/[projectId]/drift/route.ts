import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { get } from "@vercel/blob";
import prisma from "@/lib/prisma";
import { checkProjectAccess } from "@/lib/project-access";
import { hashCanvas } from "@/lib/export/canvas-hash";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> },
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

  const framework = req.nextUrl.searchParams.get("framework") ?? undefined;

  // The most recent completed export for this project (optionally for a
  // specific framework). Only completed exports carry a known canvas snapshot.
  const lastExport = await prisma.exportRun.findFirst({
    where: {
      projectId,
      status: "completed",
      canvasHash: { not: null },
      ...(framework ? { framework } : {}),
    },
    orderBy: { createdAt: "desc" },
    select: {
      framework: true,
      canvasHash: true,
      completedAt: true,
    },
  });

  if (!lastExport?.canvasHash || !lastExport.completedAt) {
    return NextResponse.json({ hasExport: false, drifted: false });
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { canvasJsonPath: true },
  });

  let currentHash: string | null = null;
  if (project?.canvasJsonPath) {
    try {
      const result = await get(project.canvasJsonPath, { access: "private" });
      if (result && result.stream) {
        const text = await new Response(result.stream).text();
        const parsed = JSON.parse(text) as {
          nodes: unknown[];
          edges: unknown[];
        };
        currentHash = hashCanvas({
          nodes: parsed.nodes ?? [],
          edges: parsed.edges ?? [],
        });
      }
    } catch {
      // If the canvas can't be read, treat drift as unknown => not drifted.
      currentHash = null;
    }
  }

  const drifted =
    currentHash !== null && currentHash !== lastExport.canvasHash;

  return NextResponse.json({
    hasExport: true,
    framework: lastExport.framework,
    lastExportAt: lastExport.completedAt.toISOString(),
    drifted,
    // If the current canvas couldn't be read we can't compute drift; report
    // it so the client can hide the banner rather than guess.
    comparable: currentHash !== null,
  });
}
