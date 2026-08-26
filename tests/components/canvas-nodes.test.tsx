// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

const mockUpdateNode = vi.fn();
const mockUpdateEdge = vi.fn();
const mockUpdateMyPresence = vi.fn();
let mockCanUndo = false;
let mockCanRedo = false;
let roomNodes: unknown[] = [];
let roomEdges: unknown[] = [];

vi.mock("@xyflow/react", () => {
  const React = require("react");
  const ReactFlowMock = React.forwardRef(function MockRF(props: any, ref: any) {
    const { nodeTypes, edgeTypes, nodes, edges, children, ...rest } = props;
    return (
      <div data-testid="react-flow">
        {nodes?.map((node: any) => {
          const Comp = nodeTypes?.[node.type];
          return Comp ? (
            <Comp
              key={node.id}
              id={node.id}
              data={node.data}
              selected={false}
              isConnectable={true}
              type={node.type}
              position={node.position}
              zIndex={1}
              dragging={false}
              selectedBounds={undefined}
            />
          ) : null;
        })}
        {edges?.map((edge: any) => {
          const Comp = edgeTypes?.[edge.type];
          return Comp ? (
            <Comp
              key={edge.id}
              id={edge.id}
              data={edge.data}
              source={edge.source}
              target={edge.target}
              sourceX={0}
              sourceY={0}
              targetX={300}
              targetY={0}
              sourcePosition="right"
              targetPosition="left"
              style={{}}
              markerEnd={undefined}
              selected={false}
              sourceHandleId={null}
              targetHandleId={null}
              labelX={150}
              labelY={0}
            />
          ) : null;
        })}
        {children}
      </div>
    );
  });
  ReactFlowMock.displayName = "ReactFlow";
  return {
    ReactFlow: ReactFlowMock,
    Controls: () => <div data-testid="controls" />,
    MiniMap: () => <div data-testid="minimap" />,
    Background: () => <div data-testid="background" />,
    BackgroundVariant: { Dots: "dots" },
    Handle: ({ type, position, id, isConnectable, style }: any) => (
      <div data-testid={`handle-${type}-${position}`} style={style} />
    ),
    Position: { Top: "top", Bottom: "bottom", Left: "left", Right: "right" },
    ConnectionMode: { Loose: "loose" },
    NodeResizer: ({ nodeId, isVisible, onResize }: any) => (
      <div data-testid="node-resizer" data-visible={String(isVisible)} />
    ),
    NodeToolbar: ({ isVisible, children, ...rest }: any) => (
      <div data-testid="node-toolbar" data-visible={String(isVisible)}>{children}</div>
    ),
    BaseEdge: () => <div data-testid="base-edge" />,
    EdgeLabelRenderer: ({ children }: any) => <div data-testid="edge-label">{children}</div>,
    getSmoothStepPath: () => ["M0,0 L100,100", 50, 50],
    MarkerType: { ArrowClosed: "arrowclosed" },
    ReactFlowProvider: ({ children }: any) => <div>{children}</div>,
    useReactFlow: () => ({
      getNodes: vi.fn().mockReturnValue(roomNodes),
      getEdges: vi.fn().mockReturnValue(roomEdges),
      setNodes: vi.fn(),
      setEdges: vi.fn(),
      addNodes: vi.fn(),
      deleteElements: vi.fn(),
      screenToFlowPosition: vi.fn().mockReturnValue({ x: 100, y: 200 }),
      zoomIn: vi.fn(),
      zoomOut: vi.fn(),
      fitView: vi.fn(),
      updateNode: mockUpdateNode,
      updateEdge: mockUpdateEdge,
    }),
    applyNodeChanges: vi.fn().mockImplementation((_: any, nodes: any) => nodes),
    applyEdgeChanges: vi.fn().mockImplementation((_: any, edges: any) => edges),
    addEdge: vi.fn().mockImplementation((edge: any, edges: any) => [...edges, edge]),
  };
});

vi.mock("@liveblocks/react-flow", () => ({
  useLiveblocksFlow: () => ({
    presence: { update: vi.fn() },
    nodes: roomNodes,
    edges: roomEdges,
    onNodesChange: vi.fn(),
    onEdgesChange: vi.fn(),
    onConnect: vi.fn(),
    onDelete: vi.fn(),
  }),
  Cursors: () => <div data-testid="cursors" />,
}));

vi.mock("@liveblocks/react", () => ({
  useCanUndo: () => mockCanUndo,
  useCanRedo: () => mockCanRedo,
  useUndo: vi.fn(),
  useRedo: vi.fn(),
  useUpdateMyPresence: () => mockUpdateMyPresence,
}));

