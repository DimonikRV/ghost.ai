// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ExportDialog } from "@/components/editor/export-dialog";
import { downloadFile } from "@/lib/export/download";
import { exportToPng, exportToSvg } from "@/lib/export/image";
import { FRAMEWORKS } from "@/lib/export/frameworks";

vi.mock("@/lib/export/download", () => ({
  downloadFile: vi.fn(),
}));

vi.mock("@/lib/export/image", () => ({
  exportToPng: vi.fn(async () => {}),
  exportToSvg: vi.fn(async () => {}),
}));

const mockDownloadFile = vi.mocked(downloadFile);
const mockExportToPng = vi.mocked(exportToPng);
const mockExportToSvg = vi.mocked(exportToSvg);

const baseProps = {
  isOpen: true,
  onClose: vi.fn(),
  projectId: "proj_123",
  projectName: "My Project",
  reactFlowWrapperRef: { current: document.createElement("div") },
};

const canvasState = {
  nodes: [
    {
      id: "n1",
      type: "canvasNode",
      position: { x: 0, y: 0 },
      data: { label: "API", color: "var(--color-card)", shape: "rectangle" },
    },
  ],
  edges: [],
};

beforeEach(() => {
  vi.clearAllMocks();
  global.fetch = vi.fn(async () =>
    new Response(JSON.stringify(canvasState), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }),
  ) as unknown as typeof fetch;
});

describe("ExportDialog", () => {
  it("renders the Diagram Formats and Code Scaffolds sections", () => {
    render(<ExportDialog {...baseProps} />);
    expect(screen.getByText("Diagram Formats")).toBeInTheDocument();
    expect(screen.getByText("Code Scaffolds")).toBeInTheDocument();
    expect(screen.getByText("Generate & Download ZIP")).toBeInTheDocument();
  });

  it("renders all framework buttons", () => {
    render(<ExportDialog {...baseProps} />);
    for (const fw of FRAMEWORKS) {
      expect(screen.getByText(fw.name)).toBeInTheDocument();
    }
  });

  it("highlights a framework when selected", async () => {
    const user = userEvent.setup();
    render(<ExportDialog {...baseProps} />);
    const btn = await screen.findByRole("button", { name: /Java Spring Boot/i });
    await user.click(btn);
    expect(btn.className).toContain("accent-brand");
  });

  it("disables the generate button until a framework is selected", () => {
    render(<ExportDialog {...baseProps} />);
    const gen = screen.getByRole("button", { name: /Generate & Download ZIP/i });
    expect(gen).toBeDisabled();
  });

  it("downloads Mermaid when the Mermaid format button is clicked", async () => {
    const user = userEvent.setup();
    render(<ExportDialog {...baseProps} />);
    await user.click(screen.getByRole("button", { name: /^Mermaid$/ }));
    await waitFor(() => expect(mockDownloadFile).toHaveBeenCalled());
    const [content, filename] = mockDownloadFile.mock.calls[0] as [
      string,
      string,
      string,
    ];
    expect(filename).toContain(".mmd");
    expect(content).toContain("graph TD");
  });

  it("downloads PlantUML when the PlantUML format button is clicked", async () => {
    const user = userEvent.setup();
    render(<ExportDialog {...baseProps} />);
    await user.click(screen.getByRole("button", { name: /^PlantUML$/ }));
    await waitFor(() => expect(mockDownloadFile).toHaveBeenCalled());
    const [content, filename] = mockDownloadFile.mock.calls[0] as [
      string,
      string,
      string,
    ];
    expect(filename).toContain(".puml");
    expect(content).toContain("@startuml");
  });

  it("downloads JSON when the JSON format button is clicked", async () => {
    const user = userEvent.setup();
    render(<ExportDialog {...baseProps} />);
    await user.click(screen.getByRole("button", { name: /^JSON$/ }));
    await waitFor(() => expect(mockDownloadFile).toHaveBeenCalled());
    const [, filename, mime] = mockDownloadFile.mock.calls[0] as [
      string,
      string,
      string,
    ];
    expect(mime).toBe("application/json");
    expect(filename).toContain("my-project-canvas.json");
  });

  it("disables PNG and SVG buttons when reactFlowWrapperRef.current is null", () => {
    render(
      <ExportDialog {...baseProps} reactFlowWrapperRef={{ current: null }} />,
    );
    expect(screen.getByRole("button", { name: /^PNG$/ })).toBeDisabled();
    expect(screen.getByRole("button", { name: /^SVG$/ })).toBeDisabled();
  });

  it("exports PNG using the ReactFlow wrapper ref", async () => {
    const user = userEvent.setup();
    render(<ExportDialog {...baseProps} />);
    await user.click(screen.getByRole("button", { name: /^PNG$/ }));
    await waitFor(() =>
      expect(mockExportToPng).toHaveBeenCalled(),
    );
    expect(mockExportToPng.mock.calls[0][0]).toBe(
      baseProps.reactFlowWrapperRef.current,
    );
  });

  it("exports SVG using the ReactFlow wrapper ref", async () => {
    const user = userEvent.setup();
    render(<ExportDialog {...baseProps} />);
    await user.click(screen.getByRole("button", { name: /^SVG$/ }));
    await waitFor(() =>
      expect(mockExportToSvg).toHaveBeenCalled(),
    );
    expect(mockExportToSvg.mock.calls[0][0]).toBe(
      baseProps.reactFlowWrapperRef.current,
    );
  });
});
