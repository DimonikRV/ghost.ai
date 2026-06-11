"use client"

import { Plus, X } from "lucide-react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

interface ProjectSidebarProps {
  isOpen: boolean
  onClose: () => void
  className?: string
}

export function ProjectSidebar({
  isOpen,
  onClose,
  className,
}: ProjectSidebarProps) {
  return (
    <>
      {/* Backdrop — click to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar panel — floats above content, slides from left */}
      <aside
        className={cn(
          "fixed top-12 left-0 bottom-0 z-50 flex w-80 flex-col bg-card border-r border-border shadow-lg transition-transform duration-200 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full",
          className
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

          <TabsContent value="my-projects" className="flex-1 overflow-y-auto pt-3">
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              No projects yet
            </div>
          </TabsContent>

          <TabsContent value="shared" className="flex-1 overflow-y-auto pt-3">
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              No shared projects
            </div>
          </TabsContent>
        </Tabs>

        {/* Footer — New Project button */}
        <div className="shrink-0 border-t border-border p-3">
          <button
            type="button"
            className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            New Project
          </button>
        </div>
      </aside>
    </>
  )
}
