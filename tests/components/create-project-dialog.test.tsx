// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CreateProjectDialog } from "@/components/editor/create-project-dialog";

describe("CreateProjectDialog", () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    name: "",
    roomId: "",
    onNameChange: vi.fn(),
    onSubmit: vi.fn(),
    isLoading: false,
    error: null,
    suggestions: [],
  };

  it("renders the dialog title", () => {
    render(<CreateProjectDialog {...defaultProps} />);
    expect(screen.getByText("Create Project")).toBeInTheDocument();
  });

  it("renders the name input with placeholder", () => {
    render(<CreateProjectDialog {...defaultProps} />);
    const inputs = screen.getAllByPlaceholderText("Project name");
    expect(inputs.length).toBeGreaterThanOrEqual(1);
  });

  it("calls onNameChange when typing in input", async () => {
    const user = userEvent.setup();
    const onNameChange = vi.fn();
    render(<CreateProjectDialog {...defaultProps} onNameChange={onNameChange} />);
    const input = screen.getAllByPlaceholderText("Project name")[0];
    await user.type(input, "a");
    expect(onNameChange).toHaveBeenCalled();
  });

  it("calls onSubmit when Create button is clicked", () => {
    const onSubmit = vi.fn();
    render(<CreateProjectDialog {...defaultProps} name="My Project" onSubmit={onSubmit} />);
    fireEvent.click(screen.getByRole("button", { name: /^Create$/ }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("calls onOpenChange when Cancel is clicked", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(<CreateProjectDialog {...defaultProps} onOpenChange={onOpenChange} />);
    const buttons = screen.getAllByRole("button", { name: /^Cancel$/ });
    await user.click(buttons[buttons.length - 1]);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("shows error message when error is provided", () => {
    render(<CreateProjectDialog {...defaultProps} error="Name already exists" />);
    expect(screen.getByRole("alert")).toHaveTextContent("Name already exists");
  });

  it("disables Create button when isLoading is true", () => {
    render(<CreateProjectDialog {...defaultProps} isLoading={true} />);
    const buttons = screen.getAllByRole("button", { name: /^Create$/ });
    const btn = buttons[buttons.length - 1];
    expect(btn).toBeDisabled();
  });

  it("shows room ID preview when roomId is provided", () => {
    render(<CreateProjectDialog {...defaultProps} roomId="my-project-abc1" />);
    expect(screen.getByText(/my-project-abc1/)).toBeInTheDocument();
  });

  it("shows suggested names when suggestions are provided", () => {
    render(
      <CreateProjectDialog
        {...defaultProps}
        suggestions={["My Project 2", "My Project 3"]}
      />,
    );
    expect(screen.getAllByText("Suggested names:").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("My Project 2").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("My Project 3").length).toBeGreaterThanOrEqual(1);
  });
});
