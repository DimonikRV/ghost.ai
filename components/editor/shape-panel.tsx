"use client";

import { useState, useCallback, useEffect } from "react";
import {
  Square,
  Diamond,
  Circle,
  Pill,
  Cylinder,
  Hexagon,
} from "lucide-react";
import type { ShapeType } from "@/types/canvas";

interface ShapeConfig {
  type: ShapeType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  width: number;
  height: number;
}

const SHAPES: ShapeConfig[] = [
  { type: "rectangle", label: "Rectangle", icon: Square, width: 180, height: 100 },
  { type: "diamond", label: "Diamond", icon: Diamond, width: 160, height: 140 },
  { type: "circle", label: "Circle", icon: Circle, width: 120, height: 120 },
  { type: "pill", label: "Pill", icon: Pill, width: 160, height: 80 },
  { type: "cylinder", label: "Cylinder", icon: Cylinder, width: 120, height: 140 },
  { type: "hexagon", label: "Hexagon", icon: Hexagon, width: 140, height: 120 },
];

const DRAG_DATA_TYPE = "application/ghost-shape";

// ---------------------------------------------------------------------------
// Ghost preview renderer (reuses same shape logic as the canvas node)
// ---------------------------------------------------------------------------

function GhostPreview({
  shape,
  x,
  y,
}: {
  shape: ShapeConfig;
  x: number;
  y: number;
}) {
  const w = shape.width;
  const h = shape.height;
  const scale = 0.6; // smaller preview
  const scaledW = Math.round(w * scale);
  const scaledH = Math.round(h * scale);

  const cssShapes: ShapeType[] = ["rectangle", "pill", "circle"];
  const borderRadiusMap: Record<string, string> = {
    rectangle: "4px",
    pill: "9999px",
    circle: "50%",
  };

  const style: React.CSSProperties = {
    position: "fixed",
    left: x - scaledW / 2,
    top: y - scaledH / 2,
    width: scaledW,
    height: scaledH,
    pointerEvents: "none",
    zIndex: 9999,
    opacity: 0.7,
    border: "2px dashed var(--color-foreground)",
    background: "var(--color-card)",
  };

  if (cssShapes.includes(shape.type)) {
    return (
      <div style={{ ...style, borderRadius: borderRadiusMap[shape.type] }} />
    );
  }

  // SVG shapes for diamond, hexagon, cylinder
  const cx = scaledW / 2;
  const cy = scaledH / 2;

  if (shape.type === "diamond") {
    const pad = Math.min(scaledW, scaledH) * 0.08;
    const d = `M${cx},${pad} L${scaledW - pad},${cy} L${cx},${scaledH - pad} L${pad},${cy} Z`;
    return (
      <svg
        width={scaledW}
        height={scaledH}
        viewBox={`0 0 ${scaledW} ${scaledH}`}
        style={{ ...style, border: "none" }}
      >
        <path
          d={d}
          fill="var(--color-card)"
          stroke="var(--color-foreground)"
          strokeWidth={2}
          strokeDasharray={4}
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (shape.type === "hexagon") {
    const padX = scaledW * 0.15;
    const d = [
      `M${padX},0`,
      `L${scaledW - padX},0`,
      `L${scaledW},${cy}`,
      `L${scaledW - padX},${scaledH}`,
      `L${padX},${scaledH}`,
      `L0,${cy}`,
      "Z",
    ].join(" ");
    return (
      <svg
        width={scaledW}
        height={scaledH}
        viewBox={`0 0 ${scaledW} ${scaledH}`}
        style={{ ...style, border: "none" }}
      >
        <path
          d={d}
          fill="var(--color-card)"
          stroke="var(--color-foreground)"
          strokeWidth={2}
          strokeDasharray={4}
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  // cylinder
  const ry = Math.min(scaledH * 0.12, 12);
  return (
    <svg
      width={scaledW}
      height={scaledH}
      viewBox={`0 0 ${scaledW} ${scaledH}`}
      style={{ ...style, border: "none" }}
    >
      <rect
        x={3}
        y={ry}
        width={scaledW - 6}
        height={scaledH - ry * 2}
        fill="var(--color-card)"
        stroke="var(--color-foreground)"
        strokeWidth={2}
        strokeDasharray={4}
      />
      <ellipse
        cx={cx}
        cy={ry}
        rx={cx - 3}
        ry={ry}
        fill="var(--color-card)"
        stroke="var(--color-foreground)"
        strokeWidth={2}
        strokeDasharray={4}
      />
      <ellipse
        cx={cx}
        cy={scaledH - ry}
        rx={cx - 3}
        ry={ry}
        fill="var(--color-card)"
        stroke="var(--color-foreground)"
        strokeWidth={2}
        strokeDasharray={4}
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// ShapePanel
// ---------------------------------------------------------------------------

export function ShapePanel() {
  const [draggingShape, setDraggingShape] = useState<ShapeConfig | null>(null);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });

  // Track global drag events so the ghost preview follows the cursor
  // even when it moves over the canvas area (outside this component).
  useEffect(() => {
    if (!draggingShape) return;

    const onDragOver = (e: DragEvent) => {
      setCursorPos({ x: e.clientX, y: e.clientY });
    };
    const onDragEnd = () => {
      setDraggingShape(null);
    };

    window.addEventListener("dragover", onDragOver);
    window.addEventListener("dragend", onDragEnd);
    window.addEventListener("drop", onDragEnd);

    return () => {
      window.removeEventListener("dragover", onDragOver);
      window.removeEventListener("dragend", onDragEnd);
      window.removeEventListener("drop", onDragEnd);
    };
  }, [draggingShape]);

  const handleDragStart = useCallback(
    (e: React.DragEvent, shape: ShapeConfig) => {
      const payload = JSON.stringify({
        type: shape.type,
        width: shape.width,
        height: shape.height,
      });
      e.dataTransfer.setData(DRAG_DATA_TYPE, payload);
      e.dataTransfer.effectAllowed = "copy";
      setDraggingShape(shape);
      setCursorPos({ x: e.clientX, y: e.clientY });
    },
    []
  );

  return (
    <>
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30">
        <div className="flex items-center gap-1 px-3 py-2 rounded-full bg-card border border-border shadow-lg">
          {SHAPES.map((shape) => {
            const Icon = shape.icon;
            const isDragging = draggingShape?.type === shape.type;

            return (
              <button
                key={shape.type}
                type="button"
                draggable
                onDragStart={(e) => handleDragStart(e, shape)}
                onDragEnd={() => setDraggingShape(null)}
                className={[
                  "inline-flex h-9 w-9 items-center justify-center rounded-full",
                  "text-muted-foreground hover:text-foreground hover:bg-accent transition-colors",
                  isDragging && "opacity-50",
                ].join(" ")}
                title={shape.label}
                aria-label={`Drag to add ${shape.label}`}
              >
                <Icon className="h-4 w-4" />
              </button>
            );
          })}
        </div>
      </div>

      {draggingShape && (
        <GhostPreview shape={draggingShape} x={cursorPos.x} y={cursorPos.y} />
      )}
    </>
  );
}

export { DRAG_DATA_TYPE };
