import { describe, it, expect } from "vitest";
import { CANVAS_TEMPLATES } from "@/components/editor/starter-templates";

describe("CANVAS_TEMPLATES", () => {
  it("contains exactly 3 templates", () => {
    expect(CANVAS_TEMPLATES).toHaveLength(3);
  });

  it.each(CANVAS_TEMPLATES.map((t) => [t.id, t] as const))(
    "template '%s' has required fields",
    (_id, template) => {
      expect(template.id).toBeTruthy();
      expect(template.name).toBeTruthy();
      expect(template.description).toBeTruthy();
      expect(Array.isArray(template.nodes)).toBe(true);
      expect(Array.isArray(template.edges)).toBe(true);
      expect(template.nodes.length).toBeGreaterThan(0);
      expect(template.edges.length).toBeGreaterThan(0);
    },
  );

  it("all nodes have required fields", () => {
    for (const template of CANVAS_TEMPLATES) {
      for (const node of template.nodes) {
        expect(node.id).toBeTruthy();
        expect(node.type).toBeTruthy();
        expect(node.position).toHaveProperty("x");
        expect(node.position).toHaveProperty("y");
        expect(typeof node.position.x).toBe("number");
        expect(typeof node.position.y).toBe("number");
        expect(node.data.label).toBeTruthy();
        expect(node.data.color).toBeTruthy();
        expect(node.data.shape).toBeTruthy();
      }
    }
  });

  it("all edge source/target reference valid node IDs", () => {
    for (const template of CANVAS_TEMPLATES) {
      const nodeIds = new Set(template.nodes.map((n) => n.id));
      for (const edge of template.edges) {
        expect(nodeIds.has(edge.source)).toBe(true);
        expect(nodeIds.has(edge.target)).toBe(true);
      }
    }
  });

  it("node IDs are unique within each template", () => {
    for (const template of CANVAS_TEMPLATES) {
      const ids = template.nodes.map((n) => n.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it("edge IDs are unique within each template", () => {
    for (const template of CANVAS_TEMPLATES) {
      const ids = template.edges.map((e) => e.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it("template IDs are unique", () => {
    const ids = CANVAS_TEMPLATES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
