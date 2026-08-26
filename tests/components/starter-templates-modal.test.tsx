// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({ children, open }: { children: React.ReactNode; open?: boolean }) =>
    open === false ? null : <div>{children}</div>,
  DialogContent: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div {...props}>{children}</div>
  ),
  DialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogDescription: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/ui/scroll-area", () => ({
  ScrollArea: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div {...props}>{children}</div>
  ),
}));

import { StarterTemplatesModal } from "@/components/editor/starter-templates-modal";
import { CANVAS_TEMPLATES } from "@/components/editor/starter-templates";

describe("StarterTemplatesModal", () => {
  it("renders when open=true", () => {
    render(<StarterTemplatesModal open={true} onOpenChange={vi.fn()} onImport={vi.fn()} />);
    expect(screen.getByText("Starter Templates")).toBeInTheDocument();
  });

  it("shows all template names", () => {
    render(<StarterTemplatesModal open={true} onOpenChange={vi.fn()} onImport={vi.fn()} />);
    for (const template of CANVAS_TEMPLATES) {
      expect(screen.getByText(template.name)).toBeInTheDocument();
    }
  });

  it("calls onImport with template when Import button clicked", async () => {
    const user = userEvent.setup();
    const onImport = vi.fn();
    render(<StarterTemplatesModal open={true} onOpenChange={vi.fn()} onImport={onImport} />);
    const importButtons = screen.getAllByRole("button", { name: /^Import$/ });
    await user.click(importButtons[0]);
    expect(onImport).toHaveBeenCalledWith(CANVAS_TEMPLATES[0]);
  });

  it("does not render when open=false", () => {
    render(<StarterTemplatesModal open={false} onOpenChange={vi.fn()} onImport={vi.fn()} />);
    expect(screen.queryByText("Starter Templates")).not.toBeInTheDocument();
  });
});
