"use client";

import { useContext } from "react";
import { ClientSideSuspense } from "@liveblocks/react";
import { ReactFlowProvider } from "@xyflow/react";
import { Canvas } from "@/components/editor/canvas";
import { CanvasSaveStatusContext } from "@/components/editor/workspace-shell";
import {
  useRegisterWrapperRef,
  useExportDialog,
} from "@/components/editor/react-flow-wrapper-ref-context";

interface LiveCanvasProps {
  projectId: string;
}

export function LiveCanvas({ projectId }: LiveCanvasProps) {
  const onStatusChange = useContext(CanvasSaveStatusContext);
  const registerWrapperRef = useRegisterWrapperRef();
  const onExport = useExportDialog();

  if (!projectId) {
    return (
      <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
        No project ID provided
      </div>
    );
  }

  return (
    <ClientSideSuspense
      fallback={
        <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
          Loading canvas…
        </div>
      }
    >
      <ReactFlowProvider>
        <Canvas
          projectId={projectId}
          onStatusChange={onStatusChange ?? undefined}
          onExport={onExport}
          registerWrapperRef={registerWrapperRef}
        />
      </ReactFlowProvider>
    </ClientSideSuspense>
  );
}
