import { task, logger } from "@trigger.dev/sdk";
import { generateObject } from "ai";
import type { LanguageModel } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";
import JSZip from "jszip";
import { put } from "@vercel/blob";
import { getFramework } from "../lib/export/frameworks";
import {
  buildSystemPrompt,
  buildGraphDescription,
} from "../lib/export/scaffold-prompt";
import prisma from "../lib/prisma";
import type { DiagramNode, DiagramEdge } from "../components/editor/starter-templates";

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
      canvasJson: { nodes: DiagramNode[]; edges: DiagramEdge[] };
      framework: string;
      projectId: string;
      userId: string;
    },
    { ctx },
  ) => {
    const { canvasJson, framework: frameworkId, projectId } = payload;

    const framework = getFramework(frameworkId);
    if (!framework) {
      throw new Error(`Unknown framework: ${frameworkId}`);
    }

    logger.info("Starting code export", {
      framework: frameworkId,
      nodeCount: canvasJson.nodes.length,
      edgeCount: canvasJson.edges.length,
    });

    const systemPrompt = buildSystemPrompt(framework);
    const userPrompt = buildGraphDescription(canvasJson);

    const { object: result } = await generateObject({
      model: google("gemini-2.5-flash") as unknown as LanguageModel,
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

    logger.info("AI generation complete", {
      fileCount: result.files.length,
    });

    const zip = new JSZip();
    for (const file of result.files) {
      zip.file(file.path, file.content);
    }
    const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });

    const blobKey = `export-${projectId}-${frameworkId}-${Date.now()}.zip`;
    const blob = await put(blobKey, zipBuffer, {
      access: "private",
      addRandomSuffix: false,
    });

    logger.info("ZIP uploaded to blob storage", { blobUrl: blob.url });

    await prisma.exportRun.updateMany({
      where: { runId: ctx.run.id },
      data: {
        status: "completed",
        blobUrl: blob.url,
        completedAt: new Date(),
      },
    });

    return {
      status: "completed" as const,
      blobUrl: blob.url,
      fileCount: result.files.length,
    };
  },
});
