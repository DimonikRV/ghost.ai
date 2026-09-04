// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
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
  wrapperMounted: true,
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

  it("disables generate and shows a hint when the canvas has no nodes", async () => {
    global.fetch = vi.fn(async () =>
      new Response(JSON.stringify({ nodes: [], edges: [] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    ) as unknown as typeof fetch;

    const user = userEvent.setup();
    render(<ExportDialog {...baseProps} />);
    await user.click(await screen.findByRole("button", { name: /Java Spring Boot/i }));

    const gen = screen.getByRole("button", { name: /Generate & Download ZIP/i });
    await waitFor(() => expect(gen).toBeDisabled());
    expect(
      screen.getByText(/add at least one node to your canvas/i),
    ).toBeInTheDocument();
  });

  it("re-enables generate and clears the hint when the canvas has nodes", async () => {
    const user = userEvent.setup();
    render(<ExportDialog {...baseProps} />);
    const gen = screen.getByRole("button", { name: /Generate & Download ZIP/i });

    const springBtn = await screen.findByRole("button", { name: /Java Spring Boot/i });
    await user.click(springBtn);

    await waitFor(() => expect(gen).toBeEnabled());
    expect(
      screen.queryByText(/add at least one node to your canvas/i),
    ).not.toBeInTheDocument();
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

  it("disables PNG and SVG buttons when the wrapper is not mounted", () => {
    render(<ExportDialog {...baseProps} wrapperMounted={false} />);
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

  it("polls the status envelope and downloads the ZIP via ?file=1", async () => {
    const user = userEvent.setup();
    const downloadCalls: string[] = [];
    global.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (init?.method === "POST") {
        return new Response(JSON.stringify({ runId: "run_poll_test_1" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      if (url.includes("?file=1")) {
        downloadCalls.push(url);
        return new Response("PK\x03\x04fake-zip", {
          status: 200,
          headers: {
            "Content-Type": "application/zip",
            "Content-Disposition":
              'attachment; filename="dl-test-spring-boot.zip"',
          },
        });
      }
      if (url.includes("/download")) {
        return new Response(JSON.stringify({ status: "completed" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      // canvas state fetch on open
      return new Response(JSON.stringify(canvasState), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }) as unknown as typeof fetch;

    render(<ExportDialog {...baseProps} />);
    const springBtn = await screen.findByRole("button", {
      name: /Java Spring Boot/i,
    });
    await user.click(springBtn);

    const gen = screen.getByRole("button", {
      name: /Generate & Download ZIP/i,
    });
    await user.click(gen);

    await waitFor(
      () => expect(mockDownloadFile).toHaveBeenCalled(),
      { timeout: 15_000 },
    );

    expect(downloadCalls.length).toBe(1);
    const [blob, filename, mime] = mockDownloadFile.mock.calls.at(-1) as [
      Blob,
      string,
      string,
    ];
    expect(filename).toBe("dl-test-spring-boot.zip");
    expect(mime).toBe("application/zip");
    expect(blob.type).toBe("application/zip");
    const bytes = new Uint8Array(await blob.arrayBuffer());
    expect(new TextDecoder().decode(bytes)).toBe("PK\x03\x04fake-zip");
    expect(baseProps.onClose).toHaveBeenCalled();
  });
});
