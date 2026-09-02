import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { runs } from "@trigger.dev/sdk";
import prisma from "@/lib/prisma";

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

  const taskRun = await prisma.taskRun.findUnique({
    where: { runId },
  });
  if (!taskRun) {
    return NextResponse.json({ error: "Run not found" }, { status: 404 });
  }
  if (taskRun.userId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let run;
  try {
    run = await runs.retrieve(runId);
  } catch {
    return NextResponse.json({ error: "Failed to fetch run" }, { status: 500 });
  }

  if (run?.isCompleted) {
    const output = run.output as
      | { nodes?: unknown[]; edges?: unknown[] }
      | undefined;
    return NextResponse.json({
      status: "completed",
      nodes: output?.nodes ?? [],
      edges: output?.edges ?? [],
    });
  }

  if (run?.isFailed || run?.isCancelled) {
    return NextResponse.json({ error: "Run failed" }, { status: 500 });
  }

  return NextResponse.json({ status: "processing" }, { status: 409 });
}