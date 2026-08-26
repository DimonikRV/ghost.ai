// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

vi.mock("@/components/editor/editor-navbar", () => ({
  EditorNavbar: ({ sidebarOpen, onToggleSidebar }: any) => (
    <nav data-testid="navbar" data-sidebar-open={String(sidebarOpen)}>
      <button onClick={onToggleSidebar}>Toggle</button>
    </nav>
  ),
}));

vi.mock("@/components/editor/project-sidebar", () => ({
  ProjectSidebar: (props: any) => (
    <div data-testid="sidebar" data-is-open={String(props.isOpen)} />
  ),
}));

vi.mock("@/components/editor/project-actions-context", () => {
  const React = require("react");
  const ProjectActionsContext = React.createContext(null);
  return {
    ProjectActionsProvider: ({ children }: any) => (
      <ProjectActionsContext.Provider
        value={{
          activeDialog: null,
          selectedProject: null,
          createName: "",
          createRoomId: "",
          renameName: "",
          createError: null,
          renameError: null,
          createSuggestions: [],
          renameSuggestions: [],
          isLoading: false,
          closeDialogs: vi.fn(),
          setCreateName: vi.fn(),
          setRenameName: vi.fn(),
          handleCreateSubmit: vi.fn(),
          handleRenameSubmit: vi.fn(),
          handleDeleteSubmit: vi.fn(),
          openCreate: vi.fn(),
          openRename: vi.fn(),
          openDelete: vi.fn(),
        }}
      >
        {children}
      </ProjectActionsContext.Provider>
    ),
    useProjectActionsContext: () => {
      const ctx = React.useContext(ProjectActionsContext);
      if (!ctx) throw new Error("Not in provider");
      return ctx;
    },
  };
});

vi.mock("@/components/editor/create-project-dialog", () => ({
  CreateProjectDialog: (props: any) => (
    <div data-testid="create-dialog" data-open={String(props.open)} />
  ),
}));

vi.mock("@/components/editor/rename-project-dialog", () => ({
  RenameProjectDialog: (props: any) => (
    <div data-testid="rename-dialog" data-open={String(props.open)} />
  ),
}));

vi.mock("@/components/editor/delete-project-dialog", () => ({
  DeleteProjectDialog: (props: any) => (
    <div data-testid="delete-dialog" data-open={String(props.open)} />
  ),
}));

import { EditorShell } from "@/components/editor/editor-shell";

describe("EditorShell", () => {
  const ownedProjects = [{ id: "1", name: "Owned", description: null, status: "active", createdAt: "", updatedAt: "" }];
  const sharedProjects = [{ id: "2", name: "Shared", description: null, status: "active", createdAt: "", updatedAt: "" }];

  it("renders children", () => {
    render(
      <EditorShell ownedProjects={ownedProjects} sharedProjects={sharedProjects}>
        <div data-testid="child-content">Hello</div>
      </EditorShell>
    );
    expect(screen.getByTestId("child-content")).toBeInTheDocument();
    expect(screen.getByText("Hello")).toBeInTheDocument();
  });

  it("renders EditorNavbar", () => {
    render(
      <EditorShell ownedProjects={ownedProjects} sharedProjects={sharedProjects}>
        <div />
      </EditorShell>
    );
    expect(screen.getByTestId("navbar")).toBeInTheDocument();
  });

  it("renders ProjectSidebar", () => {
    render(
      <EditorShell ownedProjects={ownedProjects} sharedProjects={sharedProjects}>
        <div />
      </EditorShell>
    );
    expect(screen.getByTestId("sidebar")).toBeInTheDocument();
  });

  it("shows create dialog", () => {
    render(
      <EditorShell ownedProjects={ownedProjects} sharedProjects={sharedProjects}>
        <div />
      </EditorShell>
    );
    expect(screen.getAllByTestId("create-dialog").length).toBeGreaterThanOrEqual(1);
  });

  it("does not render rename/delete dialogs when no project selected", () => {
    render(
      <EditorShell ownedProjects={ownedProjects} sharedProjects={sharedProjects}>
        <div />
      </EditorShell>
    );
    expect(screen.queryAllByTestId("rename-dialog")).toHaveLength(0);
    expect(screen.queryAllByTestId("delete-dialog")).toHaveLength(0);
  });
});