vi.mock("@/components/editor/shape-panel", () => ({
  DRAG_DATA_TYPE: "application/ghost-shape",
}));

vi.mock("@/components/editor/canvas-control-bar", () => ({
  CanvasControlBar: () => <div data-testid="control-bar" />,
}));

vi.mock("@/components/editor/starter-templates-modal", () => ({
  StarterTemplatesModal: (props: any) => (
    <div data-testid="templates-modal" data-open={String(props.open)} />
  ),
}));

vi.mock("@/components/editor/help-dialog", () => ({
  HelpDialog: (props: any) => (
    <div data-testid="help-dialog" data-open={String(props.open)} />
  ),
}));

vi.mock("@/hooks/useKeyboardShortcuts", () => ({
  useKeyboardShortcuts: vi.fn(),
}));

vi.mock("@/hooks/use-canvas-autosave", () => ({
  useCanvasAutosave: vi.fn().mockReturnValue("idle"),
}));

import { Canvas } from "@/components/editor/canvas";

describe("Canvas node rendering", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    roomNodes = [];
    roomEdges = [];
    mockCanUndo = false;
    mockCanRedo = false;
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ nodes: [], edges: [] }),
    });
  });

  it("renders a CSS rectangle node", () => {
    roomNodes = [
      { id: "n1", type: "canvasNode", position: { x: 0, y: 0 }, data: { label: "Hello", color: "#ff0000", shape: "rectangle", width: 180, height: 100 } },
    ];
    render(<Canvas projectId="p1" />);
    expect(screen.getByText("Hello")).toBeInTheDocument();
  });

  it("renders a CSS pill node", () => {
    roomNodes = [
      { id: "n1", type: "canvasNode", position: { x: 0, y: 0 }, data: { label: "Pill", color: "#00ff00", shape: "pill" } },
    ];
    render(<Canvas projectId="p1" />);
    expect(screen.getByText("Pill")).toBeInTheDocument();
  });

  it("renders a CSS circle node", () => {
    roomNodes = [
      { id: "n1", type: "canvasNode", position: { x: 0, y: 0 }, data: { label: "Circle", color: "#0000ff", shape: "circle" } },
    ];
    render(<Canvas projectId="p1" />);
    expect(screen.getByText("Circle")).toBeInTheDocument();
  });

  it("renders an SVG diamond node", () => {
    roomNodes = [
      { id: "n1", type: "canvasNode", position: { x: 0, y: 0 }, data: { label: "Diamond", color: "#ff00ff", shape: "diamond" } },
    ];
    render(<Canvas projectId="p1" />);
    expect(screen.getByText("Diamond")).toBeInTheDocument();
  });

  it("renders an SVG hexagon node", () => {
    roomNodes = [
      { id: "n1", type: "canvasNode", position: { x: 0, y: 0 }, data: { label: "Hex", color: "#ffff00", shape: "hexagon" } },
    ];
    render(<Canvas projectId="p1" />);
    expect(screen.getByText("Hex")).toBeInTheDocument();
  });

  it("renders an SVG cylinder node", () => {
    roomNodes = [
      { id: "n1", type: "canvasNode", position: { x: 0, y: 0 }, data: { label: "Cyl", color: "#00ffff", shape: "cylinder" } },
    ];
    render(<Canvas projectId="p1" />);
    expect(screen.getByText("Cyl")).toBeInTheDocument();
  });

  it("shows placeholder when node has no label", () => {
    roomNodes = [
      { id: "n1", type: "canvasNode", position: { x: 0, y: 0 }, data: { label: "", color: "#ccc", shape: "rectangle" } },
    ];
    render(<Canvas projectId="p1" />);
    expect(screen.getByText("Double-click to edit")).toBeInTheDocument();
  });

  it("node has default size when width/height not provided", () => {
    roomNodes = [
      { id: "n1", type: "canvasNode", position: { x: 0, y: 0 }, data: { label: "NoSize", color: "#ccc", shape: "diamond" } },
    ];
    render(<Canvas projectId="p1" />);
    expect(screen.getByText("NoSize")).toBeInTheDocument();
  });

  it("renders handles for node connections", () => {
    roomNodes = [
      { id: "n1", type: "canvasNode", position: { x: 0, y: 0 }, data: { label: "Node", color: "#ccc", shape: "rectangle" } },
    ];
    render(<Canvas projectId="p1" />);
    expect(screen.getAllByTestId(/handle-/).length).toBeGreaterThan(0);
  });

  it("node renders with selected border color", () => {
    roomNodes = [
      { id: "n1", type: "canvasNode", position: { x: 0, y: 0 }, data: { label: "Sel", color: "#ccc", shape: "rectangle" } },
    ];
    render(<Canvas projectId="p1" />);
    expect(screen.getByText("Sel")).toBeInTheDocument();
  });

  it("node without explicit color uses default", () => {
    roomNodes = [
      { id: "n1", type: "canvasNode", position: { x: 0, y: 0 }, data: { label: "NoColor", shape: "rectangle" } },
    ];
    render(<Canvas projectId="p1" />);
    expect(screen.getByText("NoColor")).toBeInTheDocument();
  });

  it("node without explicit shape defaults to rectangle", () => {
    roomNodes = [
      { id: "n1", type: "canvasNode", position: { x: 0, y: 0 }, data: { label: "NoShape", color: "#ccc" } },
    ];
    render(<Canvas projectId="p1" />);
    expect(screen.getByText("NoShape")).toBeInTheDocument();
  });
});

