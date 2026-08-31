import { describe, expect, it } from "vitest";
import {
  buildSystemPrompt,
  buildGraphDescription,
} from "@/lib/export/scaffold-prompt";
import { FRAMEWORKS } from "@/lib/export/frameworks";
import type { DiagramNode, DiagramEdge } from "@/components/editor/starter-templates";

describe("buildSystemPrompt", () => {
  it("includes the framework name and language", () => {
    const fw = FRAMEWORKS[0];
    const prompt = buildSystemPrompt(fw);
    expect(prompt).toContain(fw.name);
    expect(prompt).toContain(fw.language);
  });

  it("injects framework-specific prompt hints", () => {
    const fw = FRAMEWORKS[0];
    const hint = fw.promptHints.split(".")[0];
    const prompt = buildSystemPrompt(fw);
    expect(prompt).toContain(hint);
  });

  it("documents the shape-to-component mapping", () => {
    const prompt = buildSystemPrompt(FRAMEWORKS[0]);
    expect(prompt).toContain("rectangle");
    expect(prompt).toContain("cylinder");
    expect(prompt).toContain("Load balancer");
  });

  it("declares the files output format", () => {
    const prompt = buildSystemPrompt(FRAMEWORKS[0]);
    expect(prompt).toContain('"files"');
    expect(prompt).toContain('"path"');
    expect(prompt).toContain('"content"');
  });
});

function makeNode(
  id: string,
  shape: DiagramNode["data"]["shape"],
  label: string,
  x = 100,
  y = 200,
): DiagramNode {
  return {
    id,
    type: "canvasNode",
    position: { x, y },
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

describe("buildGraphDescription", () => {
  it("lists services with shape, label, and position", () => {
    const nodes = [makeNode("a", "rectangle", "API"), makeNode("b", "cylinder", "DB", 400, 300)];
    const desc = buildGraphDescription({ nodes, edges: [] });
    expect(desc).toContain('[rectangle] "API" at (100, 200)');
    expect(desc).toContain('[cylinder] "DB" at (400, 300)');
  });

  it("lists connections with labels", () => {
    const nodes = [makeNode("a", "rectangle", "API"), makeNode("b", "cylinder", "DB")];
    const edges = [makeEdge("a", "b", "SQL")]
      .map((e) => e);
    const desc = buildGraphDescription({ nodes, edges });
    expect(desc).toContain('"API" --> "DB" : SQL');
  });

  it("lists connections without labels", () => {
    const nodes = [makeNode("a", "rectangle", "API"), makeNode("b", "cylinder", "DB")];
    const desc = buildGraphDescription({ nodes, edges: [makeEdge("a", "b")] });
    expect(desc).toContain('"API" --> "DB"');
    expect(desc).not.toContain(" : ");
  });

  it("falls back to node id when label is missing", () => {
    const node: DiagramNode = { id: "a", type: "canvasNode", position: { x: 0, y: 0 }, data: { label: "", color: "var(--color-card)", shape: "rectangle" } };
    const desc = buildGraphDescription({ nodes: [node], edges: [] });
    expect(desc).toContain('"a"');
  });
});
