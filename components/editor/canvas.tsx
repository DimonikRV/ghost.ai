"use client";

import { useCallback, useRef, useState, forwardRef, useEffect, createContext, useContext, useMemo } from "react";
import {
  ReactFlow,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  useReactFlow,
  type Node,
  type NodeProps,
  type EdgeProps,
  ConnectionMode,
  Handle,
  Position,
  NodeResizer,
  NodeToolbar,
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
} from "@xyflow/react";
import { useLiveblocksFlow, Cursors } from "@liveblocks/react-flow";
import { useCanUndo, useCanRedo, useUndo, useRedo, useUpdateMyPresence } from "@liveblocks/react";
import { DRAG_DATA_TYPE } from "@/components/editor/shape-panel";
import { CanvasControlBar } from "@/components/editor/canvas-control-bar";
import { StarterTemplatesModal } from "@/components/editor/starter-templates-modal";
import { HelpDialog } from "@/components/editor/help-dialog";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useCanvasAutosave, type SaveStatus } from "@/hooks/use-canvas-autosave";
import type { ShapeType } from "@/types/canvas";
import { NODE_COLOR_PALETTE } from "@/types/canvas";
import type { CanvasTemplate, DiagramNode, DiagramEdge } from "@/components/editor/starter-templates";
import "@xyflow/react/dist/style.css";
import "@liveblocks/react-ui/styles.css";
import "@liveblocks/react-flow/styles.css";

function generateNodeId(shape: ShapeType): string {
  return `${shape}-${crypto.randomUUID()}`;
}

// ---------------------------------------------------------------------------
// Shape rendering helpers
// ---------------------------------------------------------------------------

function shapeBorderColors(selected: boolean) {
  return selected
    ? "var(--color-foreground)"
    : "var(--color-border)";
}

function CssShape({
  shape,
  width,
  height,
  borderColor,
  backgroundColor,
}: {
  shape: ShapeType;
  width: number;
  height: number;
  borderColor: string;
  backgroundColor: string;
}) {
  const borderRadiusMap: Record<string, string> = {
    rectangle: "6px",
    pill: "9999px",
    circle: "50%",
  };

  return (
    <div
      style={{
        width,
        height,
        border: `2px solid ${borderColor}`,
        borderRadius: borderRadiusMap[shape],
        background: backgroundColor,
        transition: "border-color 0.15s, background 0.15s",
      }}
    />
  );
}

