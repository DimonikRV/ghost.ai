// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { exportToJson } from "@/lib/export/json";
import * as downloadModule from "@/lib/export/download";
import type { DiagramNode, DiagramEdge } from "@/components/editor/starter-templates";

vi.mock("@/lib/export/download", () => ({
  downloadFile: vi.fn(),
}));

const mockDownloadFile = vi.mocked(downloadModule.downloadFile);

function makeNode(id: string, label: string): DiagramNode {
  return {
    id,
    type: "canvasNode",
    position: { x: 1, y: 2 },
    data: { label, color: "var(--color-card)", shape: "rectangle" },
  };
}

function makeEdge(source: string, target: string, label?: string): DiagramEdge {
  return {
    id: `e-${source}-${target}`,
    source,
    target,
    type: "canvasEdge",
    data: label ? { label } : undefined,
  };
}

describe("exportToJson", () => {
  it("serializes nodes and edges as pretty JSON and downloads it", () => {
    const nodes = [makeNode("n1", "API")];
    const edges = [makeEdge("n1", "n2", "HTTP")];

    exportToJson(nodes, edges, "my-project");

    expect(mockDownloadFile).toHaveBeenCalledTimes(1);
    const [content, filename, mime] = mockDownloadFile.mock.calls[0] as [
      string,
      string,
      string,
    ];
    expect(filename).toBe("my-project-canvas.json");
    expect(mime).toBe("application/json");
    const parsed = JSON.parse(content);
    expect(parsed.nodes).toEqual(nodes);
    expect(parsed.edges).toEqual(edges);
  });
});
