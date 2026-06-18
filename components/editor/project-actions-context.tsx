"use client";

import { createContext, useContext, type ReactNode } from "react";
import {
  useProjectActions,
  type UseProjectActionsReturn,
} from "@/hooks/use-project-actions";

const ProjectActionsContext = createContext<UseProjectActionsReturn | null>(null);

export function ProjectActionsProvider({ children }: { children: ReactNode }) {
  const actions = useProjectActions();
  return (
    <ProjectActionsContext.Provider value={actions}>
      {children}
    </ProjectActionsContext.Provider>
  );
}

export function useProjectActionsContext(): UseProjectActionsReturn {
  const ctx = useContext(ProjectActionsContext);
  if (!ctx) {
    throw new Error(
      "useProjectActionsContext must be used within ProjectActionsProvider",
    );
  }
  return ctx;
}