function SvgShape({
  shape,
  width,
  height,
  borderColor,
  backgroundColor,
}: {
  shape: ShapeType;
  width: number;
  height: number;
  borderColor: string;
  backgroundColor: string;
}) {
  const cx = width / 2;
  const cy = height / 2;

  if (shape === "diamond") {
    const pad = Math.min(width, height) * 0.08;
    const path = `M${cx},${pad} L${width - pad},${cy} L${cx},${height - pad} L${pad},${cy} Z`;
    return (
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{ overflow: "visible" }}
      >
        <path
          d={path}
          fill={backgroundColor}
          stroke={borderColor}
          strokeWidth={2}
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (shape === "hexagon") {
    const padX = width * 0.15;
    const path = [
      `M${padX},0`,
      `L${width - padX},0`,
      `L${width},${cy}`,
      `L${width - padX},${height}`,
      `L${padX},${height}`,
      `L0,${cy}`,
      "Z",
    ].join(" ");
    return (
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{ overflow: "visible" }}
      >
        <path
          d={path}
          fill={backgroundColor}
          stroke={borderColor}
          strokeWidth={2}
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  // cylinder: body rect + top/bottom ellipses
  const ry = Math.min(height * 0.12, 20);
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{ overflow: "visible" }}
    >
      <rect
        x={4}
        y={ry}
        width={width - 8}
        height={height - ry * 2}
        fill={backgroundColor}
        stroke={borderColor}
        strokeWidth={2}
      />
      <ellipse
        cx={cx}
        cy={ry}
        rx={cx - 4}
        ry={ry}
        fill={backgroundColor}
        stroke={borderColor}
        strokeWidth={2}
      />
      <ellipse
        cx={cx}
        cy={height - ry}
        rx={cx - 4}
        ry={ry}
        fill={backgroundColor}
        stroke={borderColor}
        strokeWidth={2}
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Handle styling — subtle white dots with dark border, hidden by default
// ---------------------------------------------------------------------------

function HandleStyle({
  isConnectable,
  isHovered,
  type,
  position,
  id,
}: {
  isConnectable: boolean;
  isHovered: boolean;
  type: "source" | "target";
  position: Position;
  id: string;
}) {
  return (
    <Handle
      type={type}
      position={position}
      id={id}
      isConnectable={isConnectable}
      style={{
        width: 8,
        height: 8,
        border: "2px solid var(--color-background)",
        background: "var(--color-card)",
        opacity: isHovered ? 1 : 0,
        transition: "opacity 0.15s ease",
      }}
    />
  );
}

// ---------------------------------------------------------------------------
// Custom edge — right-angle routing, dimmed at rest, brighten on hover,
// thick invisible hit area, inline label editing
// ---------------------------------------------------------------------------

function CanvasEdge(props: EdgeProps) {
  const { id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, style = {}, markerEnd } = props;
  const [hovered, setHovered] = useState(false);
  const [editing, setEditing] = useState(false);
  const edgeDataLabel = (props.data as { label?: string } | undefined)?.label ?? "";
  const [label, setLabel] = useState(edgeDataLabel);
  const [prevEdgeLabel, setPrevEdgeLabel] = useState(edgeDataLabel);
  const { updateEdge } = useReactFlow();

  // Sync label when edge data changes externally (e.g. collaborative update)
  if (prevEdgeLabel !== edgeDataLabel) {
    setPrevEdgeLabel(edgeDataLabel);
    setLabel(edgeDataLabel);
  }

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 16,
  });

  const baseStroke = "var(--color-foreground)";
  const hoverStroke = "var(--color-foreground)";
  const strokeColor = hovered ? hoverStroke : baseStroke;
  const opacity = hovered ? 1 : 0.8;

  const hitPathStyle = useMemo(
    () => ({
      stroke: "transparent",
      strokeWidth: 20,
      fill: "none",
    }),
    []
  );

  const visiblePathStyle = useMemo(
    () => ({
      ...style,
      stroke: strokeColor,
      strokeWidth: 2,
      strokeLinecap: "round" as const,
      strokeLinejoin: "round" as const,
      opacity,
      transition: "stroke 0.15s, opacity 0.15s",
    }),
    [style, strokeColor, opacity]
  );

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setEditing(true);
    },
    []
  );

  const handleLabelChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newLabel = e.target.value;
      setLabel(newLabel);
      updateEdge(id, (edge) => ({
        data: { ...edge.data, label: newLabel },
      }));
    },
    [id, updateEdge]
  );

  const handleLabelBlur = useCallback(() => {
    setEditing(false);
  }, []);

  const handleLabelKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        setEditing(false);
      }
    },
    []
  );

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={visiblePathStyle}
      />
      {/* Invisible thick hit area for easier hover/click */}
      <path
        d={edgePath}
        fill="none"
        style={hitPathStyle}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onDoubleClick={handleDoubleClick}
      />
      {/* Inline label via EdgeLabelRenderer */}
      <EdgeLabelRenderer>
        <div
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: "all",
          }}
          className="nodrag nopan"
        >
          {editing ? (
            <input
              autoFocus
              value={label}
              onChange={handleLabelChange}
              onBlur={handleLabelBlur}
              onKeyDown={handleLabelKeyDown}
              placeholder="Type a label..."
              className="text-xs text-foreground bg-card border border-border rounded-sm px-1.5 py-0.5 outline-none"
              style={{ minWidth: 60, fontFamily: "inherit" }}
            />
          ) : (
            <div
              onDoubleClick={handleDoubleClick}
              className="text-xs text-foreground px-1.5 py-0.5 rounded-sm cursor-pointer hover:bg-card/60 whitespace-nowrap"
              style={{ maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis" }}
            >
              {label || " "}
            </div>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

// ---------------------------------------------------------------------------
// Custom node
// ---------------------------------------------------------------------------

const CSS_SHAPES: ShapeType[] = ["rectangle", "pill", "circle"];

// Minimum dimensions for resizing
const MIN_WIDTH = 60;
const MIN_HEIGHT = 40;

const CanvasNode = forwardRef<HTMLDivElement, NodeProps>(function CanvasNode(
  props,
  ref
) {
  const { id, data, selected, isConnectable } = props;
  const { updateNode } = useReactFlow();
  const { setIsEditingLabel } = useContext(LabelEditingContext);
  const [isHovered, setIsHovered] = useState(false);
  const nodeData = data as {
    label: string;
    color: string;
    shape: ShapeType;
    width?: number;
    height?: number;
  };
  const shape = nodeData.shape ?? "rectangle";
  const borderColor = shapeBorderColors(!!selected);

  // Resolved node color — falls back to default card color if not set
  const nodeColor = nodeData.color ?? "var(--color-card)";

  // Default dimensions per shape (matches shape-panel defaults)
  const defaultSize: Record<ShapeType, [number, number]> = {
    rectangle: [180, 100],
    diamond: [160, 140],
    circle: [120, 120],
    pill: [160, 80],
    cylinder: [120, 140],
    hexagon: [140, 120],
  };

  const width = nodeData.width ?? defaultSize[shape][0];
  const height = nodeData.height ?? defaultSize[shape][1];

  // Inline label editing state
  const [isEditing, setIsEditing] = useState(false);
  const nodeLabel = nodeData.label ?? "";
  const [editValue, setEditValue] = useState(nodeLabel);
  const [prevNodeLabel, setPrevNodeLabel] = useState(nodeLabel);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isEditing]);

  // Sync edit value when node label changes externally
  if (prevNodeLabel !== nodeLabel) {
    setPrevNodeLabel(nodeLabel);
    setEditValue(nodeLabel);
  }

  // Report editing state to Canvas for pan-on-drag control
  useEffect(() => {
    setIsEditingLabel(isEditing);
    return () => {
      if (isEditing) setIsEditingLabel(false);
    };
  }, [isEditing, setIsEditingLabel]);

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setIsEditing(true);
      setEditValue(nodeData.label ?? "");
    },
    [nodeData.label]
  );

  const commitLabel = useCallback(() => {
    setIsEditing(false);
    updateNode(id, (node) => ({
      data: { ...node.data, label: editValue },
    }));
  }, [id, editValue, updateNode]);

  const handleBlur = useCallback(() => {
    commitLabel();
  }, [commitLabel]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        setEditValue(nodeData.label ?? "");
        setIsEditing(false);
      }
    },
    [nodeData.label]
  );

  const handleTextareaChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setEditValue(e.target.value);
      // Update node data as user types for live collaborative sync
      updateNode(id, (node) => ({
        data: { ...node.data, label: e.target.value },
      }));
    },
    [id, updateNode]
  );

  const handleColorChange = useCallback(
    (colorValue: string) => {
      updateNode(id, (node) => ({
        data: { ...node.data, color: colorValue },
      }));
    },
    [id, updateNode]
  );

  const activePaletteId = NODE_COLOR_PALETTE.find(
    (p) => p.value === nodeData.color
  )?.id;

  return (
    <div
      ref={ref}
      style={{ display: "flex", alignItems: "center", justifyContent: "center", width, height }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Connection handles — subtle white dots with dark border, hidden by default, fade in on hover */}
      <HandleStyle isConnectable={isConnectable} isHovered={isHovered} type="target" position={Position.Top} id="t-top" />
      <HandleStyle isConnectable={isConnectable} isHovered={isHovered} type="source" position={Position.Top} id="s-top" />
      <HandleStyle isConnectable={isConnectable} isHovered={isHovered} type="target" position={Position.Left} id="t-left" />
      <HandleStyle isConnectable={isConnectable} isHovered={isHovered} type="source" position={Position.Left} id="s-left" />
      <HandleStyle isConnectable={isConnectable} isHovered={isHovered} type="target" position={Position.Right} id="t-right" />
      <HandleStyle isConnectable={isConnectable} isHovered={isHovered} type="source" position={Position.Right} id="s-right" />
      <HandleStyle isConnectable={isConnectable} isHovered={isHovered} type="target" position={Position.Bottom} id="t-bottom" />
      <HandleStyle isConnectable={isConnectable} isHovered={isHovered} type="source" position={Position.Bottom} id="s-bottom" />

      {/* Resize handles — only visible when selected */}
      <NodeResizer
        nodeId={id}
        isVisible={selected && !isEditing}
        minWidth={MIN_WIDTH}
        minHeight={MIN_HEIGHT}
        lineClassName="border-border"
        handleClassName="h-3 w-3 bg-foreground rounded-sm border-2 border-background"
        onResize={(_, params) => {
          updateNode(id, (node) => ({
            data: {
              ...node.data,
              width: Math.max(params.width, MIN_WIDTH),
              height: Math.max(params.height, MIN_HEIGHT),
            },
          }));
        }}
      />

      {/* Color toolbar — only when selected and not editing */}
      <NodeToolbar
        isVisible={selected && !isEditing}
        position={Position.Top}
        offset={8}
        style={{
          pointerEvents: "auto",
        }}
      >
        <div
          onPointerDown={(e) => e.stopPropagation()}
          className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-2 py-1.5 shadow-sm"
        >
          {NODE_COLOR_PALETTE.map((swatch) => {
            const isActive = activePaletteId === swatch.id;
            return (
              <button
                key={swatch.id}
                type="button"
                title={swatch.id}
                onClick={() => handleColorChange(swatch.value)}
                className="relative h-5 w-5 rounded-sm border transition-all duration-150"
                style={{
                  background: swatch.value,
                  borderColor: isActive ? "var(--color-foreground)" : "var(--color-border)",
                  boxShadow: isActive
                    ? "0 0 0 1.5px var(--color-foreground)"
                    : "none",
                }}
              />
            );
          })}
        </div>
      </NodeToolbar>

      {/* Node shape */}
      <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {CSS_SHAPES.includes(shape) ? (
          <CssShape shape={shape} width={width} height={height} borderColor={borderColor} backgroundColor={nodeColor} />
        ) : (
          <SvgShape shape={shape} width={width} height={height} borderColor={borderColor} backgroundColor={nodeColor} />
        )}

        {/* Label / editing overlay — centered over the shape */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "8px",
            cursor: isEditing ? "text" : "default",
          }}
          onDoubleClick={handleDoubleClick}
        >
          {isEditing ? (
            <textarea
              ref={textareaRef}
              value={editValue}
              onChange={handleTextareaChange}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
              placeholder="Type a label..."
              className="absolute inset-0 w-full h-full resize-none bg-transparent text-foreground text-sm text-center outline-none border-none p-2"
              style={{
                fontFamily: "inherit",
                lineHeight: "1.4",
                overflow: "hidden",
              }}
            />
          ) : (
            <span
              className="text-sm text-center pointer-events-none max-w-full overflow-hidden text-ellipsis whitespace-nowrap"
              style={{
                lineHeight: "1.4",
                color: "var(--color-foreground)",
              }}
            >
              {nodeData.label || "Double-click to edit"}
            </span>
          )}
        </div>
      </div>
    </div>
  );
});

