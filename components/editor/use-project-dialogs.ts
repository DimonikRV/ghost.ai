"use client"

import { useState, useCallback, useRef, useEffect } from "react"

type DialogType = "create" | "rename" | "delete" | null

interface ProjectData {
  id: string
  name: string
  slug: string
  owned: boolean
}

export interface UseProjectDialogsReturn {
  activeDialog: DialogType
  selectedProject: ProjectData | null
  createName: string
  createSlug: string
  renameName: string
  isLoading: boolean
  openCreate: () => void
  openRename: (project: ProjectData) => void
  openDelete: (project: ProjectData) => void
  closeDialogs: () => void
  setCreateName: (name: string) => void
  setRenameName: (name: string) => void
  handleCreateSubmit: () => void
  handleRenameSubmit: () => void
  handleDeleteSubmit: () => void
}

/**
 * Unicode-aware slugify: strips diacritics, keeps Unicode letters/digits,
 * produces clean hyphenated slugs.
 */
export function slugify(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip diacritics
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}\s-]/gu, "") // Unicode letters + digits
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") // trim leading/trailing dashes
}

/** Shared helper: runs fn while managing isLoading state. */
function useWithLoading(
  closeDialogs: () => void,
): [(fn: () => Promise<void> | void) => void, boolean] {
  const [isLoading, setIsLoading] = useState(false)
  const submittingRef = useRef(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    return () => {
      clearTimeout(timerRef.current)
    }
  }, [])

  const withLoading = useCallback(
    (fn: () => Promise<void> | void) => {
      if (submittingRef.current) return
      submittingRef.current = true
      setIsLoading(true)
      const result = fn()
      // If fn returns a promise, await it; otherwise use setTimeout mock
      if (result instanceof Promise) {
        result
          .then(() => {
            setIsLoading(false)
            submittingRef.current = false
            closeDialogs()
          })
          .catch(() => {
            setIsLoading(false)
            submittingRef.current = false
          })
      } else {
        timerRef.current = setTimeout(() => {
          setIsLoading(false)
          submittingRef.current = false
          closeDialogs()
        }, 300)
      }
    },
    [closeDialogs],
  )

  return [withLoading, isLoading]
}

// Mock project data
const MOCK_PROJECTS: ProjectData[] = [
  { id: "1", name: "My Workspace", slug: "my-workspace", owned: true },
  { id: "2", name: "Shared Design", slug: "shared-design", owned: false },
]

export function useProjectDialogs(): UseProjectDialogsReturn {
  const [activeDialog, setActiveDialog] = useState<DialogType>(null)
  const [selectedProject, setSelectedProject] = useState<ProjectData | null>(null)
  const [createName, setCreateName] = useState("")
  const [renameName, setRenameName] = useState("")

  const createSlug = slugify(createName)

  const openCreate = useCallback(() => {
    setCreateName("")
    setActiveDialog("create")
  }, [])

  const openRename = useCallback((project: ProjectData) => {
    setSelectedProject(project)
    setRenameName(project.name)
    setActiveDialog("rename")
  }, [])

  const openDelete = useCallback((project: ProjectData) => {
    setSelectedProject(project)
    setActiveDialog("delete")
  }, [])

  const closeDialogs = useCallback(() => {
    setActiveDialog(null)
    setSelectedProject(null)
    setCreateName("")
    setRenameName("")
  }, [])

  const [withLoading, isLoading] = useWithLoading(closeDialogs)

  const handleCreateSubmit = useCallback(() => {
    if (!createName.trim()) return
    // Mock: no API call — when wired, replace with:
    // withLoading(async () => { await api.createProject(createName) })
    withLoading(() => { })
  }, [createName, withLoading])

  const handleRenameSubmit = useCallback(() => {
    if (!renameName.trim() || !selectedProject) return
    // Mock: no API call
    withLoading(() => { })
  }, [renameName, selectedProject, withLoading])

  const handleDeleteSubmit = useCallback(() => {
    if (!selectedProject) return
    // Mock: no API call
    withLoading(() => { })
  }, [selectedProject, withLoading])

  return {
    activeDialog,
    selectedProject,
    createName,
    createSlug,
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
  }
}

export type { ProjectData }
export { MOCK_PROJECTS }
