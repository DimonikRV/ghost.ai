// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@/hooks/use-project-actions", () => ({
  useProjectActions: vi.fn().mockReturnValue({
    activeDialog: null,
    selectedProject: null,
    createName: "",
    renameName: "",
    createError: null,
    renameError: null,
    createSuggestions: [],
    renameSuggestions: [],
    isCreating: false,
    isRenaming: false,
    openCreate: vi.fn(),
    openRename: vi.fn(),
    openDelete: vi.fn(),
    closeDialog: vi.fn(),
    setCreateName: vi.fn(),
    setRenameName: vi.fn(),
    handleCreate: vi.fn(),
    handleRename: vi.fn(),
    handleDelete: vi.fn(),
  }),
}));

import {
  ProjectActionsProvider,
  useProjectActionsContext,
} from "@/components/editor/project-actions-context";

function TestConsumer() {
  const ctx = useProjectActionsContext();
  return (
    <div data-testid="context-value">
      {ctx.activeDialog ?? "none"}
      <span data-testid="open-create-type">{typeof ctx.openCreate}</span>
    </div>
  );
}

function ConsumerOutsideProvider() {
  useProjectActionsContext();
  return null;
}

describe("ProjectActionsProvider", () => {
  it("provides context to children", () => {
    render(
      <ProjectActionsProvider>
        <TestConsumer />
      </ProjectActionsProvider>
    );
    expect(screen.getByTestId("context-value")).toHaveTextContent("none");
    expect(screen.getByTestId("open-create-type")).toHaveTextContent("function");
  });

  it("throws when useProjectActionsContext used outside provider", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<ConsumerOutsideProvider />)).toThrow(
      "useProjectActionsContext must be used within ProjectActionsProvider"
    );
    spy.mockRestore();
  });

  it("renders children correctly", () => {
    render(
      <ProjectActionsProvider>
        <span data-testid="child">hello</span>
      </ProjectActionsProvider>
    );
    expect(screen.getByTestId("child")).toHaveTextContent("hello");
  });
});
