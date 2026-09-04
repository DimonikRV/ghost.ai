"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  Download,
  FileCode,
  FileImage,
  FileJson,
  Package,
  Loader2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { graphToMermaid } from "@/lib/export/mermaid";
import { graphToPlantUml } from "@/lib/export/plantuml";
import { exportToJson } from "@/lib/export/json";
import { exportToPng, exportToSvg } from "@/lib/export/image";
import { downloadFile } from "@/lib/export/download";
import { slugify } from "@/lib/slugify";
import { FRAMEWORKS, type FrameworkDef } from "@/lib/export/frameworks";
import type { DiagramNode, DiagramEdge } from "@/components/editor/starter-templates";
import { cn } from "@/lib/utils";

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
  reactFlowWrapperRef?: React.RefObject<HTMLDivElement | null>;
  wrapperMounted?: boolean;
}

interface CanvasState {
  nodes: DiagramNode[];
  edges: DiagramEdge[];
}

type ExportStatus = "idle" | "fetching" | "generating" | "downloading";

export function ExportDialog({
  isOpen,
  onClose,
  projectId,
  projectName,
  reactFlowWrapperRef,
  wrapperMounted,
}: ExportDialogProps) {
  const [selectedFramework, setSelectedFramework] =
    useState<FrameworkDef | null>(null);
  const [status, setStatus] = useState<ExportStatus>("idle");
  const [currentRunId, setCurrentRunId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [canvasHasNodes, setCanvasHasNodes] = useState<boolean | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const filename = slugify(projectName) || "project";

  const fetchCanvasState = useCallback(async (): Promise<CanvasState> => {
    const res = await fetch(`/api/projects/${projectId}/canvas`);
    if (!res.ok) throw new Error("Failed to load canvas");
    return res.json();
  }, [projectId]);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    fetchCanvasState()
      .then((canvas) => {
        if (!cancelled) setCanvasHasNodes(canvas.nodes.length > 0);
      })
      .catch(() => {
        if (!cancelled) setCanvasHasNodes(null);
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen, fetchCanvasState]);

  const handleDiagramExport = useCallback(
    async (format: "mermaid" | "plantuml" | "png" | "svg" | "json") => {
      setStatus("fetching");
      try {
        const canvas = await fetchCanvasState();

        switch (format) {
          case "mermaid": {
            const mermaid = graphToMermaid(canvas.nodes, canvas.edges);
            downloadFile(mermaid, `${filename}.mmd`, "text/plain");
            break;
          }
          case "plantuml": {
            const puml = graphToPlantUml(canvas.nodes, canvas.edges);
            downloadFile(puml, `${filename}.puml`, "text/plain");
            break;
          }
          case "json": {
            exportToJson(canvas.nodes, canvas.edges, filename);
            break;
          }
          case "png": {
            if (!reactFlowWrapperRef?.current) break;
            await exportToPng(reactFlowWrapperRef.current, filename);
            break;
          }
          case "svg": {
            if (!reactFlowWrapperRef?.current) break;
            await exportToSvg(reactFlowWrapperRef.current, filename);
            break;
          }
        }
      } catch (err) {
        console.error("Export failed:", err);
      } finally {
        setStatus("idle");
      }
    },
    [fetchCanvasState, filename, reactFlowWrapperRef],
  );

  const pollForCompletion = useCallback(
    async (runId: string) => {
      const maxAttempts = 120;
      const interval = 2_000;

      for (let i = 0; i < maxAttempts; i++) {
        await new Promise((r) => setTimeout(r, interval));

        let statusRes: Response;
        try {
          statusRes = await fetch(`/api/export/code/${runId}/download`);
        } catch {
          continue;
        }

        let statusBody: { status?: string; error?: string };
        try {
          statusBody = await statusRes.json();
        } catch {
          continue;
        }

        if (statusBody.status === "pending") {
          continue;
        }

        if (statusBody.status === "failed") {
          throw new Error(statusBody.error || "Export generation failed");
        }

        if (statusBody.status === "completed") {
          let downloadRes: Response;
          try {
            downloadRes = await fetch(
              `/api/export/code/${runId}/download?file=1`,
            );
          } catch {
            continue;
          }

          if (downloadRes.ok) {
            const blob = await downloadRes.blob();
            const disposition =
              downloadRes.headers.get("content-disposition") || "";
            const filenameMatch = disposition.match(/filename="?(.+?)"?$/);
            const dlFilename = filenameMatch
              ? filenameMatch[1]
              : `${filename}-${selectedFramework?.id}.zip`;
            setStatus("downloading");
            downloadFile(blob, dlFilename, "application/zip");
            setStatus("idle");
            setCurrentRunId(null);
            onClose();
            return;
          }

          continue;
        }

        throw new Error(
          `Unexpected export status: ${statusBody.status ?? "unknown"}`,
        );
      }

      throw new Error("Export timed out");
    },
    [filename, selectedFramework, onClose],
  );

  const handleCodeExport = useCallback(async () => {
    if (!selectedFramework) return;

    // Guard: don't POST to the export API for an empty canvas — the server
    // rejects it with a 400. Fail fast here with inline feedback instead.
    if (canvasHasNodes === false) {
      setError("Canvas is empty — add nodes before exporting");
      setStatus("idle");
      return;
    }

    setStatus("generating");
    setError(null);

    try {
      const triggerRes = await fetch("/api/export/code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, framework: selectedFramework.id }),
      });

      if (!triggerRes.ok) {
        const err = await triggerRes.json().catch(() => ({}));
        throw new Error(err.error || "Failed to start export");
      }

      const { runId } = await triggerRes.json();
      setCurrentRunId(runId);

      await pollForCompletion(runId);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Export failed";
      setError(message);
      setStatus("idle");
      setCurrentRunId(null);
    }
  }, [selectedFramework, projectId, pollForCompletion, canvasHasNodes]);

  const isBusy = status !== "idle";

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (open) setCanvasHasNodes(null);
        else onClose();
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export
          </DialogTitle>
          <DialogDescription>
            Download your diagram or generate a project scaffold.
          </DialogDescription>
        </DialogHeader>

        {/* Diagram Formats */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Diagram Formats
          </p>
          <div className="flex flex-wrap gap-2">
            <FormatButton
              icon={<FileCode className="h-3.5 w-3.5" />}
              label="Mermaid"
              onClick={() => handleDiagramExport("mermaid")}
              disabled={isBusy}
            />
            <FormatButton
              icon={<FileCode className="h-3.5 w-3.5" />}
              label="PlantUML"
              onClick={() => handleDiagramExport("plantuml")}
              disabled={isBusy}
            />
            <FormatButton
              icon={<FileImage className="h-3.5 w-3.5" />}
              label="PNG"
              onClick={() => handleDiagramExport("png")}
              disabled={isBusy || !wrapperMounted}
            />
            <FormatButton
              icon={<FileImage className="h-3.5 w-3.5" />}
              label="SVG"
              onClick={() => handleDiagramExport("svg")}
              disabled={isBusy || !wrapperMounted}
            />
            <FormatButton
              icon={<FileJson className="h-3.5 w-3.5" />}
              label="JSON"
              onClick={() => handleDiagramExport("json")}
              disabled={isBusy}
            />
          </div>
        </div>

        <div className="h-px bg-border" />

        {/* Code Scaffolds */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Code Scaffolds
          </p>
          <div className="grid grid-cols-3 gap-1.5">
            {FRAMEWORKS.map((fw) => (
              <button
                key={fw.id}
                type="button"
                onClick={() => {
                  setSelectedFramework(fw);
                  setError(null);
                }}
                disabled={isBusy}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs text-left transition-colors border",
                  selectedFramework?.id === fw.id
                    ? "bg-accent-brand/20 border-accent-brand text-foreground"
                    : "border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                  isBusy && "opacity-50 pointer-events-none",
                )}
                title={fw.description}
              >
                <Package className="h-3 w-3 shrink-0" />
                <span className="truncate">{fw.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Generate button + status */}
        <div className="space-y-2">
          <button
            type="button"
            onClick={handleCodeExport}
            disabled={!selectedFramework || isBusy || canvasHasNodes === false}
            className={cn(
              "inline-flex h-9 w-full items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors",
              selectedFramework && !isBusy && canvasHasNodes !== false
                ? "bg-accent-brand text-white hover:bg-accent-brand/90"
                : "bg-muted text-muted-foreground cursor-not-allowed",
            )}
          >
            {status === "generating" ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating…
              </>
            ) : status === "downloading" ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Downloading…
              </>
            ) : status === "fetching" ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading canvas…
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Generate &amp; Download ZIP
              </>
            )}
          </button>

          {currentRunId && status === "generating" && (
            <p className="text-xs text-muted-foreground text-center">
              Generating your project scaffold…
            </p>
          )}

          {canvasHasNodes === false && selectedFramework && (
            <p className="text-xs text-muted-foreground text-center">
              Add at least one node to your canvas before exporting.
            </p>
          )}

          {error && (
            <p className="text-xs text-red-500 text-center">{error}</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function FormatButton({
  icon,
  label,
  onClick,
  disabled,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs text-muted-foreground transition-colors",
        "hover:bg-accent hover:text-accent-foreground",
        disabled && "opacity-50 pointer-events-none",
      )}
    >
      {icon}
      {label}
    </button>
  );
}
