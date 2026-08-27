"use client";

import { createContext, useContext } from "react";

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
    throw new Error("useExportDialog must be used within ExportDialogContext.Provider");
  }
  return fn;
}

export { ExportDialogContext };
