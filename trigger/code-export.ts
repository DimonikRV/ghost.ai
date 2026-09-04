import { task, logger } from "@trigger.dev/sdk";
import type { AnyOnCatchErrorHookFunction } from "@trigger.dev/sdk";
import { generateObject } from "ai";
import type { LanguageModel } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
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

const googleApiKey =
  process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GOOGLE_AI_API_KEY;
if (!googleApiKey) {
  console.error(
    "Missing Google AI API key: set GOOGLE_GENERATIVE_AI_API_KEY or GOOGLE_AI_API_KEY",
  );
}

const google = createGoogleGenerativeAI({
  apiKey: googleApiKey || undefined,
});

type CodeExportPayload = {
  canvasJson: { nodes: DiagramNode[]; edges: DiagramEdge[] };
  framework: string;
  projectId: string;
  userId: string;
};

const handleExportError: AnyOnCatchErrorHookFunction = async ({
  error,
  ctx,
}) => {
  const message = error instanceof Error ? error.message : String(error);
  logger.error("Code export task failed", { error: message });
  await prisma.exportRun.updateMany({
    where: { runId: ctx.run.id },
    data: { status: "failed", completedAt: new Date() },
  });
};

export const codeExport = task({
  id: "code-export",
  retry: {
    maxAttempts: 2,
    factor: 2,
    minTimeoutInMs: 2_000,
    maxTimeoutInMs: 30_000,
    randomize: false,
  },
  catchError: handleExportError,
  run: async (
    payload: CodeExportPayload,
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
      model: google("gemini-3.6-flash") as unknown as LanguageModel,
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

    const sanitizePath = (raw: string): string => {
      const normalized = raw
        .replace(/\\/g, "/")
        .replace(/^\/+/, "")
        .replace(/^(\.\.\/)+/, "")
        .replace(/^[A-Za-z]:/, "")
        .split("/")
        .filter((seg) => seg && seg !== "." && seg !== "..")
        .join("/");
      return normalized || "untitled.txt";
    };

    const zip = new JSZip();
    for (const file of result.files) {
      zip.file(sanitizePath(file.path), file.content);
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
