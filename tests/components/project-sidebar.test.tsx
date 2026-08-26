// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

vi.mock("@/lib/slugify", () => ({
  slugify: (s: string) => s.toLowerCase().replace(/\s+/g, "-"),
}));

import { ProjectSidebar } from "@/components/editor/project-sidebar";

describe("ProjectSidebar", () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    ownedProjects: [
      {
        id: "p1",
        name: "Project Alpha",
        description: null,
        status: "active",
        createdAt: "",
        updatedAt: "",
      },
    ],
    sharedProjects: [
      {
        id: "p2",
        name: "Project Beta",
        description: null,
        status: "active",
        createdAt: "",
        updatedAt: "",
      },
    ],
    onRename: vi.fn(),
    onDelete: vi.fn(),
    onCreate: vi.fn(),
    onOpenProject: vi.fn(),
  };

  it("shows sidebar content when isOpen=true", () => {
    render(<ProjectSidebar {...defaultProps} />);
    expect(screen.getByText("Projects")).toBeInTheDocument();
  });

  it("does not show sidebar content when isOpen=false", () => {
    render(<ProjectSidebar {...defaultProps} isOpen={false} />);
    const aside = screen.getByText("Projects").closest("aside");
    expect(aside).toHaveClass("-translate-x-full");
  });

  it("shows owned projects", () => {
    render(<ProjectSidebar {...defaultProps} />);
    expect(screen.getByText("Project Alpha")).toBeInTheDocument();
  });

  it("shows shared projects", () => {
    render(<ProjectSidebar {...defaultProps} />);
    fireEvent.click(screen.getByRole("tab", { name: "Shared" }));
    expect(screen.getByText("Project Beta")).toBeInTheDocument();
  });

  it("calls onCreate when New Project button clicked", () => {
    const onCreate = vi.fn();
    render(<ProjectSidebar {...defaultProps} onCreate={onCreate} />);
    fireEvent.click(screen.getByText("New Project"));
    expect(onCreate).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when close button clicked", () => {
    const onClose = vi.fn();
    render(<ProjectSidebar {...defaultProps} onClose={onClose} />);
    fireEvent.click(screen.getByRole("button", { name: /Close sidebar/ }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onOpenProject when a project is clicked", () => {
    const onOpenProject = vi.fn();
    render(<ProjectSidebar {...defaultProps} onOpenProject={onOpenProject} />);
    fireEvent.click(screen.getByText("Project Alpha"));
    expect(onOpenProject).toHaveBeenCalledWith(defaultProps.ownedProjects[0]);
  });

  it("shows owned and shared tab triggers", () => {
    render(<ProjectSidebar {...defaultProps} />);
    expect(screen.getByText("My Projects")).toBeInTheDocument();
    expect(screen.getByText("Shared")).toBeInTheDocument();
  });

  it("shows empty state for owned projects", () => {
    render(<ProjectSidebar {...defaultProps} ownedProjects={[]} />);
    expect(screen.getByText("No projects yet.")).toBeInTheDocument();
  });

  it("shows empty state for shared projects", () => {
    render(<ProjectSidebar {...defaultProps} sharedProjects={[]} />);
    fireEvent.click(screen.getByRole("tab", { name: "Shared" }));
    expect(screen.getByText("No shared projects.")).toBeInTheDocument();
  });

  it("opens context menu on project actions button", () => {
    render(<ProjectSidebar {...defaultProps} />);
    const actionBtns = screen.getAllByRole("button", {
      name: /Project actions/,
    });
    fireEvent.click(actionBtns[0]);
    expect(screen.getByText("Rename")).toBeInTheDocument();
    expect(screen.getByText("Delete")).toBeInTheDocument();
  });

  it("calls onRename from context menu", () => {
    const onRename = vi.fn();
    render(<ProjectSidebar {...defaultProps} onRename={onRename} />);
    const actionBtns = screen.getAllByRole("button", {
      name: /Project actions/,
    });
    fireEvent.click(actionBtns[0]);
    fireEvent.click(screen.getByText("Rename"));
    expect(onRename).toHaveBeenCalledWith(defaultProps.ownedProjects[0]);
  });

  it("calls onDelete from context menu", () => {
    const onDelete = vi.fn();
    render(<ProjectSidebar {...defaultProps} onDelete={onDelete} />);
    const actionBtns = screen.getAllByRole("button", {
      name: /Project actions/,
    });
    fireEvent.click(actionBtns[0]);
    fireEvent.click(screen.getByText("Delete"));
    expect(onDelete).toHaveBeenCalledWith(defaultProps.ownedProjects[0]);
  });
});
