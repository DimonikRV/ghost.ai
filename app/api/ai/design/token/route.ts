import { auth as clerkAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { auth } from "@trigger.dev/sdk";
import prisma from "@/lib/prisma";

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

  const { runId } = body as { runId?: unknown };

  if (typeof runId !== "string" || !runId) {
    return new NextResponse("Missing or invalid runId", { status: 400 });
  }

  const taskRun = await prisma.taskRun.findUnique({
    where: { runId },
  });

  if (!taskRun) {
    return new NextResponse("Run not found", { status: 404 });
  }

  if (taskRun.userId !== userId) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const publicToken = await auth.createPublicToken({
    scopes: {
      read: {
        runs: [runId],
      },
    },
  });

  return NextResponse.json({ token: publicToken });
}
