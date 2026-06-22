"use client";

import { useState } from "react";
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

export function ShapePanel() {
  const [draggingShape, setDraggingShape] = useState<ShapeType | null>(null);

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30">
      <div className="flex items-center gap-1 px-3 py-2 rounded-full bg-card border border-border shadow-lg">
        {SHAPES.map((shape) => {
          const Icon = shape.icon;
          const isDragging = draggingShape === shape.type;

          return (
            <button
              key={shape.type}
              type="button"
              draggable
              onDragStart={(e) => {
                const payload = JSON.stringify({
                  type: shape.type,
                  width: shape.width,
                  height: shape.height,
                });
                e.dataTransfer.setData(DRAG_DATA_TYPE, payload);
                e.dataTransfer.effectAllowed = "copy";
                setDraggingShape(shape.type);
              }}
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
  );
}

export { DRAG_DATA_TYPE };
