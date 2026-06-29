import { useEffect, useRef, useState, useCallback } from "react";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

const AUTOSAVE_DEBOUNCE_MS = 2000;

export function useCanvasAutosave(
  projectId: string,
  nodes: unknown[],
  edges: unknown[]
): SaveStatus {
  const [status, setStatus] = useState<SaveStatus>("idle");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);

  // Keep refs updated so the debounced callback always reads latest data
  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);

  useEffect(() => {
    edgesRef.current = edges;
  }, [edges]);

  const save = useCallback(async () => {
    setStatus("saving");
    try {
      const res = await fetch(`/api/projects/${projectId}/canvas`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nodes: nodesRef.current,
          edges: edgesRef.current,
        }),
      });

      if (!res.ok) {
        setStatus("error");
        return;
      }

      setStatus("saved");
    } catch {
      setStatus("error");
    }
  }, [projectId]);

  useEffect(() => {
    // Clear any pending save
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    // Schedule a new debounced save
    timerRef.current = setTimeout(() => {
      save();
    }, AUTOSAVE_DEBOUNCE_MS);

    // Cleanup on unmount or next effect run
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [nodes, edges, save]);

  return status;
}
