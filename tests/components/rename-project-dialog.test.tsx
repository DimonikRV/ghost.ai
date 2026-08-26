// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RenameProjectDialog } from "@/components/editor/rename-project-dialog";

const mockProject = {
  id: "proj_123",
  name: "Old Name",
  description: null,
  status: "DRAFT",
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
};

describe("RenameProjectDialog", () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    project: mockProject,
    name: "Old Name",
    onNameChange: vi.fn(),
    onSubmit: vi.fn(),
    isLoading: false,
    error: null,
    suggestions: [],
  };

  it("renders the dialog title", () => {
    render(<RenameProjectDialog {...defaultProps} />);
    expect(screen.getByText("Rename Project")).toBeInTheDocument();
  });

  it("pre-fills the input with current name", () => {
    render(<RenameProjectDialog {...defaultProps} />);
    const inputs = screen.getAllByPlaceholderText("New project name");
    expect(inputs.length).toBeGreaterThanOrEqual(1);
    expect(inputs[0]).toHaveValue("Old Name");
  });

  it("calls onSubmit when Rename is clicked", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<RenameProjectDialog {...defaultProps} onSubmit={onSubmit} />);
    const buttons = screen.getAllByRole("button", { name: /^Rename$/ });
    await user.click(buttons[buttons.length - 1]);
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("calls onOpenChange when Cancel is clicked", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(<RenameProjectDialog {...defaultProps} onOpenChange={onOpenChange} />);
    const buttons = screen.getAllByRole("button", { name: /^Cancel$/ });
    await user.click(buttons[buttons.length - 1]);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("shows error message when error is provided", () => {
    render(<RenameProjectDialog {...defaultProps} error="Name taken" />);
    expect(screen.getByText("Name taken")).toBeInTheDocument();
  });
});
