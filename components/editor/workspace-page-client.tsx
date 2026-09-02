"use client";

import { EditorErrorBoundary } from "@/components/editor/editor-error-boundary";
import { LiveCanvas } from "@/components/editor/live-canvas";

export function WorkspacePageClient({ projectId }: { projectId: string }) {
  return (
    <EditorErrorBoundary label="Canvas failed to load">
      <LiveCanvas projectId={projectId} />
    </EditorErrorBoundary>
  );
}
