import type { FrameworkDef } from "./frameworks";
import type { DiagramNode, DiagramEdge } from "@/components/editor/starter-templates";

const SHAPE_SEMANTICS = `You are generating a production-ready project scaffold based on an architecture diagram.
Each shape in the diagram maps to an architectural component:

- rectangle → Service / API / compute unit (microservice, REST endpoint, GraphQL resolver)
- cylinder → Database / data store (PostgreSQL, MongoDB, Redis, S3 bucket)
- circle → Event trigger / entry point (webhook handler, cron job, message consumer)
- pill → Background worker / job processor (email worker, queue consumer, scheduler)
- hexagon → External system / third-party API (Stripe, SendGrid, Twilio, AWS service)
- diamond → Load balancer / router / API gateway / reverse proxy

Edges represent connections between components. Edge labels describe the protocol or data flow
(HTTP, gRPC, async messaging, TCP, WebSocket, etc.).

Generate REAL, runnable code — not pseudocode or placeholders.
Include proper package manifests, configuration files, and entry points.
Do NOT use placeholder comments like "// TODO: implement" — write actual implementation skeletons
with real function signatures, imports, and basic logic.`;

export function buildSystemPrompt(framework: FrameworkDef): string {
  return `${SHAPE_SEMANTICS}

## Target Framework

${framework.name} (${framework.language})

## Framework-Specific Conventions

${framework.promptHints}

## Output Format

Return a JSON object with a "files" array. Each file has:
- "path": relative file path (e.g., "src/main.ts", "pom.xml")
- "content": complete file content as a string

Generate ALL files needed for a working project scaffold:
1. Package/dependency manifest (package.json, pom.xml, Cargo.toml, go.mod, pyproject.toml, .csproj)
2. Configuration files (tsconfig.json, application.yml, .env.example, etc.)
3. Entry point (main.ts, Main.java, main.go, main.rs, Program.cs, etc.)
4. One source file per canvas node (service, model, handler, etc.)
5. A README.md explaining the project structure

Keep each file concise but complete — enough to compile/build and start the server.
Map each canvas node to a meaningful source file with proper imports and structure.`;
}

export function buildGraphDescription(canvasJson: {
  nodes: DiagramNode[];
  edges: DiagramEdge[];
}): string {
  const lines: string[] = [];

  lines.push("## Architecture Diagram");
  lines.push("");

  lines.push("### Services (Nodes)");
  for (const node of canvasJson.nodes) {
    const x = Math.round(node.position.x);
    const y = Math.round(node.position.y);
    lines.push(
      `- [${node.data.shape}] "${node.data.label}" at (${x}, ${y})`,
    );
  }

  lines.push("");
  lines.push("### Connections (Edges)");
  for (const edge of canvasJson.edges) {
    const sourceNode = canvasJson.nodes.find((n) => n.id === edge.source);
    const targetNode = canvasJson.nodes.find((n) => n.id === edge.target);
    const srcLabel = sourceNode?.data.label ?? edge.source;
    const tgtLabel = targetNode?.data.label ?? edge.target;
    const label = edge.data?.label ? ` : ${edge.data.label}` : "";
    lines.push(`- "${srcLabel}" --> "${tgtLabel}"${label}`);
  }

  return lines.join("\n");
}
