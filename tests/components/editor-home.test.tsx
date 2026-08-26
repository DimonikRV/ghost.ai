// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("@/components/ui/button", () => ({
  Button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button {...props}>{children}</button>
  ),
}));

import { EditorHome } from "@/components/editor/editor-home";

describe("EditorHome", () => {
  it("renders heading", () => {
    render(<EditorHome onOpenCreate={vi.fn()} />);
    expect(screen.getByText("Create a project or open an existing one")).toBeInTheDocument();
  });

  it("renders New Project button", () => {
    render(<EditorHome onOpenCreate={vi.fn()} />);
    expect(screen.getByRole("button", { name: /New Project/ })).toBeInTheDocument();
  });

  it("calls onOpenCreate when button clicked", async () => {
    const user = userEvent.setup();
    const onOpenCreate = vi.fn();
    render(<EditorHome onOpenCreate={onOpenCreate} />);
    await user.click(screen.getByRole("button", { name: /New Project/ }));
    expect(onOpenCreate).toHaveBeenCalledTimes(1);
  });
});
