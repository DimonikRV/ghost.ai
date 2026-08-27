import { describe, expect, it } from "vitest";
import { graphToMermaid } from "@/lib/export/mermaid";
import type { DiagramNode, DiagramEdge } from "@/components/editor/starter-templates";

function makeNode(
  id: string,
  shape: DiagramNode["data"]["shape"],
  label: string,
): DiagramNode {
  return {
    id,
    type: "canvasNode",
    position: { x: 0, y: 0 },
    data: { label, color: "var(--color-card)", shape },
  };
}

function makeEdge(
  source: string,
  target: string,
  label?: string,
): DiagramEdge {
  return {
    id: `e-${source}-${target}`,
    source,
    target,
    type: "canvasEdge",
    data: label ? { label } : undefined,
  };
}

describe("graphToMermaid", () => {
  it("returns just graph TD for an empty graph", () => {
    expect(graphToMermaid([], [])).toBe("graph TD");
  });

  it("maps rectangle to [\"label\"] syntax", () => {
    const result = graphToMermaid([makeNode("n1", "rectangle", "Server")], []);
    expect(result).toContain('  n1["Server"]');
  });

  it("maps diamond to {\"label\"} syntax", () => {
    const result = graphToMermaid([makeNode("n1", "diamond", "Decision")], []);
    expect(result).toContain('  n1{"Decision"}');
  });

  it("maps circle to ((\"label\")) syntax", () => {
    const result = graphToMermaid([makeNode("n1", "circle", "Start")], []);
    expect(result).toContain('  n1(("Start"))');
  });

  it("maps cylinder to [(\"label\")] syntax", () => {
    const result = graphToMermaid([makeNode("n1", "cylinder", "DB")], []);
    expect(result).toContain('  n1[("DB")]');
  });

  it("maps hexagon to {{\"label\"}} syntax", () => {
    const result = graphToMermaid([makeNode("n1", "hexagon", "External")], []);
    expect(result).toContain('  n1{{"External"}}');
  });

  it("maps pill to ([\"label\"]) syntax", () => {
    const result = graphToMermaid([makeNode("n1", "pill", "Worker")], []);
    expect(result).toContain('  n1(["Worker"])');
  });

  it("renders edges without labels", () => {
    const nodes = [
      makeNode("a", "rectangle", "A"),
      makeNode("b", "rectangle", "B"),
    ];
    const edges = [makeEdge("a", "b")];
    const result = graphToMermaid(nodes, edges);
    expect(result).toContain("  a --> b");
  });

  it("renders edges with labels", () => {
    const nodes = [
      makeNode("a", "rectangle", "A"),
      makeNode("b", "rectangle", "B"),
    ];
    const edges = [makeEdge("a", "b", "calls")];
    const result = graphToMermaid(nodes, edges);
    expect(result).toContain('  a -->|calls| b');
  });

  it("sanitizes special characters in node IDs", () => {
    const nodes = [makeNode("my node!", "rectangle", "Test")];
    const result = graphToMermaid(nodes, []);
    expect(result).toContain('  my_node_["Test"]');
  });

  it("escapes double quotes in node labels", () => {
    const nodes = [makeNode("n1", "rectangle", 'Say "hello"')];
    const result = graphToMermaid(nodes, []);
    expect(result).toContain('  n1["Say #quot;hello#quot;"]');
  });
});
