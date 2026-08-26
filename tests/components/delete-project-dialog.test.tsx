// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DeleteProjectDialog } from "@/components/editor/delete-project-dialog";

const mockProject = {
  id: "proj_123",
  name: "My Test Project",
  description: null,
  status: "DRAFT",
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
};

describe("DeleteProjectDialog", () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    project: mockProject,
    onSubmit: vi.fn(),
    isLoading: false,
  };

  it("renders the dialog with project name", () => {
    render(<DeleteProjectDialog {...defaultProps} />);
    expect(screen.getByText("Delete Project")).toBeInTheDocument();
    expect(
      screen.getByText(/Are you sure you want to delete "My Test Project"/),
    ).toBeInTheDocument();
  });

  it("calls onSubmit when Delete is clicked", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<DeleteProjectDialog {...defaultProps} onSubmit={onSubmit} />);
    const deleteButtons = screen.getAllByRole("button", { name: /^Delete$/ });
    await user.click(deleteButtons[deleteButtons.length - 1]);
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("calls onOpenChange when Cancel is clicked", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(<DeleteProjectDialog {...defaultProps} onOpenChange={onOpenChange} />);
    const cancelButtons = screen.getAllByRole("button", { name: /^Cancel$/ });
    await user.click(cancelButtons[cancelButtons.length - 1]);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("disables Delete button when loading", () => {
    render(<DeleteProjectDialog {...defaultProps} isLoading={true} />);
    const deleteButtons = screen.getAllByRole("button", { name: /^Delete$/ });
    expect(deleteButtons[deleteButtons.length - 1]).toBeDisabled();
  });
});
