// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

const mockUpdateNode = vi.fn();
const mockUpdateEdge = vi.fn();
const mockScreenToFlowPosition = vi.fn().mockReturnValue({ x: 100, y: 200 });
const mockZoomIn = vi.fn();
const mockZoomOut = vi.fn();
const mockFitView = vi.fn();
const mockOnNodesChange = vi.fn();
const mockOnEdgesChange = vi.fn();
const mockOnConnect = vi.fn();
const mockOnDelete = vi.fn();
const mockGetNodes = vi.fn().mockReturnValue([]);
const mockGetEdges = vi.fn().mockReturnValue([]);
const mockAddNodes = vi.fn();
const mockDeleteElements = vi.fn();
const mockUpdateMyPresence = vi.fn();

let nodeNodes: unknown[] = [];
let nodeEdges: unknown[] = [];

vi.mock("@xyflow/react", () => {
  const React = require("react");
  const RF = React.forwardRef(function ReactFlowMock(props: any, ref: any) {
    return (
      <div data-testid="react-flow" ref={ref}>
        {props.children}
      </div>
    );
  });
  RF.displayName = "ReactFlow";
  return {
    ReactFlow: RF,
    Controls: () => <div data-testid="controls" />,
    MiniMap: () => <div data-testid="minimap" />,
    Background: () => <div data-testid="background" />,
    BackgroundVariant: { Dots: "dots" },
    Handle: ({ type, position, id, isConnectable, style }: any) => (
      <div
        data-testid={`handle-${type}-${position}-${id}`}
        data-connectable={String(isConnectable)}
        style={style}
      />
    ),
    Position: { Top: "top", Bottom: "bottom", Left: "left", Right: "right" },
    ConnectionMode: { Loose: "loose" },
    NodeResizer: ({
      nodeId,
      isVisible,
      minWidth,
      minHeight,
      onResize,
    }: any) => (
      <div
        data-testid="node-resizer"
        data-node-id={nodeId}
        data-is-visible={String(isVisible)}
        data-min-width={minWidth}
        data-min-height={minHeight}
        data-on-resize={onResize ? "set" : "unset"}
      />
    ),
    NodeToolbar: ({ isVisible, children, ...rest }: any) => (
      <div data-testid="node-toolbar" data-is-visible={String(isVisible)}>
        {children}
      </div>
    ),
    BaseEdge: () => <div data-testid="base-edge" />,
    EdgeLabelRenderer: ({ children }: any) => (
      <div data-testid="edge-label">{children}</div>
    ),
    getSmoothStepPath: () => ["M0,0 L100,100", 50, 50],
    MarkerType: { ArrowClosed: "arrowclosed" },
    ReactFlowProvider: ({ children }: any) => <div>{children}</div>,
    useReactFlow: () => ({
      getNodes: mockGetNodes,
      getEdges: mockGetEdges,
      setNodes: vi.fn(),
      setEdges: vi.fn(),
      addNodes: mockAddNodes,
      deleteElements: mockDeleteElements,
      screenToFlowPosition: mockScreenToFlowPosition,
      zoomIn: mockZoomIn,
      zoomOut: mockZoomOut,
      fitView: mockFitView,
      updateNode: mockUpdateNode,
      updateEdge: mockUpdateEdge,
    }),
    applyNodeChanges: vi.fn().mockImplementation((_: any, nodes: any) => nodes),
    applyEdgeChanges: vi.fn().mockImplementation((_: any, edges: any) => edges),
    addEdge: vi
      .fn()
      .mockImplementation((edge: any, edges: any) => [...edges, edge]),
  };
});

vi.mock("@liveblocks/react-flow", () => ({
  useLiveblocksFlow: () => ({
    presence: { update: vi.fn() },
    nodes: nodeNodes,
    edges: nodeEdges,
    onNodesChange: mockOnNodesChange,
    onEdgesChange: mockOnEdgesChange,
    onConnect: mockOnConnect,
    onDelete: mockOnDelete,
  }),
  Cursors: () => <div data-testid="cursors" />,
}));

vi.mock("@liveblocks/react", () => ({
  useCanUndo: () => false,
  useCanRedo: () => false,
  useUndo: vi.fn(),
  useRedo: vi.fn(),
  useUpdateMyPresence: () => mockUpdateMyPresence,
}));

vi.mock("@/components/editor/shape-panel", () => ({
  DRAG_DATA_TYPE: "application/ghost-shape",
}));

vi.mock("@/components/editor/canvas-control-bar", () => ({
  CanvasControlBar: (props: any) => <div data-testid="control-bar" />,
}));

vi.mock("@/components/editor/starter-templates-modal", () => ({
  StarterTemplatesModal: (props: any) => (
    <div data-testid="templates-modal" data-open={String(props.open)}>
      <button
        data-testid="templates-close"
        onClick={() => props.onOpenChange(false)}
      >
        close
      </button>
      <button
        data-testid="templates-import"
        onClick={() => props.onImport({ nodes: [], edges: [] })}
      >
        import
      </button>
    </div>
  ),
}));

