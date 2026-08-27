// @vitest-environment jsdom

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

const mockPush = vi.fn();
const mockRefresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
  usePathname: () => "/editor/proj_current",
}));

vi.mock("@/lib/slugify", () => ({
  slugify: (name: string) =>
    name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, ""),
}));

const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockReset();
  mockPush.mockReset();
  mockRefresh.mockReset();
});

import { useProjectActions } from "@/hooks/use-project-actions";

function renderActions() {
  return renderHook(() => useProjectActions());
}

describe("useProjectActions", () => {
  it("starts with no active dialog", () => {
    const { result } = renderActions();
    expect(result.current.activeDialog).toBeNull();
    expect(result.current.selectedProject).toBeNull();
  });

  it("opens the create dialog", () => {
    const { result } = renderActions();
    act(() => result.current.openCreate());
    expect(result.current.activeDialog).toBe("create");
  });

  it("closes dialogs and resets state", () => {
    const { result } = renderActions();
    act(() => result.current.openCreate());
    expect(result.current.activeDialog).toBe("create");
    act(() => result.current.closeDialogs());
    expect(result.current.activeDialog).toBeNull();
    expect(result.current.createName).toBe("");
  });

  it("opens the rename dialog with the project name", () => {
    const { result } = renderActions();
    const project = { id: "p1", name: "My Project", description: null, status: "active", createdAt: "", updatedAt: "" };
    act(() => result.current.openRename(project));
    expect(result.current.activeDialog).toBe("rename");
    expect(result.current.renameName).toBe("My Project");
    expect(result.current.selectedProject).toEqual(project);
  });

  it("opens the delete dialog", () => {
    const { result } = renderActions();
    const project = { id: "p2", name: "Delete Me", description: null, status: "active", createdAt: "", updatedAt: "" };
    act(() => result.current.openDelete(project));
    expect(result.current.activeDialog).toBe("delete");
    expect(result.current.selectedProject).toEqual(project);
  });

  it("generates a room ID from the project name", () => {
    const { result } = renderActions();
    act(() => result.current.setCreateName("My Cool Project"));
    expect(result.current.createRoomId).toMatch(/^my-cool-project-[a-z0-9]{4}$/);
  });

  it("room ID is empty when name is empty", () => {
    const { result } = renderActions();
    expect(result.current.createRoomId).toBe("");
  });

  it("handleCreateSubmit makes POST to /api/projects", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: "new_proj", name: "New" }),
    });

    const { result } = renderActions();
    act(() => result.current.setCreateName("New Project"));

    await act(async () => {
      await result.current.handleCreateSubmit();
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/projects",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ name: "New Project" }),
      }),
    );
  });

  it("handleCreateSubmit does not POST when the name has invalid characters", async () => {
    const { result } = renderActions();
    act(() => result.current.setCreateName("Привет!"));

    await act(async () => {
      await result.current.handleCreateSubmit();
    });

    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.current.createError).toContain("Latin letters");
  });

  it("handleRenameSubmit does not PATCH when the name has invalid characters", async () => {
    const { result } = renderActions();
    const project = { id: "p1", name: "Old", description: null, status: "active", createdAt: "", updatedAt: "" };
    act(() => result.current.openRename(project));
    act(() => result.current.setRenameName("Bad!! Name"));

    await act(async () => {
      await result.current.handleRenameSubmit();
    });

    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.current.renameError).toContain("Latin letters");
  });

  it("handleRenameSubmit makes PATCH to /api/projects/:id", async () => {
    fetchMock.mockResolvedValue({ ok: true, json: () => Promise.resolve({}) });

    const { result } = renderActions();
    const project = { id: "p1", name: "Old", description: null, status: "active", createdAt: "", updatedAt: "" };
    act(() => result.current.openRename(project));
    act(() => result.current.setRenameName("New Name"));

    await act(async () => {
      await result.current.handleRenameSubmit();
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/projects/p1",
      expect.objectContaining({ method: "PATCH" }),
    );
  });

  it("handleDeleteSubmit makes DELETE to /api/projects/:id", async () => {
    fetchMock.mockResolvedValue({ ok: true, json: () => Promise.resolve({}) });

    const { result } = renderActions();
    const project = { id: "p3", name: "Doomed", description: null, status: "active", createdAt: "", updatedAt: "" };
    act(() => result.current.openDelete(project));

    await act(async () => {
      await result.current.handleDeleteSubmit();
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/projects/p3",
      expect.objectContaining({ method: "DELETE" }),
    );
  });

  it("handles API error and sets error message on create", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: "Name taken", suggestions: ["Name 2", "Name 3"] }),
    });

    const { result } = renderActions();
    act(() => result.current.setCreateName("Taken Name"));

    await act(async () => {
      await result.current.handleCreateSubmit();
    });

    expect(result.current.createError).toBe("Name taken");
    expect(result.current.createSuggestions).toEqual(["Name 2", "Name 3"]);
  });

  it("handles API error on rename", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: "Rename failed", suggestions: ["Alt 1"] }),
    });

    const { result } = renderActions();
    const project = { id: "p1", name: "X", description: null, status: "active", createdAt: "", updatedAt: "" };
    act(() => result.current.openRename(project));
    act(() => result.current.setRenameName("Y"));

    await act(async () => {
      await result.current.handleRenameSubmit();
    });

    expect(result.current.renameError).toBe("Rename failed");
    expect(result.current.renameSuggestions).toEqual(["Alt 1"]);
  });

  it("does not submit create when name is empty", async () => {
    const { result } = renderActions();
    await act(async () => {
      await result.current.handleCreateSubmit();
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("does not submit rename when name is empty or no project selected", async () => {
    const { result } = renderActions();
    await act(async () => {
      await result.current.handleRenameSubmit();
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("does not submit delete when no project selected", async () => {
    const { result } = renderActions();
    await act(async () => {
      await result.current.handleDeleteSubmit();
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("clears error when name changes", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: "Name taken", suggestions: [] }),
    });

    const { result } = renderActions();
    act(() => result.current.setCreateName("Bad"));

    await act(async () => {
      await result.current.handleCreateSubmit();
    });

    expect(result.current.createError).toBeTruthy();

    act(() => result.current.setCreateName("Good"));
    expect(result.current.createError).toBeNull();
    expect(result.current.createSuggestions).toEqual([]);
  });
});
