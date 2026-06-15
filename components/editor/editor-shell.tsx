"use client"

import { useState, useSyncExternalStore } from "react"
import { EditorNavbar } from "@/components/editor/editor-navbar"
import { ProjectSidebar } from "@/components/editor/project-sidebar"
import { ProjectDialogsProvider, useProjectDialogsContext } from "@/components/editor/project-dialogs-context"
import { CreateProjectDialog } from "@/components/editor/create-project-dialog"
import { RenameProjectDialog } from "@/components/editor/rename-project-dialog"
import { DeleteProjectDialog } from "@/components/editor/delete-project-dialog"

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

function DialogsRenderer() {
  const {
    activeDialog,
    selectedProject,
    createName,
    createSlug,
    renameName,
    isLoading,
    closeDialogs,
    setCreateName,
    setRenameName,
    handleCreateSubmit,
    handleRenameSubmit,
    handleDeleteSubmit,
  } = useProjectDialogsContext()

  return (
    <>
      <CreateProjectDialog
        open={activeDialog === "create"}
        onOpenChange={(open) => !open && closeDialogs()}
        name={createName}
        slug={createSlug}
        onNameChange={setCreateName}
        onSubmit={handleCreateSubmit}
        isLoading={isLoading}
      />
      {selectedProject && (
        <>
          <RenameProjectDialog
            open={activeDialog === "rename"}
            onOpenChange={(open) => !open && closeDialogs()}
            project={selectedProject}
            name={renameName}
            onNameChange={setRenameName}
            onSubmit={handleRenameSubmit}
            isLoading={isLoading}
          />
          <DeleteProjectDialog
            open={activeDialog === "delete"}
            onOpenChange={(open) => !open && closeDialogs()}
            project={selectedProject}
            onSubmit={handleDeleteSubmit}
            isLoading={isLoading}
          />
        </>
      )}
    </>
  )
}

function EditorShellInner({ children }: EditorShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const mounted = useMounted()
  const dialogs = useProjectDialogsContext()

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
          onRename={dialogs.openRename}
          onDelete={dialogs.openDelete}
          onCreate={dialogs.openCreate}
        />
      )}
      <main className="pt-12 min-h-screen">{children}</main>
      <DialogsRenderer />
    </>
  )
}

export function EditorShell({ children }: EditorShellProps) {
  return (
    <ProjectDialogsProvider>
      <EditorShellInner>{children}</EditorShellInner>
    </ProjectDialogsProvider>
  )
}
