"use client"

import { createContext, useContext, type ReactNode } from "react"
import {
  useProjectDialogs,
  type UseProjectDialogsReturn,
} from "@/components/editor/use-project-dialogs"

const ProjectDialogsContext = createContext<UseProjectDialogsReturn | null>(null)

export function ProjectDialogsProvider({ children }: { children: ReactNode }) {
  const dialogs = useProjectDialogs()
  return (
    <ProjectDialogsContext.Provider value={dialogs}>
      {children}
    </ProjectDialogsContext.Provider>
  )
}

export function useProjectDialogsContext(): UseProjectDialogsReturn {
  const ctx = useContext(ProjectDialogsContext)
  if (!ctx) {
    throw new Error("useProjectDialogsContext must be used within ProjectDialogsProvider")
  }
  return ctx
}
