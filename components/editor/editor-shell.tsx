"use client"

import { useState, useSyncExternalStore } from "react"
import { EditorNavbar } from "@/components/editor/editor-navbar"
import { ProjectSidebar } from "@/components/editor/project-sidebar"

interface EditorShellProps {
  children: React.ReactNode
}

function useMounted(): boolean {
  return useSyncExternalStore(
    () => () => { }, // no-op subscribe
    () => true, // client: true
    () => false // server: false
  )
}

export function EditorShell({ children }: EditorShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const mounted = useMounted()

  return (
    <>
      <EditorNavbar
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
      />
      {mounted && (
        <ProjectSidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
      )}
      <main className="pt-12 min-h-screen">{children}</main>
    </>
  )
}
