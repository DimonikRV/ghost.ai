"use client";

import { useCallback, useRef, useState, forwardRef } from "react";
import {
  ReactFlow,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  useReactFlow,
  type Node,
  type OnConnect,
  type NodeProps,
  ConnectionMode,
} from "@xyflow/react";
import { useLiveblocksFlow, Cursors } from "@liveblocks/react-flow";
import { DRAG_DATA_TYPE } from "@/components/editor/shape-panel";
import type { ShapeType } from "@/types/canvas";
import "@xyflow/react/dist/style.css";
import "@liveblocks/react-ui/styles.css";
import "@liveblocks/react-flow/styles.css";

let shapeCounter = 0;

function generateNodeId(shape: ShapeType): string {
  const timestamp = Date.now();
  shapeCounter += 1;
  return `${shape}-${timestamp}-${shapeCounter}`;
}

const CanvasNode = forwardRef<HTMLDivElement, NodeProps>(function CanvasNode(
  { data },
  ref
) {
  const nodeData = data as { label: string; color: string; shape: ShapeType };
  return (
    <div
      ref={ref}
      style={{
        minWidth: 120,
        padding: "8px 16px",
        border: "2px solid",
        borderColor: nodeData.color || "var(--color-border)",
        borderRadius: 6,
        background: "var(--color-card)",
        color: "var(--color-foreground)",
        textAlign: "center",
        fontSize: 14,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        height: "100%",
      }}
    >
      {nodeData.label}
    </div>
  );
});

const nodeTypes = {
  canvasNode: CanvasNode,
};

export function Canvas() {
  const { screenToFlowPosition } = useReactFlow();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

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
        },
        style: {
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

  return (
    <div ref={reactFlowWrapper} className="h-full w-full" onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect as OnConnect}
        onDelete={onDelete}
        fitView
        connectionMode={ConnectionMode.Loose}
        nodeTypes={nodeTypes}
        proOptions={{ hideAttribution: true }}
      >
        <Cursors />
        <MiniMap />
        <Controls />
        <Background variant={BackgroundVariant.Dots} />
      </ReactFlow>
    </div>
  );
}
