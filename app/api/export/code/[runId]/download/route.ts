import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { get } from "@vercel/blob";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ runId: string }> },
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { runId } = await params;
  if (!runId || typeof runId !== "string") {
    return NextResponse.json({ error: "Missing runId" }, { status: 400 });
  }

  const exportRun = await prisma.exportRun.findUnique({
    where: { runId },
  });
  if (!exportRun) {
    return NextResponse.json({ error: "Export not found" }, { status: 404 });
  }
  if (exportRun.userId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (exportRun.status === "pending" || exportRun.status === "generating") {
    return NextResponse.json(
      { error: "Export still processing" },
      { status: 409 },
    );
  }

  if (exportRun.status === "failed" || !exportRun.blobUrl) {
    return NextResponse.json(
      { error: "Export failed" },
      { status: 500 },
    );
  }

  let blobResult;
  try {
    blobResult = await get(exportRun.blobUrl, { access: "private" });
    if (!blobResult || blobResult.statusCode !== 200) {
      throw new Error("Blob not found");
    }
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch export file" },
      { status: 500 },
    );
  }

  const project = await prisma.project.findUnique({
    where: { id: exportRun.projectId },
    select: { name: true },
  });

  const projectName = project?.name
    ? project.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
    : "project";

  const filename = `${projectName}-${exportRun.framework}.zip`;

  return new Response(blobResult.stream, {
    headers: {
      "Content-Type": exportRun.blobUrl.endsWith(".zip") ? "application/zip" : "application/octet-stream",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
