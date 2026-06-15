"use client"

import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"

interface EditorHomeProps {
  onOpenCreate: () => void
}

export function EditorHome({ onOpenCreate }: EditorHomeProps) {
  return (
    <div className="flex min-h-[calc(100vh-3rem)] flex-col items-center justify-center px-4">
      <h1 className="text-xl font-medium">Create a project or open an existing one</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Start a new architecture workspace, or choose a project from the sidebar.
      </p>
      <Button className="mt-6" onClick={onOpenCreate}>
        <Plus className="mr-2 h-4 w-4" />
        New Project
      </Button>
    </div>
  )
}