const nodeTypes = {
  canvasNode: CanvasNode,
};

const edgeTypes = {
  canvasEdge: CanvasEdge,
};

// Context to communicate label editing state from nodes to the Canvas
const LabelEditingContext = createContext<{
  isEditingLabel: boolean;
  setIsEditingLabel: (value: boolean) => void;
}>({
  isEditingLabel: false,
  setIsEditingLabel: () => {},
});

export function Canvas({
  projectId,
  onStatusChange,
  onExport,
  registerWrapperRef,
}: {
  projectId: string;
  onStatusChange?: (status: SaveStatus) => void;
  onExport?: () => void;
  registerWrapperRef?: (node: HTMLDivElement | null) => void;
}) {
  const { screenToFlowPosition, zoomIn, zoomOut, fitView } = useReactFlow();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [, setIsDragOver] = useState(false);
  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  const updateMyPresence = useUpdateMyPresence();

  const handleMouseMove = useCallback(
    (event: React.MouseEvent) => {
      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      updateMyPresence({ cursor: position });
    },
    [screenToFlowPosition, updateMyPresence]
  );

  const handleMouseLeave = useCallback(() => {
    updateMyPresence({ cursor: null });
  }, [updateMyPresence]);

  // Liveblocks history
  const canUndo = useCanUndo();
  const canRedo = useCanRedo();
  const undo = useUndo();
  const redo = useRedo();

  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, onDelete } =
    useLiveblocksFlow({
      suspense: true,
      nodes: {
        initial: [],
      },
      edges: {
        initial: [],
      },
    });

  // Gate autosave until initial hydration completes
  const [autosaveEnabled, setAutosaveEnabled] = useState(false);

  // Autosave — debounces writes to Vercel Blob via API
  const saveStatus = useCanvasAutosave(
    projectId,
    nodes as unknown[],
    edges as unknown[],
    autosaveEnabled
  );

  // Report save status to parent
  useEffect(() => {
    onStatusChange?.(saveStatus);
  }, [saveStatus, onStatusChange]);

  // Load saved canvas state on init — only if room is empty
  const hasLoadedRef = useRef(false);
  useEffect(() => {
    if (hasLoadedRef.current) return;

    const loadSaved = async () => {
      try {
        // If Liveblocks already has data, nothing to load — just gate autosave on.
        const hasNodes = (nodes as unknown[]).length > 0;
        const hasEdges = (edges as unknown[]).length > 0;
        if (hasNodes || hasEdges) {
          hasLoadedRef.current = true;
          return;
        }

        const res = await fetch(`/api/projects/${projectId}/canvas`);
        if (!res.ok) return;
        const data = await res.json();
        if (
          Array.isArray(data.nodes) &&
          data.nodes.length > 0 &&
          !hasLoadedRef.current
        ) {
          hasLoadedRef.current = true;
          // Re-check that room is still empty before loading
          const currentNodes = nodes as unknown[];
          if (currentNodes.length === 0) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (onNodesChange as (changes: any[]) => void)(
              data.nodes.map((item: unknown) => ({ type: "add" as const, item }))
            );
            if (Array.isArray(data.edges) && data.edges.length > 0) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (onEdgesChange as (changes: any[]) => void)(
                data.edges.map((item: unknown) => ({ type: "add" as const, item }))
              );
            }
          }
        }
      } catch {
        // Silently fail — room will remain empty
      } finally {
        setAutosaveEnabled(true);
      }
    };

    void loadSaved();
  }, [projectId, nodes, edges, onNodesChange, onEdgesChange]);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onZoomIn: zoomIn,
    onZoomOut: zoomOut,
    onFitView: () => fitView({ duration: 300 }),
    onUndo: undo,
    onRedo: redo,
  });

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);

      const payload = e.dataTransfer.getData(DRAG_DATA_TYPE);
      if (!payload) return;

      let shapeData: { type: ShapeType; width: number; height: number };
      try {
        shapeData = JSON.parse(payload);
      } catch {
        return;
      }

      if (!reactFlowWrapper.current) return;

      const position = screenToFlowPosition({
        x: e.clientX,
        y: e.clientY,
      });

      const id = generateNodeId(shapeData.type);

      const newNode: Node = {
        id,
        type: "canvasNode",
        position,
        data: {
          label: "",
          color: "var(--color-border)",
          shape: shapeData.type,
          width: shapeData.width,
          height: shapeData.height,
        },
      };

      const addChange = {
        type: "add" as const,
        item: newNode,
      };

      // onNodesChange from useLiveblocksFlow may not type the 'add' action correctly
      // but it works at runtime via Liveblocks Storage
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (onNodesChange as (changes: any[]) => void)([addChange]);
    },
    [screenToFlowPosition, onNodesChange]
  );

  // Import a starter template — replaces the current canvas with template nodes/edges at (0,0)
  // Uses onNodesChange/onEdgesChange with add/remove actions so Liveblocks Storage syncs properly
  const handleImportTemplate = useCallback(
    (template: CanvasTemplate) => {
      const templateNodes: Node[] = template.nodes.map((tn: DiagramNode) => ({
        id: tn.id,
        type: tn.type,
        position: tn.position,
        data: tn.data,
      }));

      const templateEdges = template.edges.map((te: DiagramEdge) => ({
        id: te.id,
        source: te.source,
        target: te.target,
        type: te.type,
        data: te.data,
      }));

      // Build remove actions for existing nodes and edges
      const removeNodeChanges = (nodes as Node[]).map((n) => ({ type: "remove" as const, id: n.id }));
      const removeEdgeChanges = (edges as unknown as { id: string }[]).map((e) => ({ type: "remove" as const, id: e.id }));

      // Build add actions for template nodes and edges
      const addNodeChanges = templateNodes.map((n) => ({ type: "add" as const, item: n }));
      const addEdgeChanges = templateEdges.map((e) => ({ type: "add" as const, item: e }));

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (onNodesChange as (changes: any[]) => void)([...removeNodeChanges, ...addNodeChanges]);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (onEdgesChange as (changes: any[]) => void)([...removeEdgeChanges, ...addEdgeChanges]);
    },
    [nodes, edges, onNodesChange, onEdgesChange]
  );

  return (
      <div
        ref={(node) => {
          reactFlowWrapper.current = node;
          registerWrapperRef?.(node);
        }}
        className="relative h-full w-full"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
      <LabelEditingContext.Provider value={{ isEditingLabel, setIsEditingLabel }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onDelete={onDelete}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          fitView
          connectionMode={ConnectionMode.Loose}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          defaultEdgeOptions={{
            type: "canvasEdge",
            markerEnd: {
              type: "arrowclosed",
              width: 16,
              height: 16,
              color: "var(--color-foreground)",
            },
          }}
          connectionLineStyle={{ stroke: "var(--color-foreground)", strokeWidth: 2, opacity: 0.6 }}
          panOnDrag={!isEditingLabel}
          proOptions={{ hideAttribution: true }}
        >
          <Cursors />
          <MiniMap />
          <Controls />
          <Background variant={BackgroundVariant.Dots} />
        </ReactFlow>
      </LabelEditingContext.Provider>
      <CanvasControlBar
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onFitView={() => fitView({ duration: 300 })}
        onUndo={undo}
        onRedo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
        onTemplates={() => setTemplatesOpen(true)}
        onExport={() => onExport?.()}
        onHelp={() => setHelpOpen(true)}
      />
      <StarterTemplatesModal
        open={templatesOpen}
        onOpenChange={setTemplatesOpen}
        onImport={handleImportTemplate}
      />
      <HelpDialog open={helpOpen} onOpenChange={setHelpOpen} />
    </div>
  );
}
