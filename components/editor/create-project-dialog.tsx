"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/editor/dialog-pattern"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2 } from "lucide-react"

interface CreateProjectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  name: string
  slug: string
  onNameChange: (name: string) => void
  onSubmit: () => void
  isLoading: boolean
}

export function CreateProjectDialog({
  open,
  onOpenChange,
  name,
  slug,
  onNameChange,
  onSubmit,
  isLoading,
}: CreateProjectDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Project</DialogTitle>
          <DialogDescription>
            Give your new workspace a name.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <Input
            id="create-project-name"
            placeholder="Project name"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            maxLength={80}
            autoFocus
            disabled={isLoading}
            aria-describedby="create-slug-preview"
            onKeyDown={(e) => {
              if (e.key === "Enter" && name.trim() && !isLoading) {
                e.preventDefault()
                onSubmit()
              }
            }}
          />
          {slug && (
            <p id="create-slug-preview" className="text-xs text-muted-foreground">
              Slug: <span className="font-mono">{slug}</span>
            </p>
          )}
          {!slug && name.trim() && (
            <p id="create-slug-preview" className="text-xs text-destructive">
              Name contains only special characters. Use letters, numbers, or spaces.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={!name.trim() || isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
