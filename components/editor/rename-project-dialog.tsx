"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/editor/dialog-pattern";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import type { ProjectItem } from "@/hooks/use-project-actions";

interface RenameProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: ProjectItem;
  name: string;
  onNameChange: (name: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
  error?: string | null;
}

export function RenameProjectDialog({
  open,
  onOpenChange,
  project,
  name,
  onNameChange,
  onSubmit,
  isLoading,
  error,
}: RenameProjectDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rename Project</DialogTitle>
          <DialogDescription id="rename-current-name">
            Current name: <span className="font-medium text-foreground">{project.name}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="py-2">
          <Input
            id="rename-project-name"
            placeholder="New project name"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            maxLength={80}
            autoFocus
            disabled={isLoading}
            aria-describedby="rename-current-name"
            onKeyDown={(e) => {
              if (e.key === "Enter" && name.trim() && !isLoading) {
                e.preventDefault();
                onSubmit();
              }
            }}
          />
          {error && (
            <p role="alert" className="text-xs text-destructive">
              {error}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={!name.trim() || isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Rename
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
