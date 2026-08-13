"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { slugify } from "@/lib/slugify";

type DialogType = "create" | "rename" | "delete" | null;

interface NameError extends Error {
  suggestions?: string[];
}

export interface ProjectItem {
  id: string;
  name: string;
  description: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface UseProjectActionsReturn {
  activeDialog: DialogType;
  selectedProject: ProjectItem | null;
  createName: string;
  createRoomId: string;
  renameName: string;
  createError: string | null;
  renameError: string | null;
  createSuggestions: string[];
  renameSuggestions: string[];
  isLoading: boolean;
  openCreate: () => void;
  openRename: (project: ProjectItem) => void;
  openDelete: (project: ProjectItem) => void;
  closeDialogs: () => void;
  setCreateName: (name: string) => void;
  setRenameName: (name: string) => void;
  handleCreateSubmit: () => Promise<void>;
  handleRenameSubmit: () => Promise<void>;
  handleDeleteSubmit: () => Promise<void>;
  onProjectsChanged: () => void;
}

/** Generate a short unique suffix (4 alphanumeric chars). */
function generateSuffix(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 4; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

/** Shared helper: runs fn while managing isLoading state. */
function useWithLoading(
  onSuccess: () => void,
  onError?: (error: unknown) => void,
): [(fn: () => Promise<void>) => void, boolean] {
  const [isLoading, setIsLoading] = useState(false);
  const submittingRef = useRef(false);

  const withLoading = useCallback(
    (fn: () => Promise<void>) => {
      if (submittingRef.current) return;
      submittingRef.current = true;
      setIsLoading(true);
      fn()
        .then(() => {
          setIsLoading(false);
          submittingRef.current = false;
          onSuccess();
        })
        .catch((error) => {
          setIsLoading(false);
          submittingRef.current = false;
          onError?.(error);
        });
    },
    [onSuccess, onError],
  );

  return [withLoading, isLoading];
}

export function useProjectActions(): UseProjectActionsReturn {
  const router = useRouter();
  const pathname = usePathname();

  const [activeDialog, setActiveDialog] = useState<DialogType>(null);
  const [selectedProject, setSelectedProject] = useState<ProjectItem | null>(null);
  const [createName, setCreateName] = useState("");
  const [createSuffix] = useState(() => generateSuffix());
  const [renameName, setRenameName] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);
  const [renameError, setRenameError] = useState<string | null>(null);
  const [createSuggestions, setCreateSuggestions] = useState<string[]>([]);
  const [renameSuggestions, setRenameSuggestions] = useState<string[]>([]);

  const createSlug = slugify(createName);
  const createRoomId = createSlug ? `${createSlug}-${createSuffix}` : "";

  const closeDialogs = useCallback(() => {
    setActiveDialog(null);
    setSelectedProject(null);
    setCreateName("");
    setRenameName("");
    setCreateError(null);
    setRenameError(null);
    setCreateSuggestions([]);
    setRenameSuggestions([]);
  }, []);

  const openCreate = useCallback(() => {
    setCreateName("");
    setCreateError(null);
    setCreateSuggestions([]);
    setActiveDialog("create");
  }, []);

  const openRename = useCallback((project: ProjectItem) => {
    setSelectedProject(project);
    setRenameName(project.name);
    setRenameError(null);
    setRenameSuggestions([]);
    setActiveDialog("rename");
  }, []);

  const openDelete = useCallback((project: ProjectItem) => {
    setSelectedProject(project);
    setActiveDialog("delete");
  }, []);

  const handleProjectsChanged = useCallback(() => {
    router.refresh();
  }, [router]);

  const handleCreateNameChange = useCallback((name: string) => {
    setCreateName(name);
    setCreateError(null);
    setCreateSuggestions([]);
  }, []);

  const handleRenameNameChange = useCallback((name: string) => {
    setRenameName(name);
    setRenameError(null);
    setRenameSuggestions([]);
  }, []);

  const [withLoading, createLoading] = useWithLoading(closeDialogs, (error) => {
    setCreateError(error instanceof Error ? error.message : "Failed to create project");
    setCreateSuggestions(
      error instanceof Error && (error as NameError).suggestions
        ? (error as NameError).suggestions!
        : [],
    );
  });

  const [withRenameLoading, renameLoading] = useWithLoading(closeDialogs, (error) => {
    setRenameError(error instanceof Error ? error.message : "Failed to rename project");
    setRenameSuggestions(
      error instanceof Error && (error as NameError).suggestions
        ? (error as NameError).suggestions!
        : [],
    );
  });

  const [withDeleteLoading, deleteLoading] = useWithLoading(closeDialogs);

  const isLoading = createLoading || renameLoading || deleteLoading;

  const handleCreateSubmit = useCallback(async () => {
    if (!createName.trim()) return;

    const submit = async () => {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: createName.trim() }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: "Failed to create project" }));
        const err = new Error(body.error ?? "Failed to create project") as NameError;
        err.suggestions = body.suggestions ?? [];
        throw err;
      }

      const project = await res.json();
      // Navigate to the new workspace
      router.push(`/editor/${project.id}`);
    };

    withLoading(submit);
  }, [createName, withLoading, router]);

  const handleRenameSubmit = useCallback(async () => {
    if (!renameName.trim() || !selectedProject) return;

    const submit = async () => {
      const res = await fetch(`/api/projects/${selectedProject.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: renameName.trim() }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: "Failed to rename project" }));
        const err = new Error(body.error ?? "Failed to rename project") as NameError;
        err.suggestions = body.suggestions ?? [];
        throw err;
      }

      handleProjectsChanged();
    };

    withRenameLoading(submit);
  }, [renameName, selectedProject, withRenameLoading, handleProjectsChanged]);

  const handleDeleteSubmit = useCallback(async () => {
    if (!selectedProject) return;

    const targetId = selectedProject.id;

    const submit = async () => {
      const res = await fetch(`/api/projects/${targetId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({ error: "Failed to delete project" }));
        throw new Error(error.error ?? "Failed to delete project");
      }

      // If deleting the active workspace, redirect to /editor
      const currentProjectId = pathname.split("/").pop();
      if (currentProjectId === targetId) {
        router.push("/editor");
      } else {
        handleProjectsChanged();
      }
    };

    withDeleteLoading(submit);
  }, [selectedProject, withDeleteLoading, pathname, router, handleProjectsChanged]);

  return {
    activeDialog,
    selectedProject,
    createName,
    createRoomId,
    renameName,
    createError,
    renameError,
    createSuggestions,
    renameSuggestions,
    isLoading,
    openCreate,
    openRename,
    openDelete,
    closeDialogs,
    setCreateName: handleCreateNameChange,
    setRenameName: handleRenameNameChange,
    handleCreateSubmit,
    handleRenameSubmit,
    handleDeleteSubmit,
    onProjectsChanged: handleProjectsChanged,
  };
}
