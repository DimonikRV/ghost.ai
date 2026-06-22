export type ShapeType =
  | "rectangle"
  | "diamond"
  | "circle"
  | "pill"
  | "cylinder"
  | "hexagon";

export interface CanvasNodeData {
  label: string;
  color: string;
  shape: ShapeType;
}

export type CanvasNodeTypes = "canvasNode";

export type CanvasEdgeTypes = "canvasEdge";
