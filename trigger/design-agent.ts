import { logger, schemaTask } from "@trigger.dev/sdk";
import { z } from "zod";
import { generateObject } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import type {
  DiagramNode,
  DiagramEdge,
} from "../components/editor/starter-templates";

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

const DESIGN_SYSTEM_PROMPT = `You are an expert software architect. Your job is to translate a user's natural-language description of a system into a visual architecture diagram for a React Flow canvas.

The canvas supports these node shapes, each with a semantic meaning:
- "rectangle" — a service, API, or general compute unit
- "cylinder" — a database or data store
- "circle" — an event trigger or entry point (webhook, cron)
- "pill" — a background worker or job
- "hexagon" — an external system or third-party API
- "diamond" — a load balancer, router, or decision point

Node colors must come from this allowed set of CSS custom-property tokens:
"var(--color-node-red)", "var(--color-node-orange)", "var(--color-node-amber)", "var(--color-node-green)", "var(--color-node-teal)", "var(--color-node-blue)", "var(--color-node-indigo)", "var(--color-node-violet)", "var(--color-node-pink)"

Rules:
- Generate 3 to 12 nodes and a connected set of edges between them.
- Every edge must reference existing node ids (source and target).
- Node type must be "canvasNode"; edge type must be "canvasEdge".
- Edge labels (optional) should describe the protocol or data flow, e.g. "HTTP", "gRPC", "async events", "SQL".
- Lay nodes out in a logical left-to-right flow using absolute coordinate positions (x grows right, y grows down). Keep x at least 40 and y at least 40; avoid overlaps.
- Prefer sensible colors by role (databases = a data color, external services = distinct, etc.).
- Choose the shape that best matches each component's role.
- Do not invent placeholder graphics or markdown — output ONLY the structured diagram.`;

const allowedNodeColors = [
  "var(--color-node-red)",
  "var(--color-node-orange)",
  "var(--color-node-amber)",
  "var(--color-node-green)",
  "var(--color-node-teal)",
  "var(--color-node-blue)",
  "var(--color-node-indigo)",
  "var(--color-node-violet)",
  "var(--color-node-pink)",
] as const;

const diagramNodeSchema = z.object({
  id: z.string().refine((id) => id.trim().length > 0),
  type: z.literal("canvasNode"),
  position: z.object({ x: z.number(), y: z.number() }),
  data: z.object({
    label: z.string(),
    color: z.enum(allowedNodeColors),
    shape: z.enum([
      "rectangle",
      "diamond",
      "circle",
      "pill",
      "cylinder",
      "hexagon",
    ]),
    width: z.number().positive(),
    height: z.number().positive(),
  }),
});

const diagramEdgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  type: z.literal("canvasEdge"),
  data: z.object({ label: z.string() }).optional(),
});

const diagramSchema = z
  .object({
    nodes: z.array(diagramNodeSchema).min(3).max(12),
    edges: z.array(diagramEdgeSchema),
  })
  .superRefine((diagram, context) => {
    const nodeIds = new Set<string>();
    for (const node of diagram.nodes) {
      if (nodeIds.has(node.id)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["nodes"],
          message: `Duplicate node id: ${node.id}`,
        });
      }
      nodeIds.add(node.id);
    }

    const adjacency = new Map<string, Set<string>>(
      diagram.nodes.map((node) => [node.id, new Set<string>()]),
    );
    for (const edge of diagram.edges) {
      if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["edges"],
          message: `Edge ${edge.id} references an unknown node`,
        });
        continue;
      }
      adjacency.get(edge.source)?.add(edge.target);
      adjacency.get(edge.target)?.add(edge.source);
    }

    const visited = new Set<string>();
    const pending = [diagram.nodes[0].id];
    while (pending.length > 0) {
      const nodeId = pending.pop();
      if (!nodeId || visited.has(nodeId)) continue;
      visited.add(nodeId);
      pending.push(...(adjacency.get(nodeId) ?? []));
    }

    if (visited.size !== nodeIds.size) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["edges"],
        message: "Diagram graph must be connected",
      });
    }
  });

export const designAgent = schemaTask({
  id: "design-agent",
  schema: z.object({
    prompt: z.string(),
    roomId: z.string(),
  }),
  retry: {
    maxAttempts: 3,
    factor: 2,
    minTimeoutInMs: 1000,
    maxTimeoutInMs: 10000,
    randomize: true,
  },
  run: async (payload) => {
    const { prompt, roomId } = payload;

    logger.info("Design agent task started", {
      roomId,
      promptLength: prompt.length,
    });

    const { object: diagram } = await generateObject({
      model: google("gemini-3.6-flash"),
      schema: diagramSchema,
      system: DESIGN_SYSTEM_PROMPT,
      prompt,
    });

    const result = {
      status: "completed" as const,
      nodes: diagram.nodes as DiagramNode[],
      edges: diagram.edges as DiagramEdge[],
    };

    logger.info("Design agent task completed", {
      nodeCount: result.nodes.length,
      edgeCount: result.edges.length,
    });

    return result;
  },
});
