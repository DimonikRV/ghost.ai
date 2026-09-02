"use client";

import { createContext, useContext } from "react";
import type {
  DiagramNode,
  DiagramEdge,
} from "@/components/editor/starter-templates";

export type ApplyDiagramFn = (
  nodes: DiagramNode[],
  edges: DiagramEdge[],
) => void;

/**
 * Provides a callback that Canvas calls to register its wrapper DOM element.
 * WorkspaceShell owns the actual ref and stores the element via this callback.
 */
const RegisterWrapperRefContext = createContext<
  ((node: HTMLDivElement | null) => void) | null
>(null);

export function useRegisterWrapperRef(): (node: HTMLDivElement | null) => void {
  const fn = useContext(RegisterWrapperRefContext);
  if (!fn) {
    return () => {};
  }
  return fn;
}

export { RegisterWrapperRefContext };

const ExportDialogContext = createContext<(() => void) | null>(null);

export function useExportDialog(): () => void {
  const fn = useContext(ExportDialogContext);
  if (!fn) {
    return () => {};
  }
  return fn;
}

export { ExportDialogContext };

/**
 * Canvas registers an applyDiagram callback here on mount so the AI sidebar
 * can push generated nodes/edges into the Liveblocks canvas.
 */
const RegisterApplyDiagramContext = createContext<
  ((fn: ApplyDiagramFn | null) => void) | null
>(null);

export function useRegisterApplyDiagram(): (fn: ApplyDiagramFn | null) => void {
  const fn = useContext(RegisterApplyDiagramContext);
  if (!fn) {
    return () => {};
  }
  return fn;
}

export { RegisterApplyDiagramContext };

const ApplyDiagramContext = createContext<ApplyDiagramFn | null>(null);

export function useApplyDiagram(): ApplyDiagramFn | null {
  return useContext(ApplyDiagramContext);
}

export { ApplyDiagramContext };
