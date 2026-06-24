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

// ---------------------------------------------------------------------------
// Node color palette — single color swatches used for both node background
// and text color. Each entry is a CSS custom property token.
// ---------------------------------------------------------------------------

export const NODE_COLOR_PALETTE: {
  id: string;
  value: string;
}[] = [
    { id: "red", value: "var(--color-node-red)" },
    { id: "orange", value: "var(--color-node-orange)" },
    { id: "amber", value: "var(--color-node-amber)" },
    { id: "green", value: "var(--color-node-green)" },
    { id: "teal", value: "var(--color-node-teal)" },
    { id: "blue", value: "var(--color-node-blue)" },
    { id: "indigo", value: "var(--color-node-indigo)" },
    { id: "violet", value: "var(--color-node-violet)" },
    { id: "pink", value: "var(--color-node-pink)" },
  ];
