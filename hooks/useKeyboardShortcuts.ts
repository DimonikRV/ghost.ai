import { useEffect } from "react";

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.tagName === "INPUT") return true;
  if (target.tagName === "TEXTAREA") return true;
  if (target.contentEditable === "true") return true;
  return false;
}

interface UseKeyboardShortcutsOptions {
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onFitView?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
}

export function useKeyboardShortcuts({
  onZoomIn,
  onZoomOut,
  onFitView,
  onUndo,
  onRedo,
}: UseKeyboardShortcutsOptions) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isEditableTarget(e.target)) return;

      const key = e.key;
      const isCmdOrCtrl = e.metaKey || e.ctrlKey;

      // '+' or '=' to zoom in (without modifier)
      if (!isCmdOrCtrl && (key === "+" || key === "=")) {
        e.preventDefault();
        onZoomIn?.();
        return;
      }

      // '-' to zoom out (without modifier)
      if (!isCmdOrCtrl && key === "-") {
        e.preventDefault();
        onZoomOut?.();
        return;
      }

      // Cmd/Ctrl+Y to fit view
      if (isCmdOrCtrl && key === "y") {
        e.preventDefault();
        onFitView?.();
        return;
      }

      // Cmd/Ctrl+Shift+Z to redo
      if (isCmdOrCtrl && e.shiftKey && key === "z") {
        e.preventDefault();
        onRedo?.();
        return;
      }

      // Cmd/Ctrl+Z to undo
      if (isCmdOrCtrl && !e.shiftKey && key === "z") {
        e.preventDefault();
        onUndo?.();
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onZoomIn, onZoomOut, onFitView, onUndo, onRedo]);
}
