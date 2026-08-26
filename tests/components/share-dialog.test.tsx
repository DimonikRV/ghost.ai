// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("@/components/editor/dialog-pattern", () => ({
  Dialog: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  DialogContent: ({
    children,
    ...props
  }: React.HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>,
  DialogHeader: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  DialogTitle: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  DialogDescription: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  DialogFooter: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({
    children,
    ...props
  }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button {...props}>{children}</button>
  ),
}));

vi.mock("@/components/ui/input", () => ({
  Input: ({ ...props }: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input {...props} />
  ),
}));

import { ShareDialog } from "@/components/editor/share-dialog";

describe("ShareDialog", () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    projectId: "proj_123",
    isOwner: true,
    collaborators: [],
    onInvite: vi.fn(),
    onRemove: vi.fn(),
    isLoading: false,
    error: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window, "location", {
      value: { origin: "http://localhost:3000" },
      writable: true,
    });
  });

  it("renders when open=true", () => {
    render(<ShareDialog {...defaultProps} />);
    expect(screen.getByText("Share this project")).toBeInTheDocument();
  });

  it("shows invite form when isOwner=true", () => {
    render(<ShareDialog {...defaultProps} isOwner={true} />);
    expect(screen.getByText("Invite by email")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("collaborator@example.com"),
    ).toBeInTheDocument();
  });

  it("hides invite form when isOwner=false", () => {
    render(<ShareDialog {...defaultProps} isOwner={false} />);
    expect(screen.queryByText("Invite by email")).not.toBeInTheDocument();
  });

  it("calls onInvite with trimmed email on form submit", async () => {
    const user = userEvent.setup();
    const onInvite = vi.fn().mockResolvedValue(undefined);
    render(<ShareDialog {...defaultProps} onInvite={onInvite} />);

    const input = screen.getByPlaceholderText("collaborator@example.com");
    await user.type(input, "  test@example.com  ");
    await user.click(screen.getByRole("button", { name: /^Invite$/ }));

    expect(onInvite).toHaveBeenCalledWith("test@example.com");
  });

  it("shows error message when error provided", () => {
    render(<ShareDialog {...defaultProps} error="Something went wrong" />);
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
  });

  it("shows collaborator list", () => {
    const collaborators = [
      {
        id: "c1",
        email: "alice@example.com",
        createdAt: "2026-01-01",
        displayName: "Alice",
      },
      {
        id: "c2",
        email: "bob@example.com",
        createdAt: "2026-01-02",
        displayName: "Bob",
      },
    ];
    render(<ShareDialog {...defaultProps} collaborators={collaborators} />);
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
  });

  it("calls onRemove when remove button clicked", async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn().mockResolvedValue(undefined);
    const collaborators = [
      {
        id: "c1",
        email: "alice@example.com",
        createdAt: "2026-01-01",
        displayName: "Alice",
      },
    ];
    render(
      <ShareDialog
        {...defaultProps}
        collaborators={collaborators}
        onRemove={onRemove}
      />,
    );
    await user.click(screen.getByRole("button", { name: /Remove Alice/ }));
    expect(onRemove).toHaveBeenCalledWith("c1");
  });

  it("copy link button works", async () => {
    const user = userEvent.setup();
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: writeTextMock },
      writable: true,
      configurable: true,
    });
    render(<ShareDialog {...defaultProps} />);
    await user.click(screen.getByRole("button", { name: /Copy/ }));
    expect(writeTextMock).toHaveBeenCalledWith(
      "http://localhost:3000/editor/proj_123",
    );
  });

  it("handleKeyDown triggers invite on Enter with email", async () => {
    const user = userEvent.setup();
    const onInvite = vi.fn().mockResolvedValue(undefined);
    render(<ShareDialog {...defaultProps} onInvite={onInvite} />);
    const input = screen.getByPlaceholderText("collaborator@example.com");
    await user.type(input, "test@example.com");
    await user.keyboard("{Enter}");
    expect(onInvite).toHaveBeenCalledWith("test@example.com");
  });

  it("handleKeyDown does not trigger invite when email is empty", async () => {
    const user = userEvent.setup();
    const onInvite = vi.fn();
    render(<ShareDialog {...defaultProps} onInvite={onInvite} />);
    const input = screen.getByPlaceholderText("collaborator@example.com");
    await user.click(input);
    await user.keyboard("{Enter}");
    expect(onInvite).not.toHaveBeenCalled();
  });

  it("close button calls onOpenChange with false", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(<ShareDialog {...defaultProps} onOpenChange={onOpenChange} />);
    await user.click(screen.getByRole("button", { name: /^Close$/ }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("collaborator without displayName shows email", () => {
    const collaborators = [
      { id: "c1", email: "alice@example.com", createdAt: "2026-01-01" },
    ];
    render(<ShareDialog {...defaultProps} collaborators={collaborators} />);
    expect(screen.getByText("alice@example.com")).toBeInTheDocument();
  });

  it("collaborator with avatarUrl renders image", () => {
    const collaborators = [
      {
        id: "c1",
        email: "alice@example.com",
        createdAt: "2026-01-01",
        avatarUrl: "https://example.com/avatar.png",
      },
    ];
    const { container } = render(
      <ShareDialog {...defaultProps} collaborators={collaborators} />,
    );
    expect(container.querySelector("img")).toHaveAttribute(
      "src",
      "https://example.com/avatar.png",
    );
  });

  it("owner description text is different from non-owner", () => {
    const { rerender } = render(
      <ShareDialog {...defaultProps} isOwner={true} />,
    );
    expect(
      screen.getByText("Invite collaborators to work on this project."),
    ).toBeInTheDocument();
    rerender(<ShareDialog {...defaultProps} isOwner={false} />);
    expect(
      screen.getByText("People with access to this project."),
    ).toBeInTheDocument();
  });

  it("shows collaborator count in header", () => {
    const collaborators = [
      { id: "c1", email: "a@b.com", createdAt: "" },
      { id: "c2", email: "c@d.com", createdAt: "" },
      { id: "c3", email: "e@f.com", createdAt: "" },
    ];
    render(<ShareDialog {...defaultProps} collaborators={collaborators} />);
    expect(screen.getByText("Collaborators (3)")).toBeInTheDocument();
  });

  it("shows empty state for non-owner with no collaborators", () => {
    render(
      <ShareDialog {...defaultProps} isOwner={false} collaborators={[]} />,
    );
    expect(screen.getByText("No one else has access yet")).toBeInTheDocument();
  });

  it("shows empty state for owner with no collaborators", () => {
    render(<ShareDialog {...defaultProps} isOwner={true} collaborators={[]} />);
    expect(
      screen.getByText("Invite someone to get started"),
    ).toBeInTheDocument();
  });

  it("input onChange sets email value", async () => {
    const user = userEvent.setup();
    render(<ShareDialog {...defaultProps} />);
    const input = screen.getByPlaceholderText("collaborator@example.com");
    await user.type(input, "test@example.com");
    expect(input).toHaveValue("test@example.com");
  });

  it("handleCopyLink fallback when clipboard API fails", async () => {
    const user = userEvent.setup();
    Object.defineProperty(navigator, "clipboard", {
      value: undefined,
      writable: true,
      configurable: true,
    });
    document.execCommand = vi.fn();
    render(<ShareDialog {...defaultProps} />);
    await user.click(screen.getByRole("button", { name: /Copy/ }));
    expect(document.execCommand).toHaveBeenCalledWith("copy");
  });

  it("input disabled during loading", () => {
    render(<ShareDialog {...defaultProps} isLoading={true} />);
    expect(
      screen.getByPlaceholderText("collaborator@example.com"),
    ).toBeDisabled();
    expect(screen.getByRole("button", { name: /^Invite$/ })).toBeDisabled();
  });

  it("reset state when dialog closes", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<ShareDialog {...defaultProps} open={true} />);
    await user.type(
      screen.getByPlaceholderText("collaborator@example.com"),
      "test@example.com",
    );
    rerender(<ShareDialog {...defaultProps} open={false} />);
    await vi.waitFor(() => {
      expect(
        screen.getByPlaceholderText("collaborator@example.com"),
      ).toHaveValue("");
    });
    rerender(<ShareDialog {...defaultProps} open={true} />);
    expect(screen.getByPlaceholderText("collaborator@example.com")).toHaveValue(
      "",
    );
  });

  it("non-owner collaborator list has no remove buttons", () => {
    const collaborators = [
      {
        id: "c1",
        email: "alice@example.com",
        createdAt: "",
        displayName: "Alice",
      },
    ];
    render(
      <ShareDialog
        {...defaultProps}
        isOwner={false}
        collaborators={collaborators}
      />,
    );
    expect(
      screen.queryByRole("button", { name: /Remove Alice/ }),
    ).not.toBeInTheDocument();
  });
});
