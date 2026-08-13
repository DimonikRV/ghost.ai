"use client";

import { useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { EditorNavbar } from "@/components/editor/editor-navbar";
import { ProjectSidebar } from "@/components/editor/project-sidebar";
import { ProjectActionsProvider, useProjectActionsContext } from "@/components/editor/project-actions-context";
import { CreateProjectDialog } from "@/components/editor/create-project-dialog";
import { RenameProjectDialog } from "@/components/editor/rename-project-dialog";
import { DeleteProjectDialog } from "@/components/editor/delete-project-dialog";
import type { ProjectItem } from "@/hooks/use-project-actions";

interface EditorShellProps {
  children: React.ReactNode;
  ownedProjects: ProjectItem[];
  sharedProjects: ProjectItem[];
}

function useMounted(): boolean {
  return useSyncExternalStore(
    () => () => { },
    () => true,
    () => false,
  );
}

function DialogsRenderer() {
  const {
    activeDialog,
    selectedProject,
    createName,
    createRoomId,
    renameName,
    isLoading,
    closeDialogs,
    setCreateName,
    setRenameName,
    handleCreateSubmit,
    handleRenameSubmit,
    handleDeleteSubmit,
  } = useProjectActionsContext();

  return (
    <>
      <CreateProjectDialog
        open={activeDialog === "create"}
        onOpenChange={(open) => !open && closeDialogs()}
        name={createName}
        roomId={createRoomId}
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
  );
}

function EditorShellInner({
  children,
  ownedProjects,
  sharedProjects,
}: EditorShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const mounted = useMounted();
  const actions = useProjectActionsContext();
  const router = useRouter();

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
          ownedProjects={ownedProjects}
          sharedProjects={sharedProjects}
          onRename={actions.openRename}
          onDelete={actions.openDelete}
          onCreate={actions.openCreate}
          onOpenProject={(project) => router.push(`/editor/${project.id}`)}
        />
      )}
      <main className="pt-12 min-h-screen">{children}</main>
      <DialogsRenderer />
    </>
  );
}

export function EditorShell(props: EditorShellProps) {
  return (
    <ProjectActionsProvider>
      <EditorShellInner {...props} />
    </ProjectActionsProvider>
  );
}
