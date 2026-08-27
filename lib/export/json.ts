import type { DiagramNode, DiagramEdge } from "@/components/editor/starter-templates";
import { downloadFile } from "./download";

export function exportToJson(
  nodes: DiagramNode[],
  edges: DiagramEdge[],
  filename: string,
): void {
  const data = JSON.stringify({ nodes, edges }, null, 2);
  downloadFile(data, `${filename}-canvas.json`, "application/json");
}
