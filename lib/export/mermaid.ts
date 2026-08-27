import type { DiagramNode, DiagramEdge } from "@/components/editor/starter-templates";
import type { ShapeType } from "@/types/canvas";

function sanitizeId(raw: string): string {
  return raw.replace(/[^a-zA-Z0-9_]/g, "_");
}

function escapeMermaid(text: string): string {
  return text.replace(/"/g, "#quot;");
}

function shapeToMermaid(shape: ShapeType, label: string, id: string): string {
  const safe = escapeMermaid(label);
  switch (shape) {
    case "diamond":
      return `  ${id}{"${safe}"}`;
    case "circle":
      return `  ${id}(("${safe}"))`;
    case "cylinder":
      return `  ${id}[("${safe}")]`;
    case "hexagon":
      return `  ${id}{{"${safe}"}}`;
    case "pill":
      return `  ${id}(["${safe}"])`;
    case "rectangle":
    default:
      return `  ${id}["${safe}"]`;
  }
}

export function graphToMermaid(
  nodes: DiagramNode[],
  edges: DiagramEdge[],
): string {
  const lines: string[] = ["graph TD"];

  for (const node of nodes) {
    const id = sanitizeId(node.id);
    lines.push(shapeToMermaid(node.data.shape, node.data.label, id));
  }

  for (const edge of edges) {
    const src = sanitizeId(edge.source);
    const tgt = sanitizeId(edge.target);
    const label = edge.data?.label ? `|${escapeMermaid(edge.data.label)}|` : "";
    lines.push(`  ${src} -->${label} ${tgt}`);
  }

  return lines.join("\n");
}
