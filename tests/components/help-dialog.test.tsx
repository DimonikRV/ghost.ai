// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

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

import { HelpDialog } from "@/components/editor/help-dialog";

describe("HelpDialog", () => {
  it("renders when open=true", () => {
    render(<HelpDialog open={true} onOpenChange={vi.fn()} />);
    expect(screen.getByText("Getting Started")).toBeInTheDocument();
  });

  it("shows Getting Started text", () => {
    render(<HelpDialog open={true} onOpenChange={vi.fn()} />);
    expect(screen.getByText("Getting Started")).toBeInTheDocument();
    expect(screen.getByText(/Learn how to use starter templates/)).toBeInTheDocument();
  });

  it("does not render when open=false", () => {
    render(<HelpDialog open={false} onOpenChange={vi.fn()} />);
    expect(screen.queryByText("Getting Started")).not.toBeInTheDocument();
  });
});
