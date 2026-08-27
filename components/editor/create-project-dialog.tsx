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
import { projectNameError } from "@/lib/validate-project-name";

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  name: string;
  roomId: string;
  onNameChange: (name: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
  error?: string | null;
  suggestions?: string[];
}

export function CreateProjectDialog({
  open,
  onOpenChange,
  name,
  roomId,
  onNameChange,
  onSubmit,
  isLoading,
  error,
  suggestions = [],
}: CreateProjectDialogProps) {
  const nameError = name.trim() ? projectNameError(name.trim()) : null;
  const submitDisabled = !name.trim() || nameError !== null || isLoading;

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
            aria-describedby="create-room-id-preview"
            onKeyDown={(e) => {
              if (e.key === "Enter" && name.trim() && nameError === null && !isLoading) {
                e.preventDefault();
                onSubmit();
              }
            }}
          />
          {roomId && (
            <p id="create-room-id-preview" className="text-xs text-muted-foreground">
              Room ID: <span className="font-mono">{roomId}</span>
            </p>
          )}
          {!roomId && name.trim() && nameError && (
            <p id="create-room-id-preview" className="text-xs text-destructive">
              {nameError}
            </p>
          )}
          {error && (
            <p role="alert" className="text-xs text-destructive">
              {error}
            </p>
          )}
          {suggestions.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground">
                Suggested names:
              </p>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((suggestion) => (
                  <Button
                    key={suggestion}
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isLoading}
                    onClick={() => onNameChange(suggestion)}
                  >
                    {suggestion}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={submitDisabled}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
