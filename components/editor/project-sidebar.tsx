"use client";

import { Plus, X, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { slugify, type ProjectItem } from "@/hooks/use-project-actions";

interface ProjectSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  ownedProjects: ProjectItem[];
  sharedProjects: ProjectItem[];
  onRename: (project: ProjectItem) => void;
  onDelete: (project: ProjectItem) => void;
  onCreate: () => void;
  className?: string;
}

function ProjectItemRow({
  project,
  onRename,
  onDelete,
}: {
  project: ProjectItem;
  onRename: (project: ProjectItem) => void;
  onDelete: (project: ProjectItem) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  const slug = slugify(project.name) || project.id;

  return (
    <div className="group flex items-center justify-between rounded-md px-3 py-2 hover:bg-accent/50">
      <div className="flex flex-col overflow-hidden">
        <span className="truncate text-sm font-medium">{project.name}</span>
        <span className="truncate text-xs text-muted-foreground">/{slug}</span>
      </div>
      <div className="relative shrink-0">
        <button
          type="button"
          onClick={() => setMenuOpen(!menuOpen)}
          className="inline-flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-accent hover:text-accent-foreground transition-all"
          aria-label="Project actions"
        >
          <MoreVertical className="h-3.5 w-3.5" />
        </button>
        {menuOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setMenuOpen(false)}
              aria-hidden="true"
            />
            <div className="absolute right-0 top-full mt-1 z-50 w-36 rounded-md border border-border bg-popover p-1 shadow-md">
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onRename(project);
                }}
                className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
              >
                <Pencil className="h-3.5 w-3.5" />
                Rename
              </button>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onDelete(project);
                }}
                className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export function ProjectSidebar({
  isOpen,
  onClose,
  ownedProjects,
  sharedProjects,
  onRename,
  onDelete,
  onCreate,
  className,
}: ProjectSidebarProps) {
  return (
    <>
      {/* Backdrop scrim — click to close (mobile) */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 md:bg-black/0"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar panel — floats above content, slides from left */}
      <aside
        className={cn(
          "fixed top-12 left-0 bottom-0 z-50 flex w-80 flex-col bg-card border-r border-border shadow-lg transition-transform duration-200 ease-in-out md:shadow-none",
          isOpen ? "translate-x-0" : "-translate-x-full",
          className,
        )}
      >
        {/* Header */}
        <div className="flex h-12 shrink-0 items-center justify-between px-4 border-b border-border">
          <h2 className="text-sm font-medium">Projects</h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            aria-label="Close sidebar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="my-projects" className="flex flex-1 flex-col overflow-hidden p-3">
          <TabsList className="w-full">
            <TabsTrigger value="my-projects">My Projects</TabsTrigger>
            <TabsTrigger value="shared">Shared</TabsTrigger>
          </TabsList>

          <TabsContent value="my-projects" className="flex-1 overflow-y-auto pt-3 space-y-1">
            {ownedProjects.length === 0 ? (
              <p className="px-3 py-2 text-sm text-muted-foreground">No projects yet.</p>
            ) : (
              ownedProjects.map((project) => (
                <ProjectItemRow
                  key={project.id}
                  project={project}
                  onRename={onRename}
                  onDelete={onDelete}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="shared" className="flex-1 overflow-y-auto pt-3 space-y-1">
            {sharedProjects.length === 0 ? (
              <p className="px-3 py-2 text-sm text-muted-foreground">No shared projects.</p>
            ) : (
              sharedProjects.map((project) => (
                <ProjectItemRow
                  key={project.id}
                  project={project}
                  onRename={onRename}
                  onDelete={onDelete}
                />
              ))
            )}
          </TabsContent>
        </Tabs>

        {/* Footer — New Project button */}
        <div className="shrink-0 border-t border-border p-3">
          <button
            type="button"
            onClick={onCreate}
            className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-md bg-accent-brand px-3 text-sm font-medium text-white hover:bg-accent-brand/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            New Project
          </button>
        </div>
      </aside>
    </>
  );
}
