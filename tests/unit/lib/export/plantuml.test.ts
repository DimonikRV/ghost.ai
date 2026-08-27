import { describe, expect, it } from "vitest";
import { graphToPlantUml } from "@/lib/export/plantuml";
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

describe("graphToPlantUml", () => {
  it("returns @startuml/@enduml for an empty graph", () => {
    const result = graphToPlantUml([], []);
    expect(result).toBe("@startuml\n@enduml");
  });

  it("maps rectangle to component", () => {
    const result = graphToPlantUml([makeNode("n1", "rectangle", "Server")], []);
    expect(result).toContain('  component "Server" as n1');
  });

  it("maps diamond to rectangle with <<decision>> stereotype", () => {
    const result = graphToPlantUml([makeNode("n1", "diamond", "Decision")], []);
    expect(result).toContain('  rectangle "Decision" as n1 <<decision>>');
  });

  it("maps circle to actor", () => {
    const result = graphToPlantUml([makeNode("n1", "circle", "User")], []);
    expect(result).toContain('  actor "User" as n1');
  });

  it("maps cylinder to database", () => {
    const result = graphToPlantUml([makeNode("n1", "cylinder", "DB")], []);
    expect(result).toContain('  database "DB" as n1');
  });

  it("maps hexagon to rectangle with <<external>> stereotype", () => {
    const result = graphToPlantUml([makeNode("n1", "hexagon", "External")], []);
    expect(result).toContain('  rectangle "External" as n1 <<external>>');
  });

  it("maps pill to rectangle with <<worker>> stereotype", () => {
    const result = graphToPlantUml([makeNode("n1", "pill", "Worker")], []);
    expect(result).toContain('  rectangle "Worker" as n1 <<worker>>');
  });

  it("renders edges without labels", () => {
    const nodes = [
      makeNode("a", "rectangle", "A"),
      makeNode("b", "rectangle", "B"),
    ];
    const edges = [makeEdge("a", "b")];
    const result = graphToPlantUml(nodes, edges);
    expect(result).toContain("  a --> b");
  });

  it("renders edges with labels", () => {
    const nodes = [
      makeNode("a", "rectangle", "A"),
      makeNode("b", "rectangle", "B"),
    ];
    const edges = [makeEdge("a", "b", "calls")];
    const result = graphToPlantUml(nodes, edges);
    expect(result).toContain("  a --> b : calls");
  });

  it("sanitizes special characters in node IDs", () => {
    const nodes = [makeNode("my node!", "rectangle", "Test")];
    const result = graphToPlantUml(nodes, []);
    expect(result).toContain('  component "Test" as my_node_');
  });

  it("escapes double quotes in node labels", () => {
    const nodes = [makeNode("n1", "rectangle", 'Say "hello"')];
    const result = graphToPlantUml(nodes, []);
    expect(result).toContain('  component "Say \\"hello\\"" as n1');
  });
});
