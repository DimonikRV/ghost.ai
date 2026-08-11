"use client";

import { useState, useCallback, useEffect } from "react";
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
import { Loader2, Copy, CopyCheck, Mail, UserMinus } from "lucide-react";

export interface Collaborator {
  id: string;
  email: string;
  createdAt: string;
  displayName?: string;
  avatarUrl?: string;
}

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  isOwner: boolean;
  collaborators: Collaborator[];
  onInvite: (email: string) => Promise<void>;
  onRemove: (collaboratorId: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export function ShareDialog({
  open,
  onOpenChange,
  projectId,
  isOwner,
  collaborators,
  onInvite,
  onRemove,
  isLoading,
  error: parentError,
}: ShareDialogProps) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const displayError = parentError || error;

  const projectUrl = typeof window !== "undefined"
    ? `${window.location.origin}/editor/${projectId}`
    : `/editor/${projectId}`;

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (!open) {
      const timer = setTimeout(() => {
        setEmail("");
        setError(null);
        setCopied(false);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [open]);

  const handleInvite = useCallback(async () => {
    if (!email.trim()) {
      setError("Email is required");
      return;
    }
    setError(null);
    await onInvite(email.trim());
    setEmail("");
  }, [email, onInvite]);

  const handleRemove = useCallback(
    async (collaboratorId: string) => {
      await onRemove(collaboratorId);
    },
    [onRemove]
  );

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(projectUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = projectUrl;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [projectUrl]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && email.trim() && !isLoading) {
        e.preventDefault();
        handleInvite();
      }
    },
    [email, isLoading, handleInvite]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share this project</DialogTitle>
          <DialogDescription>
            {isOwner
              ? "Invite collaborators to work on this project."
              : "People with access to this project."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Invite section — owner only */}
          {isOwner && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Invite by email
              </label>
              <div className="flex gap-2">
                <Input
                  placeholder="collaborator@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError(null);
                  }}
                  onKeyDown={handleKeyDown}
                  disabled={isLoading}
                  type="email"
                  autoFocus
                />
                <Button
                  onClick={handleInvite}
                  disabled={isLoading || !email.trim()}
                  size="sm"
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Invite
                </Button>
              </div>
              {displayError && (
                <p className="text-xs text-destructive">{displayError}</p>
              )}
            </div>
          )}

          {/* Copy link section — owner only */}
          {isOwner && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Project link
              </label>
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={projectUrl}
                  className="text-xs font-mono"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyLink}
                  className="shrink-0"
                >
                  {copied ? (
                    <>
                      <CopyCheck className="mr-2 h-4 w-4 text-green-500" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="mr-2 h-4 w-4" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Collaborators list */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              {collaborators.length === 0
                ? "No collaborators yet"
                : `Collaborators (${collaborators.length})`}
            </label>
            {collaborators.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
                <Mail className="h-8 w-8 mb-2 opacity-50" />
                <p className="text-xs">
                  {isOwner
                    ? "Invite someone to get started"
                    : "No one else has access yet"}
                </p>
              </div>
            ) : (
              <ul className="space-y-2 max-h-48 overflow-y-auto">
                {collaborators.map((c) => (
                  <li
                    key={c.id}
                    className="flex items-center gap-3 rounded-md border border-border bg-card px-3 py-2"
                  >
                    {/* Avatar or fallback */}
                    {c.avatarUrl ? (
                      <img
                        src={c.avatarUrl}
                        alt=""
                        className="h-6 w-6 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-6 w-6 rounded-full bg-accent flex items-center justify-center">
                        <span className="text-xs font-medium text-foreground">
                          {(c.displayName || c.email).charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}

                    {/* Name + email */}
                    <div className="flex-1 min-w-0">
                      {c.displayName ? (
                        <p className="text-sm font-medium text-foreground truncate">
                          {c.displayName}
                        </p>
                      ) : null}
                      <p className="text-xs text-muted-foreground truncate">
                        {c.email}
                      </p>
                    </div>

                    {/* Remove button — owner only */}
                    {isOwner && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={() => handleRemove(c.id)}
                        disabled={isLoading}
                        aria-label={`Remove ${c.displayName || c.email}`}
                      >
                        <UserMinus className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