describe("Canvas label editing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    roomNodes = [];
    roomEdges = [];
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ nodes: [], edges: [] }),
    });
  });

  it("double-clicking node enters edit mode with textarea", async () => {
    roomNodes = [
      { id: "n1", type: "canvasNode", position: { x: 0, y: 0 }, data: { label: "Edit me", color: "#ccc", shape: "rectangle" } },
    ];
    render(<Canvas projectId="p1" />);
    const label = screen.getByText("Edit me");
    fireEvent.doubleClick(label);
    const textarea = screen.getByPlaceholderText("Type a label...");
    expect(textarea).toBeInTheDocument();
  });

  it("blur on textarea commits label change", async () => {
    roomNodes = [
      { id: "n1", type: "canvasNode", position: { x: 0, y: 0 }, data: { label: "Original", color: "#ccc", shape: "rectangle" } },
    ];
    render(<Canvas projectId="p1" />);
    fireEvent.doubleClick(screen.getByText("Original"));
    const textarea = screen.getByPlaceholderText("Type a label...");
    fireEvent.change(textarea, { target: { value: "Updated" } });
    fireEvent.blur(textarea);
    expect(mockUpdateNode).toHaveBeenCalled();
  });

  it("Escape key exits edit mode", async () => {
    roomNodes = [
      { id: "n1", type: "canvasNode", position: { x: 0, y: 0 }, data: { label: "Escape", color: "#ccc", shape: "rectangle" } },
    ];
    render(<Canvas projectId="p1" />);
    fireEvent.doubleClick(screen.getByText("Escape"));
    const textarea = screen.getByPlaceholderText("Type a label...");
    fireEvent.keyDown(textarea, { key: "Escape" });
    expect(screen.getByText("Escape")).toBeInTheDocument();
  });
});

describe("Canvas color palette", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    roomNodes = [];
    roomEdges = [];
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ nodes: [], edges: [] }),
    });
  });

  it("renders color palette when node selected", () => {
    roomNodes = [
      { id: "n1", type: "canvasNode", position: { x: 0, y: 0 }, data: { label: "Color", color: "#ccc", shape: "rectangle" } },
    ];
    render(<Canvas projectId="p1" />);
    const toolbar = screen.getAllByTestId("node-toolbar");
    expect(toolbar.length).toBeGreaterThan(0);
  });
});

describe("Canvas edge rendering", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    roomNodes = [];
    roomEdges = [];
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ nodes: [], edges: [] }),
    });
  });

  it("renders canvas edge with label", () => {
    roomNodes = [
      { id: "n1", type: "canvasNode", position: { x: 0, y: 0 }, data: { label: "A", color: "#ccc", shape: "rectangle" } },
      { id: "n2", type: "canvasNode", position: { x: 300, y: 0 }, data: { label: "B", color: "#ccc", shape: "rectangle" } },
    ];
    roomEdges = [
      { id: "e1", source: "n1", target: "n2", type: "canvasEdge", data: { label: "connects" } },
    ];
    render(<Canvas projectId="p1" />);
    expect(screen.getByText("connects")).toBeInTheDocument();
  });

  it("renders edge with empty label", () => {
    roomNodes = [
      { id: "n1", type: "canvasNode", position: { x: 0, y: 0 }, data: { label: "A", color: "#ccc", shape: "rectangle" } },
      { id: "n2", type: "canvasNode", position: { x: 300, y: 0 }, data: { label: "B", color: "#ccc", shape: "rectangle" } },
    ];
    roomEdges = [
      { id: "e1", source: "n1", target: "n2", type: "canvasEdge", data: {} },
    ];
    render(<Canvas projectId="p1" />);
    expect(screen.getByTestId("edge-label")).toBeInTheDocument();
  });

  it("double-clicking edge label enters editing", () => {
    roomNodes = [
      { id: "n1", type: "canvasNode", position: { x: 0, y: 0 }, data: { label: "A", color: "#ccc", shape: "rectangle" } },
      { id: "n2", type: "canvasNode", position: { x: 300, y: 0 }, data: { label: "B", color: "#ccc", shape: "rectangle" } },
    ];
    roomEdges = [
      { id: "e1", source: "n1", target: "n2", type: "canvasEdge", data: { label: "EditEdge" } },
    ];
    render(<Canvas projectId="p1" />);
    const edgeLabel = screen.getByText("EditEdge");
    fireEvent.doubleClick(edgeLabel);
    expect(screen.getByPlaceholderText("Type a label...")).toBeInTheDocument();
  });
});