vi.mock("@/components/editor/help-dialog", () => ({
  HelpDialog: (props: any) => (
    <div data-testid="help-dialog" data-open={String(props.open)}>
      <button
        data-testid="help-close"
        onClick={() => props.onOpenChange(false)}
      >
        close
      </button>
    </div>
  ),
}));

vi.mock("@/hooks/useKeyboardShortcuts", () => ({
  useKeyboardShortcuts: vi.fn(),
}));

vi.mock("@/hooks/use-canvas-autosave", () => ({
  useCanvasAutosave: vi.fn().mockReturnValue("idle"),
}));

import { Canvas } from "@/components/editor/canvas";
import { RegisterApplyDiagramContext } from "@/components/editor/react-flow-wrapper-ref-context";

describe("Canvas", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    nodeNodes = [];
    nodeEdges = [];
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ nodes: [], edges: [] }),
    });
  });

  it("renders ReactFlow wrapper with children", () => {
    render(<Canvas projectId="proj_1" />);
    expect(screen.getByTestId("react-flow")).toBeInTheDocument();
    expect(screen.getByTestId("cursors")).toBeInTheDocument();
    expect(screen.getByTestId("minimap")).toBeInTheDocument();
    expect(screen.getByTestId("controls")).toBeInTheDocument();
    expect(screen.getByTestId("background")).toBeInTheDocument();
  });

  it("renders CanvasControlBar", () => {
    render(<Canvas projectId="proj_1" />);
    expect(screen.getByTestId("control-bar")).toBeInTheDocument();
  });

  it("renders StarterTemplatesModal and HelpDialog", () => {
    render(<Canvas projectId="proj_1" />);
    expect(screen.getByTestId("templates-modal")).toBeInTheDocument();
    expect(screen.getByTestId("help-dialog")).toBeInTheDocument();
  });

  it("calls fetch to load saved canvas on mount", async () => {
    render(<Canvas projectId="proj_42" />);
    expect(global.fetch).toHaveBeenCalledWith("/api/projects/proj_42/canvas");
  });

  it("handles onDragOver and prevents default", () => {
    const { container } = render(<Canvas projectId="proj_1" />);
    const wrapper = container.firstElementChild as HTMLElement;
    const event = new Event("dragover", { bubbles: true, cancelable: true });
    Object.defineProperty(event, "preventDefault", { value: vi.fn() });
    Object.defineProperty(event, "dataTransfer", {
      value: { dropEffect: "" },
    });
    fireEvent(wrapper, event);
    expect(event.preventDefault).toHaveBeenCalled();
  });

  it("handles onDragLeave", () => {
    const { container } = render(<Canvas projectId="proj_1" />);
    const wrapper = container.firstElementChild as HTMLElement;
    fireEvent.dragLeave(wrapper);
  });

  it("handles onDrop with valid shape data", () => {
    const { container } = render(<Canvas projectId="proj_1" />);
    const wrapper = container.firstElementChild as HTMLElement;
    const payload = JSON.stringify({
      type: "rectangle",
      width: 180,
      height: 100,
    });
    const event = new Event("drop", { bubbles: true, cancelable: true });
    Object.defineProperty(event, "preventDefault", { value: vi.fn() });
    Object.defineProperty(event, "dataTransfer", {
      value: {
        getData: vi.fn().mockReturnValue(payload),
        dropEffect: "",
      },
    });
    Object.defineProperty(event, "clientX", { value: 100 });
    Object.defineProperty(event, "clientY", { value: 200 });
    fireEvent(wrapper, event);
    expect(mockOnNodesChange).toHaveBeenCalled();
  });

  it("handles onDrop with invalid JSON", () => {
    const { container } = render(<Canvas projectId="proj_1" />);
    const wrapper = container.firstElementChild as HTMLElement;
    const event = new Event("drop", { bubbles: true, cancelable: true });
    Object.defineProperty(event, "preventDefault", { value: vi.fn() });
    Object.defineProperty(event, "dataTransfer", {
      value: {
        getData: vi.fn().mockReturnValue("not-json"),
        dropEffect: "",
      },
    });
    fireEvent(wrapper, event);
    expect(mockOnNodesChange).not.toHaveBeenCalled();
  });

  it("handles onDrop with empty payload", () => {
    const { container } = render(<Canvas projectId="proj_1" />);
    const wrapper = container.firstElementChild as HTMLElement;
    const event = new Event("drop", { bubbles: true, cancelable: true });
    Object.defineProperty(event, "preventDefault", { value: vi.fn() });
    Object.defineProperty(event, "dataTransfer", {
      value: {
        getData: vi.fn().mockReturnValue(""),
        dropEffect: "",
      },
    });
    fireEvent(wrapper, event);
    expect(mockOnNodesChange).not.toHaveBeenCalled();
  });

  it("loads saved nodes from API and applies them", async () => {
    const savedNodes = [
      {
        id: "n1",
        type: "canvasNode",
        position: { x: 0, y: 0 },
        data: { label: "Saved" },
      },
    ];
    const savedEdges = [
      { id: "e1", source: "n1", target: "n1", type: "canvasEdge", data: {} },
    ];
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ nodes: savedNodes, edges: savedEdges }),
    });

    render(<Canvas projectId="proj_load" />);
    await vi.waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/projects/proj_load/canvas",
      );
    });
    await vi.waitFor(() => {
      expect(mockOnNodesChange).toHaveBeenCalled();
    });
  });

  it("does not merge saved canvas data after applying a diagram during hydration", async () => {
    let resolveFetch: ((response: Response) => void) | undefined;
    let registeredApply: ((nodes: unknown[], edges: unknown[]) => void) | null =
      null;
    const savedNodes = [{ id: "saved", type: "canvasNode" }];
    const savedEdges = [{ id: "saved-edge", source: "saved", target: "saved" }];

    global.fetch = vi.fn().mockReturnValue(
      new Promise<Response>((resolve) => {
        resolveFetch = resolve;
      }),
    );

    render(
      <RegisterApplyDiagramContext.Provider
        value={(fn) => {
          registeredApply = fn as
            | ((nodes: unknown[], edges: unknown[]) => void)
            | null;
        }}
      >
        <Canvas projectId="proj_race" />
      </RegisterApplyDiagramContext.Provider>,
    );

    await vi.waitFor(() => expect(registeredApply).not.toBeNull());
    const applyDiagram = registeredApply as unknown as (
      nodes: unknown[],
      edges: unknown[],
    ) => void;
    applyDiagram(
      [{ id: "generated", type: "canvasNode" }],
      [{ id: "generated-edge", source: "generated", target: "generated" }],
    );

    resolveFetch?.({
      ok: true,
      json: async () => ({ nodes: savedNodes, edges: savedEdges }),
    } as Response);

    await vi.waitFor(() => expect(resolveFetch).toBeDefined());
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(mockOnNodesChange).toHaveBeenCalledTimes(1);
    expect(mockOnEdgesChange).toHaveBeenCalledTimes(1);
  });

  it("does not load when room already has nodes", async () => {
    nodeNodes = [{ id: "existing" }];
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ nodes: [{ id: "n1" }], edges: [] }),
    });

    render(<Canvas projectId="proj_skip" />);
    await new Promise((r) => setTimeout(r, 100));
    expect(mockOnNodesChange).not.toHaveBeenCalled();
  });

  it("calls onStatusChange with save status", () => {
    const onStatusChange = vi.fn();
    render(<Canvas projectId="proj_1" onStatusChange={onStatusChange} />);
    expect(onStatusChange).toHaveBeenCalledWith("idle");
  });

  it("calls updateMyPresence on mouse move", () => {
    render(<Canvas projectId="proj_1" />);
    const rf = screen.getByTestId("react-flow");
    fireEvent.mouseMove(rf, { clientX: 10, clientY: 20 });
  });

  it("calls updateMyPresence with null cursor on mouse leave", () => {
    render(<Canvas projectId="proj_1" />);
    const rf = screen.getByTestId("react-flow");
    fireEvent.mouseLeave(rf);
  });

  it("open templates modal and close", async () => {
    render(<Canvas projectId="proj_1" />);
    const templatesBtn = screen.getByTestId("templates-modal");
    expect(templatesBtn).toHaveAttribute("data-open", "false");
    fireEvent.click(screen.getByTestId("control-bar"));
  });

  it("renders handles inside the node wrapper", () => {
    render(<Canvas projectId="proj_1" />);
    expect(screen.getByTestId("react-flow")).toBeInTheDocument();
  });

  it("handles fetch error gracefully", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("network"));
    render(<Canvas projectId="proj_err" />);
    await vi.waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });
  });

  it("handles fetch returning 404", async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 404 });
    render(<Canvas projectId="proj_404" />);
    await vi.waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });
  });

  it("loads edges when saved data has edges but current room is empty", async () => {
    nodeNodes = [];
    nodeEdges = [];
    const savedNodes = [
      { id: "n1", type: "canvasNode", position: { x: 0, y: 0 }, data: {} },
    ];
    const savedEdges = [
      { id: "e1", source: "n1", target: "n1", type: "canvasEdge", data: {} },
    ];
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ nodes: savedNodes, edges: savedEdges }),
    });

    render(<Canvas projectId="proj_edges" />);
    await vi.waitFor(() => {
      expect(mockOnEdgesChange).toHaveBeenCalled();
    });
  });

  it("does not load edges when saved data has no edges", async () => {
    nodeNodes = [];
    nodeEdges = [];
    const savedNodes = [
      { id: "n1", type: "canvasNode", position: { x: 0, y: 0 }, data: {} },
    ];
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ nodes: savedNodes, edges: [] }),
    });

    render(<Canvas projectId="proj_noedge" />);
    await vi.waitFor(() => {
      expect(mockOnNodesChange).toHaveBeenCalled();
    });
    expect(mockOnEdgesChange).not.toHaveBeenCalled();
  });

  it("does not load when API returns empty nodes array", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ nodes: [], edges: [] }),
    });

    render(<Canvas projectId="proj_empty" />);
    await vi.waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });
    expect(mockOnNodesChange).not.toHaveBeenCalled();
  });
});
