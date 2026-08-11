"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CANVAS_TEMPLATES, type CanvasTemplate } from "./starter-templates";

interface StarterTemplatesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (template: CanvasTemplate) => void;
}

// ---------------------------------------------------------------------------
// Mini diagram preview — lightweight SVG rendering of template nodes/edges
// ---------------------------------------------------------------------------

function TemplatePreview({ template }: { template: CanvasTemplate }) {
  const PREVIEW_W = 280;
  const PREVIEW_H = 160;
  const PADDING = 12;

  // Calculate bounds from node positions
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const n of template.nodes) {
    const w = n.data.width ?? 100;
    const h = n.data.height ?? 60;
    minX = Math.min(minX, n.position.x);
    minY = Math.min(minY, n.position.y);
    maxX = Math.max(maxX, n.position.x + w);
    maxY = Math.max(maxY, n.position.y + h);
  }

  const contentW = maxX - minX || 1;
  const contentH = maxY - minY || 1;
  const scale = Math.min(
    (PREVIEW_W - PADDING * 2) / contentW,
    (PREVIEW_H - PADDING * 2) / contentH,
    1
  );

  const offsetX = PADDING + (PREVIEW_W - PADDING * 2 - contentW * scale) / 2;
  const offsetY = PADDING + (PREVIEW_H - PADDING * 2 - contentH * scale) / 2;

  function tx(v: number) {
    return (v - minX) * scale + offsetX;
  }
  function ty(v: number) {
    return (v - minY) * scale + offsetY;
  }

  // Resolve CSS variable colors to hex values for SVG
  const colorMap: Record<string, string> = {
    "var(--color-node-red)": "#ef4444",
    "var(--color-node-orange)": "#f97316",
    "var(--color-node-amber)": "#eab308",
    "var(--color-node-green)": "#22c55e",
    "var(--color-node-teal)": "#14b8a6",
    "var(--color-node-blue)": "#3b82f6",
    "var(--color-node-indigo)": "#6366f1",
    "var(--color-node-violet)": "#8b5cf6",
    "var(--color-node-pink)": "#ec4899",
    "var(--color-card)": "#333",
  };

  return (
    <svg
      width={PREVIEW_W}
      height={PREVIEW_H}
      viewBox={`0 0 ${PREVIEW_W} ${PREVIEW_H}`}
      className="rounded-md border border-border bg-background"
    >
      {/* Edges */}
      {template.edges.map((e) => {
        const src = template.nodes.find((n) => n.id === e.source);
        const tgt = template.nodes.find((n) => n.id === e.target);
        if (!src || !tgt) return null;

        const sw = src.data.width ?? 100;
        const sh = src.data.height ?? 60;
        const tw = tgt.data.width ?? 100;
        const th = tgt.data.height ?? 60;

        const sx = tx(src.position.x + sw / 2);
        const sy = ty(src.position.y + sh / 2);
        const ex = tx(tgt.position.x + tw / 2);
        const ey = ty(tgt.position.y + th / 2);

        return (
          <line
            key={e.id}
            x1={sx}
            y1={sy}
            x2={ex}
            y2={ey}
            stroke="var(--color-foreground)"
            strokeWidth={2}
            markerEnd="url(#arrowhead)"
          />
        );
      })}

      {/* Nodes — drawn on top of edges */}
      {template.nodes.map((n) => {
        const w = (n.data.width ?? 100) * scale;
        const h = (n.data.height ?? 60) * scale;
        const x = tx(n.position.x);
        const y = ty(n.position.y);
        const fill = colorMap[n.data.color] ?? "#333";

        // Dynamic font size: fit text inside node with padding
        const textPadding = 6;
        const availW = w - textPadding * 2;
        const availH = h - textPadding * 2;
        const label = n.data.label || " ";
        const charWidth = 0.55; // approximate char width ratio for sans-serif
        const fontSizeByW = availW / (label.length * charWidth);
        const fontSizeByH = availH / 1.4; // line-height ratio
        const fontSize = Math.max(Math.min(fontSizeByW, fontSizeByH), 5);

        return (
          <g key={n.id}>
            <rect
              x={x}
              y={y}
              width={w}
              height={h}
              rx={4}
              fill={fill}
              stroke="var(--color-border)"
              strokeWidth={1}
            />
            <text
              x={x + w / 2}
              y={y + h / 2}
              textAnchor="middle"
              dominantBaseline="central"
              fill="var(--color-foreground)"
              fontSize={fontSize}
              fontFamily="var(--font-sans, sans-serif)"
              textLength={availW}
              lengthAdjust="spacing"
            >
              {label.length > 20
                ? label.slice(0, 20) + "…"
                : label}
            </text>
          </g>
        );
      })}

      {/* Arrowhead marker */}
      <defs>
        <marker
          id="arrowhead"
          viewBox="0 0 10 6"
          refX={10}
          refY={3}
          markerWidth={10}
          markerHeight={7}
          orient="auto"
        >
          <path d="M0,0 L10,3 L0,6 Z" fill="var(--color-foreground)" />
        </marker>
      </defs>
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Template card
// ---------------------------------------------------------------------------

function TemplateCard({
  template,
  onImport,
}: {
  template: CanvasTemplate;
  onImport: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-3 transition-colors hover:border-accent">
      <TemplatePreview template={template} />
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-foreground truncate">
            {template.name}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
            {template.description}
          </p>
        </div>
        <button
          type="button"
          onClick={onImport}
          className="shrink-0 inline-flex items-center justify-center h-8 px-3 rounded-md text-xs font-medium bg-accent text-accent-foreground hover:opacity-90 transition-opacity"
        >
          Import
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Modal
// ---------------------------------------------------------------------------

export function StarterTemplatesModal({
  open,
  onOpenChange,
  onImport,
}: StarterTemplatesModalProps) {
  const handleImport = (template: CanvasTemplate) => {
    onImport(template);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-2xl rounded-xl">
        <DialogHeader>
          <DialogTitle>Starter Templates</DialogTitle>
          <DialogDescription>
            Choose a pre-built diagram to get started quickly.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-2">
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
            {CANVAS_TEMPLATES.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onImport={() => handleImport(template)}
              />
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