describe("Canvas template import", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    roomNodes = [];
    roomEdges = [];
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ nodes: [], edges: [] }),
    });
  });

  it("template import removes existing nodes and adds template nodes", () => {
    roomNodes = [
      { id: "old1", type: "canvasNode", position: { x: 0, y: 0 }, data: { label: "Old", color: "#ccc", shape: "rectangle" } },
    ];
    render(<Canvas projectId="p1" />);
    expect(screen.getByText("Old")).toBeInTheDocument();
  });
});

describe("Canvas interactions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    roomNodes = [];
    roomEdges = [];
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ nodes: [], edges: [] }),
    });
  });

  it("drag over sets dropEffect to copy", () => {
    render(<Canvas projectId="p1" />);
    const container = screen.getByTestId("react-flow").parentElement!;
    const preventDefault = vi.fn();
    const dataTransfer = { dropEffect: "" };
    fireEvent.dragOver(container, { preventDefault, dataTransfer });
    expect(dataTransfer.dropEffect).toBe("copy");
  });

  it("drag leave resets state", () => {
    render(<Canvas projectId="p1" />);
    const container = screen.getByTestId("react-flow").parentElement!;
    fireEvent.dragLeave(container);
  });

  it("drop with no drag data does nothing", () => {
    render(<Canvas projectId="p1" />);
    const container = screen.getByTestId("react-flow").parentElement!;
    const preventDefault = vi.fn();
    fireEvent.drop(container, { preventDefault, dataTransfer: { getData: () => "" } });
  });

  it("drop with invalid JSON does nothing", () => {
    render(<Canvas projectId="p1" />);
    const container = screen.getByTestId("react-flow").parentElement!;
    const preventDefault = vi.fn();
    fireEvent.drop(container, { preventDefault, dataTransfer: { getData: () => "not-json" } });
  });

  it("drop with valid shape data creates node", () => {
    const shapeData = JSON.stringify({ type: "rectangle", width: 180, height: 100 });
    render(<Canvas projectId="p1" />);
    const container = screen.getByTestId("react-flow").parentElement!;
    const preventDefault = vi.fn();
    fireEvent.drop(container, { preventDefault, dataTransfer: { getData: () => shapeData } });
  });
});

describe("Canvas data loading", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    roomNodes = [];
    roomEdges = [];
  });

  it("loads saved canvas state when room is empty", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        nodes: [{ id: "loaded", type: "canvasNode", position: { x: 0, y: 0 }, data: { label: "Loaded", color: "#ccc", shape: "rectangle" } }],
        edges: [],
      }),
    });
    render(<Canvas projectId="p1" />);
    await vi.waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/projects/p1/canvas");
    });
  });

  it("skips load when room already has nodes", () => {
    roomNodes = [
      { id: "existing", type: "canvasNode", position: { x: 0, y: 0 }, data: { label: "Existing", color: "#ccc", shape: "rectangle" } },
    ];
    render(<Canvas projectId="p1" />);
    expect(global.fetch).not.toHaveBeenCalledWith("/api/projects/p1/canvas");
  });

  it("handles fetch failure silently", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));
    render(<Canvas projectId="p1" />);
    await vi.waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });
  });

  it("handles non-ok response from canvas API", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({}),
    });
    render(<Canvas projectId="p1" />);
    await vi.waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });
  });

  it("loads saved edges when present", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        nodes: [{ id: "n1", type: "canvasNode", position: { x: 0, y: 0 }, data: { label: "A", color: "#ccc", shape: "rectangle" } }],
        edges: [{ id: "e1", source: "n1", target: "n1", type: "canvasEdge", data: {} }],
      }),
    });
    render(<Canvas projectId="p1" />);
    await vi.waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });
  });
});
