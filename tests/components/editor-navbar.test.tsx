// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("@clerk/nextjs", () => ({
  UserButton: () => <span data-testid="user-button" />,
}));

import { EditorNavbar } from "@/components/editor/editor-navbar";

describe("EditorNavbar", () => {
  it("renders sidebar toggle button", () => {
    render(<EditorNavbar sidebarOpen={false} onToggleSidebar={vi.fn()} />);
    expect(screen.getByRole("button", { name: /Open sidebar/ })).toBeInTheDocument();
  });

  it("shows PanelLeftOpen icon when sidebar is closed", () => {
    render(<EditorNavbar sidebarOpen={false} onToggleSidebar={vi.fn()} />);
    const btn = screen.getByRole("button", { name: /Open sidebar/ });
    expect(btn.querySelector("svg")).toBeInTheDocument();
  });

  it("shows PanelLeftClose icon when sidebar is open", () => {
    render(<EditorNavbar sidebarOpen={true} onToggleSidebar={vi.fn()} />);
    const btn = screen.getByRole("button", { name: /Close sidebar/ });
    expect(btn.querySelector("svg")).toBeInTheDocument();
  });

  it("calls onToggleSidebar when toggle clicked", async () => {
    const user = userEvent.setup();
    const onToggleSidebar = vi.fn();
    render(<EditorNavbar sidebarOpen={false} onToggleSidebar={onToggleSidebar} />);
    await user.click(screen.getByRole("button", { name: /Open sidebar/ }));
    expect(onToggleSidebar).toHaveBeenCalledTimes(1);
  });
});
