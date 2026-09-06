import { describe, expect, it } from "vitest";
import { fingerprintCanvas, hashCanvas } from "@/lib/export/canvas-hash";

const baseNodes = [
  {
    id: "n1",
    type: "canvasNode",
    position: { x: 0, y: 0 },
    data: { label: "API", color: "red", shape: "rectangle" },
  },
  {
    id: "n2",
    type: "canvasNode",
    position: { x: 100, y: 100 },
    data: { label: "Postgres", color: "blue", shape: "cylinder" },
  },
];

const baseEdges = [
  { id: "e1", source: "n1", target: "n2", type: "default", data: { label: "HTTP" } },
];

describe("fingerprintCanvas", () => {
  it("returns a deterministic hash for identical input", () => {
    expect(fingerprintCanvas(baseNodes, baseEdges)).toBe(
      fingerprintCanvas(baseNodes, baseEdges),
    );
  });

  it("is order-independent for nodes and edges", () => {
    const shuffledNodes = [baseNodes[1], baseNodes[0]];
    const shuffledEdges = [...baseEdges];
    expect(fingerprintCanvas(shuffledNodes, shuffledEdges)).toBe(
      fingerprintCanvas(baseNodes, baseEdges),
    );
  });

  it("ignores node position", () => {
    const moved = baseNodes.map((n, i) => ({
      ...n,
      position: { x: i * 999, y: 42 },
    }));
    expect(fingerprintCanvas(moved, baseEdges)).toBe(
      fingerprintCanvas(baseNodes, baseEdges),
    );
  });

  it("changes when a node label changes", () => {
    const relabeled = baseNodes.map((n) =>
      n.id === "n1" ? { ...n, data: { ...n.data, label: "Gateway" } } : n,
    );
    expect(fingerprintCanvas(relabeled, baseEdges)).not.toBe(
      fingerprintCanvas(baseNodes, baseEdges),
    );
  });

  it("changes when a node shape changes", () => {
    const reshaped = baseNodes.map((n) =>
      n.id === "n2" ? { ...n, data: { ...n.data, shape: "hexagon" } } : n,
    );
    expect(fingerprintCanvas(reshaped, baseEdges)).not.toBe(
      fingerprintCanvas(baseNodes, baseEdges),
    );
  });

  it("changes when a node is added or removed", () => {
    const added = [...baseNodes, { ...baseNodes[0], id: "n3" }];
    expect(fingerprintCanvas(added, baseEdges)).not.toBe(
      fingerprintCanvas(baseNodes, baseEdges),
    );

    const removed = [baseNodes[0]];
    expect(fingerprintCanvas(removed, baseEdges)).not.toBe(
      fingerprintCanvas(baseNodes, baseEdges),
    );
  });

  it("changes when an edge source/target/label changes", () => {
    const otherTarget = {
      ...baseEdges[0],
      target: "n3",
    };
    expect(fingerprintCanvas(baseNodes, [otherTarget])).not.toBe(
      fingerprintCanvas(baseNodes, baseEdges),
    );

    const relabeled = { ...baseEdges[0], data: { label: "gRPC" } };
    expect(fingerprintCanvas(baseNodes, [relabeled])).not.toBe(
      fingerprintCanvas(baseNodes, baseEdges),
    );
  });

  it("changes when an edge is added", () => {
    const added = [...baseEdges, { id: "e2", source: "n2", target: "n1", type: "default" }];
    expect(fingerprintCanvas(baseNodes, added)).not.toBe(
      fingerprintCanvas(baseNodes, baseEdges),
    );
  });
});

describe("hashCanvas", () => {
  it("handles missing nodes/edges arrays", () => {
    const empty = hashCanvas({});
    expect(hashCanvas({ nodes: [], edges: [] })).toBe(empty);
  });

  it("tolerates missing optional fields on malformed entries", () => {
    expect(() =>
      hashCanvas({
        nodes: [{}, { id: "a" }],
        edges: [{}, { source: "a", target: "b" }],
      }),
    ).not.toThrow();
  });
});
