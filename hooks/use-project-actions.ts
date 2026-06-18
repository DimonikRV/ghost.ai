"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";

type DialogType = "create" | "rename" | "delete" | null;

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

/** Unicode-aware slugify: strips diacritics, keeps letters/digits. */
export function slugify(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
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
        .catch(() => {
          setIsLoading(false);
          submittingRef.current = false;
        });
    },
    [onSuccess],
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

  const createSlug = slugify(createName);
  const createRoomId = createSlug ? `${createSlug}-${createSuffix}` : "";

  const closeDialogs = useCallback(() => {
    setActiveDialog(null);
    setSelectedProject(null);
    setCreateName("");
    setRenameName("");
  }, []);

  const openCreate = useCallback(() => {
    setCreateName("");
    setActiveDialog("create");
  }, []);

  const openRename = useCallback((project: ProjectItem) => {
    setSelectedProject(project);
    setRenameName(project.name);
    setActiveDialog("rename");
  }, []);

  const openDelete = useCallback((project: ProjectItem) => {
    setSelectedProject(project);
    setActiveDialog("delete");
  }, []);

  const handleProjectsChanged = useCallback(() => {
    router.refresh();
  }, [router]);

  const [withLoading, isLoading] = useWithLoading(closeDialogs);

  const handleCreateSubmit = useCallback(async () => {
    if (!createName.trim()) return;

    const submit = async () => {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: createName.trim() }),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({ error: "Failed to create project" }));
        throw new Error(error.error ?? "Failed to create project");
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
        const error = await res.json().catch(() => ({ error: "Failed to rename project" }));
        throw new Error(error.error ?? "Failed to rename project");
      }

      handleProjectsChanged();
    };

    withLoading(submit);
  }, [renameName, selectedProject, withLoading, handleProjectsChanged]);

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

    withLoading(submit);
  }, [selectedProject, withLoading, pathname, router, handleProjectsChanged]);

  return {
    activeDialog,
    selectedProject,
    createName,
    createRoomId,
    renameName,
    isLoading,
    openCreate,
    openRename,
    openDelete,
    closeDialogs,
    setCreateName,
    setRenameName,
    handleCreateSubmit,
    handleRenameSubmit,
    handleDeleteSubmit,
    onProjectsChanged: handleProjectsChanged,
  };
}
