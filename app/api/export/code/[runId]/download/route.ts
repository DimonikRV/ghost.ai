import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { runs } from "@trigger.dev/sdk";
import { get } from "@vercel/blob";
import prisma from "@/lib/prisma";

// A run that has been sitting in "pending"/"generating" for longer than this
// (without Trigger.dev reporting a terminal state) is considered hung — the
// worker likely never picked it up. Fail it so the client stops polling.
const QUEUE_TIMEOUT_MS = 5 * 60 * 1000;

export async function GET(
  req: Request,
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

  const url = new URL(req.url);
  const streamFile = url.searchParams.get("file") === "1";

  // While the run is still processing, return a 200 status envelope so the
  // client's polling loop never surfaces non-2xx responses (which the browser
  // logs as red console errors). Only `?file=1` streams the binary ZIP.
  if (exportRun.status === "pending" || exportRun.status === "generating") {
    let runFailed = false;

    try {
      const run = await runs.retrieve(runId);
      if (run) {
        const terminalStatuses = [
          "FAILED",
          "CANCELED",
          "CRASHED",
          "EXPIRED",
          "TIMED_OUT",
          "SYSTEM_FAILURE",
        ] as const;
        if (
          run.isFailed ||
          run.isCancelled ||
          terminalStatuses.includes(run.status as (typeof terminalStatuses)[number])
        ) {
          runFailed = true;
        }
      }
    } catch {
      // If we can't reach Trigger.dev, keep polling — it may be a transient error
    }

    // Guard against a run that never got picked up or was dropped from the
    // queue (e.g. worker down): if it's been pending too long, fail it rather
    // than leaving the user stuck polling indefinitely.
    const hung =
      !runFailed &&
      Date.now() - Number(exportRun.createdAt) > QUEUE_TIMEOUT_MS;

    if (runFailed || hung) {
      await prisma.exportRun.update({
        where: { runId },
        data: { status: "failed", completedAt: new Date() },
      });
    }

    const fresh = await prisma.exportRun.findUnique({ where: { runId } });
    if (fresh?.status === "failed") {
      return NextResponse.json({
        status: "failed",
        error: "Export generation failed",
      });
    }

    return NextResponse.json({ status: "pending" });
  }

  if (exportRun.status === "failed" || !exportRun.blobUrl) {
    return NextResponse.json({
      status: "failed",
      error: "Export generation failed",
    });
  }

  if (!streamFile) {
    return NextResponse.json({ status: "completed" });
  }

  let blobResult;
  try {
    blobResult = await get(exportRun.blobUrl, { access: "private" });
    if (!blobResult || blobResult.statusCode !== 200) {
      throw new Error("Blob not found");
    }
  } catch {
    return NextResponse.json({
      status: "failed",
      error: "Failed to fetch export file",
    });
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

  // Set an explicit Content-Length from the blob metadata. A streamed ZIP
  // without a known byte length can be mis-parsed by ZIP viewers/tools that
  // buffer or seek on the response, producing spurious "unknown format" /
  // "invalid archive" errors on an otherwise valid file.
  return new Response(blobResult.stream, {
    headers: {
      "Content-Type": exportRun.blobUrl.endsWith(".zip")
        ? "application/zip"
        : "application/octet-stream",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": String(blobResult.blob.size),
    },
  });
}
