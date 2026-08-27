import { task } from "@trigger.dev/sdk";
import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";
import JSZip from "jszip";
import { getFramework } from "../lib/export/frameworks";
import {
  buildSystemPrompt,
  buildGraphDescription,
} from "../lib/export/scaffold-prompt";

export const codeExport = task({
  id: "code-export",
  retry: {
    maxAttempts: 2,
    factor: 2,
    minTimeoutInMs: 2_000,
    maxTimeoutInMs: 30_000,
    randomize: false,
  },
  run: async (
    payload: {
      canvasJson: { nodes: any[]; edges: any[] };
      framework: string;
      projectId: string;
      userId: string;
    },
    { ctx },
  ) => {
    const { canvasJson, framework: frameworkId, projectId, userId } = payload;

    const framework = getFramework(frameworkId);
    if (!framework) {
      throw new Error(`Unknown framework: ${frameworkId}`);
    }

    ctx.log.info("Starting code export", {
      framework: frameworkId,
      nodeCount: canvasJson.nodes.length,
      edgeCount: canvasJson.edges.length,
    });

    const systemPrompt = buildSystemPrompt(framework);
    const userPrompt = buildGraphDescription(canvasJson);

    const { object: result } = await generateObject({
      model: google("gemini-2.5-flash"),
      schema: z.object({
        files: z.array(
          z.object({
            path: z.string(),
            content: z.string(),
          }),
        ),
      }),
      system: systemPrompt,
      prompt: userPrompt,
    });

    ctx.log.info("AI generation complete", {
      fileCount: result.files.length,
    });

    const zip = new JSZip();
    for (const file of result.files) {
      zip.file(file.path, file.content);
    }
    const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });

    const { put } = await import("@vercel/blob");
    const blobKey = `export-${projectId}-${frameworkId}-${Date.now()}.zip`;
    const blob = await put(blobKey, zipBuffer, {
      access: "private",
      addRandomSuffix: false,
    });

    ctx.log.info("ZIP uploaded to blob storage", { blobUrl: blob.url });

    const { PrismaClient } = await import(
      "../app/generated/prisma/client"
    );
    const prisma = new PrismaClient();

    try {
      await prisma.exportRun.updateMany({
        where: { runId: ctx.task.id },
        data: {
          status: "completed",
          blobUrl: blob.url,
          completedAt: new Date(),
        },
      });
    } finally {
      await prisma.$disconnect();
    }

    return {
      status: "completed" as const,
      blobUrl: blob.url,
      fileCount: result.files.length,
    };
  },
});
