"use client";

import { ZoomIn, ZoomOut, Maximize2, Undo2, Redo2, LayoutGrid, CircleHelp, Download } from "lucide-react";
import { cn } from "@/lib/utils";

interface CanvasControlBarProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitView: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onTemplates: () => void;
  onExport: () => void;
  onHelp: () => void;
}

export function CanvasControlBar({
  onZoomIn,
  onZoomOut,
  onFitView,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onTemplates,
  onExport,
  onHelp,
}: CanvasControlBarProps) {
  return (
    <div className="absolute bottom-4 left-4 z-10 flex items-center gap-1 rounded-lg border border-border bg-card px-1.5 py-1.5 shadow-sm">
      {/* Templates */}
      <button
        type="button"
        onClick={onTemplates}
        className="inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
        aria-label="Templates"
        title="Templates..."
      >
        <LayoutGrid className="h-3.5 w-3.5" />
        Templates...
      </button>

      {/* Help */}
      <button
        type="button"
        onClick={onHelp}
        className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
        aria-label="Help"
        title="Getting Started"
      >
        <CircleHelp className="h-3.5 w-3.5" />
      </button>

      {/* Export */}
      <button
        type="button"
        onClick={onExport}
        className="inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
        aria-label="Export"
        title="Export diagram or code"
      >
        <Download className="h-3.5 w-3.5" />
        Export
      </button>

      <div className="h-4 w-px bg-border mx-0.5" />

      {/* Zoom controls */}
      <button
        type="button"
        onClick={onZoomOut}
        className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
        aria-label="Zoom out"
        title="Zoom out"
      >
        <ZoomOut className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={onFitView}
        className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
        aria-label="Fit view"
        title="Fit view"
      >
        <Maximize2 className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={onZoomIn}
        className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
        aria-label="Zoom in"
        title="Zoom in"
      >
        <ZoomIn className="h-3.5 w-3.5" />
      </button>

      <div className="h-4 w-px bg-border mx-0.5" />

      {/* History controls */}
      <button
        type="button"
        onClick={onUndo}
        disabled={!canUndo}
        className={cn(
          "inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors",
          !canUndo && "opacity-40 pointer-events-none"
        )}
        aria-label="Undo"
        title="Undo"
      >
        <Undo2 className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={onRedo}
        disabled={!canRedo}
        className={cn(
          "inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors",
          !canRedo && "opacity-40 pointer-events-none"
        )}
        aria-label="Redo"
        title="Redo"
      >
        <Redo2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
