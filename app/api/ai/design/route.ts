import { auth as clerkAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { tasks } from "@trigger.dev/sdk";
import prisma from "@/lib/prisma";
import { checkProjectAccess } from "@/lib/project-access";
import { designAgent } from "@/trigger/design-agent";

const MAX_PROMPT_LENGTH = 4000;

export async function POST(req: Request) {
  const { userId } = await clerkAuth();
  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new NextResponse("Invalid JSON", { status: 400 });
  }

  const { prompt, roomId } = body as { prompt?: unknown; roomId?: unknown };

  if (typeof roomId !== "string" || !roomId) {
    return new NextResponse("Missing or invalid roomId", { status: 400 });
  }

  if (typeof prompt !== "string" || !prompt) {
    return new NextResponse("Missing or invalid prompt", { status: 400 });
  }

  if (prompt.length > MAX_PROMPT_LENGTH) {
    return new NextResponse(`Prompt exceeds maximum length of ${MAX_PROMPT_LENGTH} characters`, { status: 400 });
  }

  const access = await checkProjectAccess(roomId);
  if (access.found === false) {
    return new NextResponse("Project not found", { status: 403 });
  }
  if (!access.access.hasAccess) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  try {
    const handle = await tasks.trigger<typeof designAgent>("design-agent", {
      prompt,
      roomId,
    });

    await prisma.taskRun.create({
      data: {
        runId: handle.id,
        task: "design-agent",
        projectId: roomId,
        userId,
      },
    });

    return NextResponse.json({ runId: handle.id });
  } catch (error) {
    console.error("[design] Failed to trigger design task", error);
    return new NextResponse("Failed to trigger design task", { status: 502 });
  }
}
