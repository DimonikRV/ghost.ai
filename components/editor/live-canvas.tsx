"use client";

import { LiveblocksProvider, RoomProvider, ClientSideSuspense } from "@liveblocks/react";
import { ReactFlowProvider } from "@xyflow/react";
import { Canvas } from "@/components/editor/canvas";

interface LiveCanvasProps {
  projectId: string;
}

export function LiveCanvas({ projectId }: LiveCanvasProps) {
  if (!projectId) {
    return (
      <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
        No project ID provided
      </div>
    );
  }

  return (
    <LiveblocksProvider
      authEndpoint={async (roomId) => {
        const res = await fetch("/api/liveblocks-auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roomId }),
        });
        return await res.json();
      }}
    >
      <RoomProvider
        id={projectId}
        initialPresence={{ cursor: { x: 0, y: 0 }, isThinking: false }}
      >
        <ClientSideSuspense
          fallback={
            <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
              Loading canvas…
            </div>
          }
        >
          <ReactFlowProvider>
            <Canvas />
          </ReactFlowProvider>
        </ClientSideSuspense>
      </RoomProvider>
    </LiveblocksProvider>
  );
}
