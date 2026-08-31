import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { tasks } from "@trigger.dev/sdk";
import { get } from "@vercel/blob";
import { codeExport } from "@/trigger/code-export";
import { getFramework } from "@/lib/export/frameworks";
import { checkProjectAccess } from "@/lib/project-access";
import prisma from "@/lib/prisma";
import type { DiagramNode, DiagramEdge } from "@/components/editor/starter-templates";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { projectId?: string; framework?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { projectId, framework } = body;
  if (
    !projectId ||
    typeof projectId !== "string" ||
    !framework ||
    typeof framework !== "string"
  ) {
    return NextResponse.json(
      { error: "Missing projectId or framework" },
      { status: 400 },
    );
  }

  if (!getFramework(framework)) {
    return NextResponse.json({ error: "Unknown framework" }, { status: 400 });
  }

  const access = await checkProjectAccess(projectId);
  if (!access.found) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }
  if (!access.access.hasAccess) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { canvasJsonPath: true },
  });
  if (!project?.canvasJsonPath) {
    return NextResponse.json(
      { error: "No canvas saved yet" },
      { status: 404 },
    );
  }

  let canvasJson: { nodes: DiagramNode[]; edges: DiagramEdge[] };
  try {
    const blobResult = await get(project.canvasJsonPath, { access: "private" });
    if (!blobResult || blobResult.statusCode !== 200) {
      throw new Error("Blob not found");
    }
    const reader = blobResult.stream.getReader();
    const textDecoder = new TextDecoder();
    let json = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      json += textDecoder.decode(value);
    }
    canvasJson = JSON.parse(json);
  } catch {
    return NextResponse.json(
      { error: "Failed to load canvas state" },
      { status: 500 },
    );
  }

  if (
    !canvasJson.nodes ||
    !Array.isArray(canvasJson.nodes) ||
    canvasJson.nodes.length === 0
  ) {
    return NextResponse.json(
      { error: "Canvas is empty — add nodes before exporting" },
      { status: 400 },
    );
  }

  let handle: { id: string };
  try {
    handle = await tasks.trigger<typeof codeExport>("code-export", {
      canvasJson,
      framework,
      projectId,
      userId,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to trigger export task" },
      { status: 502 },
    );
  }

  await prisma.exportRun.create({
    data: {
      runId: handle.id,
      projectId,
      userId,
      framework,
      status: "pending",
    },
  });

  return NextResponse.json({ runId: handle.id });
}
