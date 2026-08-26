// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("@clerk/nextjs", () => ({
  useUser: () => ({ user: { id: "user-self" } }),
  UserButton: () => <span data-testid="user-button" />,
}));

const mockUseOthers = vi.fn(() => []);
vi.mock("@liveblocks/react", () => ({
  useOthers: (...args: any[]) => mockUseOthers(...args),
}));

vi.mock("react", async () => {
  const actual = await vi.importActual<typeof import("react")>("react");
  return {
    ...actual,
    useSyncExternalStore: () => true,
  };
});

import { PresenceAvatars } from "@/components/editor/presence-avatars";

describe("PresenceAvatars", () => {
  beforeEach(() => {
    mockUseOthers.mockReturnValue([]);
  });

  it("renders own user avatar", () => {
    render(<PresenceAvatars />);
    expect(screen.getByTestId("user-button")).toBeInTheDocument();
  });

  it("renders collaborator avatars", () => {
    mockUseOthers.mockReturnValue([
      { info: { userId: "user-1", displayName: "Alice Smith", avatarUrl: null, cursorColor: "#ff0000" } },
    ] as any);

    render(<PresenceAvatars />);
    expect(screen.getByText("AS")).toBeInTheDocument();
  });

  it("deduplicates by userId", () => {
    mockUseOthers.mockReturnValue([
      { info: { userId: "user-1", displayName: "Alice Smith", avatarUrl: null, cursorColor: "#ff0000" } },
      { info: { userId: "user-1", displayName: "Alice Smith", avatarUrl: null, cursorColor: "#ff0000" } },
    ] as any);

    render(<PresenceAvatars />);
    const aliceElements = screen.getAllByText("AS");
    expect(aliceElements).toHaveLength(1);
  });

  it("shows +N overflow for more than 5 collaborators", () => {
    mockUseOthers.mockReturnValue([
      { info: { userId: "user-1", displayName: "User One", avatarUrl: null, cursorColor: "#f00" } },
      { info: { userId: "user-2", displayName: "User Two", avatarUrl: null, cursorColor: "#f00" } },
      { info: { userId: "user-3", displayName: "User Three", avatarUrl: null, cursorColor: "#f00" } },
      { info: { userId: "user-4", displayName: "User Four", avatarUrl: null, cursorColor: "#f00" } },
      { info: { userId: "user-5", displayName: "User Five", avatarUrl: null, cursorColor: "#f00" } },
      { info: { userId: "user-6", displayName: "User Six", avatarUrl: null, cursorColor: "#f00" } },
      { info: { userId: "user-7", displayName: "User Seven", avatarUrl: null, cursorColor: "#f00" } },
    ] as any);

    render(<PresenceAvatars />);
    expect(screen.getByText("+2")).toBeInTheDocument();
  });

  it("shows initials when no avatarUrl", () => {
    mockUseOthers.mockReturnValue([
      { info: { userId: "user-1", displayName: "John Doe", avatarUrl: null, cursorColor: "#00f" } },
    ] as any);

    render(<PresenceAvatars />);
    expect(screen.getByText("JD")).toBeInTheDocument();
  });

  it("shows img element when avatarUrl is provided", () => {
    mockUseOthers.mockReturnValue([
      { info: { userId: "user-1", displayName: "Alice", avatarUrl: "https://example.com/alice.png", cursorColor: "#0f0" } },
    ] as any);

    render(<PresenceAvatars />);
    const img = screen.getByRole("img", { name: "Alice" });
    expect(img).toHaveAttribute("src", "https://example.com/alice.png");
  });
});
