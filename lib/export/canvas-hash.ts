import { createHash } from "node:crypto";

type NodeLike = {
  id?: string;
  data?: { label?: string; shape?: string };
};

type EdgeLike = {
  id?: string;
  source?: string;
  target?: string;
  data?: { label?: string };
};

// Architecturally meaningful fingerprint of a canvas. Node identity is
// (id, label, shape); edge identity is (source, target, label). Position is
// deliberately excluded — moving a shape around the canvas is not drift.
// The output is deterministic and order-independent so the same topology
// always hashes identically regardless of array order.
export function fingerprintCanvas(
  nodes: unknown[],
  edges: unknown[],
): string {
  const toNode = (value: unknown): NodeLike => {
    if (value && typeof value === "object") {
      const n = value as {
        id?: unknown;
        data?: { label?: unknown; shape?: unknown };
      };
      return {
        id: typeof n.id === "string" ? n.id : "",
        data: {
          label:
            n.data && typeof n.data.label === "string" ? n.data.label : "",
          shape:
            n.data && typeof n.data.shape === "string" ? n.data.shape : "",
        },
      };
    }
    return {};
  };

  const toEdge = (value: unknown): EdgeLike => {
    if (value && typeof value === "object") {
      const e = value as {
        source?: unknown;
        target?: unknown;
        data?: { label?: unknown };
      };
      return {
        source: typeof e.source === "string" ? e.source : "",
        target: typeof e.target === "string" ? e.target : "",
        data: {
          label: e.data && typeof e.data.label === "string" ? e.data.label : "",
        },
      };
    }
    return {};
  };

  const nodesKey = nodes
    .map((n) => toNode(n))
    .map((n) => JSON.stringify([n.id ?? "", n.data?.label ?? "", n.data?.shape ?? ""]))
    .sort();

  const edgesKey = edges
    .map((e) => toEdge(e))
    .map((e) =>
      JSON.stringify([e.source ?? "", e.target ?? "", e.data?.label ?? ""]),
    )
    .sort();

  const canonical = JSON.stringify({
    nodes: nodesKey,
    edges: edgesKey,
  });

  return createHash("sha256").update(canonical).digest("hex");
}

export function hashCanvas(canvas: {
  nodes?: unknown[];
  edges?: unknown[];
}): string {
  return fingerprintCanvas(canvas.nodes ?? [], canvas.edges ?? []);
}
