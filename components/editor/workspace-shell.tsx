"use client";

import { useState, useCallback, useSyncExternalStore } from "react";
import { PanelLeftOpen, PanelLeftClose, Share2, Bot } from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import { ProjectSidebar } from "@/components/editor/project-sidebar";
import { ShareDialog, type Collaborator } from "@/components/editor/share-dialog";
import { ShapePanel } from "@/components/editor/shape-panel";
import type { ProjectItem } from "@/hooks/use-project-actions";
import { cn } from "@/lib/utils";

function useMounted(): boolean {
  return useSyncExternalStore(
    () => () => { },
    () => true,
    () => false,
  );
}

interface WorkspaceShellProps {
  project: {
    id: string;
    name: string;
  };
  ownedProjects: ProjectItem[];
  sharedProjects: ProjectItem[];
  isOwner: boolean;
  collaborators: { id: string; email: string; createdAt: string }[];
  children: React.ReactNode;
}

export function WorkspaceShell({
  project,
  ownedProjects,
  sharedProjects,
  isOwner,
  collaborators,
  children,
}: WorkspaceShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [aiSidebarOpen, setAiSidebarOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareCollaborators, setShareCollaborators] = useState<Collaborator[]>(
    collaborators as Collaborator[]
  );
  const [shareLoading, setShareLoading] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);
  const mounted = useMounted();

  const refreshCollaborators = useCallback(async () => {
    const res = await fetch(`/api/projects/${project.id}/collaborators`);
    if (res.ok) {
      const data = await res.json();
      setShareCollaborators(data.collaborators);
    }
  }, [project.id]);

  const handleInvite = useCallback(
    async (email: string) => {
      setShareLoading(true);
      setShareError(null);
      try {
        const res = await fetch(`/api/projects/${project.id}/collaborators`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        if (!res.ok) {
          const error = await res
            .json()
            .catch(() => ({ error: "Failed to invite collaborator" }));
          setShareError(error.error ?? "Failed to invite collaborator");
          return;
        }
        await refreshCollaborators();
      } catch {
        setShareError("Failed to invite collaborator");
      } finally {
        setShareLoading(false);
      }
    },
    [project.id, refreshCollaborators]
  );

  const handleRemove = useCallback(
    async (collaboratorId: string) => {
      setShareLoading(true);
      setShareError(null);
      try {
        const res = await fetch(`/api/projects/${project.id}/collaborators`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ collaboratorId }),
        });
        if (!res.ok) {
          const error = await res
            .json()
            .catch(() => ({ error: "Failed to remove collaborator" }));
          setShareError(error.error ?? "Failed to remove collaborator");
          return;
        }
        await refreshCollaborators();
      } catch {
        setShareError("Failed to remove collaborator");
      } finally {
        setShareLoading(false);
      }
    },
    [project.id, refreshCollaborators]
  );

  return (
    <>
      {/* Top navbar */}
      <header className="fixed top-0 left-0 right-0 z-40 flex h-12 items-center justify-between px-3 bg-card border-b border-border">
        {/* Left: sidebar toggle + project name */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setSidebarOpen((prev) => !prev)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
          >
            {sidebarOpen ? (
              <PanelLeftClose className="h-4 w-4" />
            ) : (
              <PanelLeftOpen className="h-4 w-4" />
            )}
          </button>
          <span className="text-sm font-medium truncate max-w-[200px]">
            {project.name}
          </span>
        </div>

        {/* Center: empty */}
        <div className="flex-1" />

        {/* Right: share, AI toggle, user */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setShareOpen(true)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            aria-label="Share project"
          >
            <Share2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setAiSidebarOpen((prev) => !prev)}
            className={cn(
              "inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors",
              aiSidebarOpen && "bg-accent text-accent-foreground",
            )}
            aria-label="Toggle AI sidebar"
          >
            <Bot className="h-4 w-4" />
          </button>
          <UserButton />
        </div>
      </header>

      {/* Project sidebar */}
      {mounted && (
        <ProjectSidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          ownedProjects={ownedProjects}
          sharedProjects={sharedProjects}
          onRename={() => { }}
          onDelete={() => { }}
          onCreate={() => { }}
          activeProjectId={project.id}
        />
      )}

      {/* AI sidebar placeholder */}
      {aiSidebarOpen && (
        <div className="fixed top-12 right-0 bottom-0 z-30 w-80 bg-card border-l border-border flex flex-col items-center justify-center">
          <Bot className="h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">AI Chat</p>
          <p className="text-xs text-muted-foreground mt-1">Coming soon</p>
        </div>
      )}

      {/* Main content area */}
      <main className="fixed top-12 left-0 right-0 bottom-0 overflow-hidden">
        {children}
      </main>

      {/* Shape panel */}
      <ShapePanel />

      {/* Share dialog */}
      <ShareDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        projectId={project.id}
        isOwner={isOwner}
        collaborators={shareCollaborators}
        onInvite={handleInvite}
        onRemove={handleRemove}
        isLoading={shareLoading}
        error={shareError}
      />
    </>
  );
}
