import type { DiagramNode, DiagramEdge } from "@/components/editor/starter-templates";
import type { ShapeType } from "@/types/canvas";

function sanitizeId(raw: string): string {
  return raw.replace(/[^a-zA-Z0-9_]/g, "_");
}

function escapePlantUml(text: string): string {
  return text.replace(/"/g, '\\"');
}

function shapeToPlantUml(shape: ShapeType, label: string, id: string): string {
  const safe = escapePlantUml(label);
  switch (shape) {
    case "cylinder":
      return `  database "${safe}" as ${id}`;
    case "circle":
      return `  actor "${safe}" as ${id}`;
    case "diamond":
      return `  rectangle "${safe}" as ${id} <<decision>>`;
    case "hexagon":
      return `  rectangle "${safe}" as ${id} <<external>>`;
    case "pill":
      return `  rectangle "${safe}" as ${id} <<worker>>`;
    case "rectangle":
    default:
      return `  component "${safe}" as ${id}`;
  }
}

export function graphToPlantUml(
  nodes: DiagramNode[],
  edges: DiagramEdge[],
): string {
  const lines: string[] = ["@startuml"];

  for (const node of nodes) {
    const id = sanitizeId(node.id);
    lines.push(shapeToPlantUml(node.data.shape, node.data.label, id));
  }

  for (const edge of edges) {
    const src = sanitizeId(edge.source);
    const tgt = sanitizeId(edge.target);
    const label = edge.data?.label
      ? ` : ${escapePlantUml(edge.data.label)}`
      : "";
    lines.push(`  ${src} --> ${tgt}${label}`);
  }

  lines.push("@enduml");
  return lines.join("\n");
}
