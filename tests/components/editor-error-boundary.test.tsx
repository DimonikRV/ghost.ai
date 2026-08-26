// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  useUntrackedPathname: () => "/",
}));

vi.mock("next/compat/router", () => ({
  useRouter: () => null,
}));

vi.mock("@/lib/utils", () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(" "),
}));

import { EditorErrorBoundary } from "@/components/editor/editor-error-boundary";

function ThrowingChild({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error("Test error message");
  }
  return <div data-testid="child-ok">Child OK</div>;
}

function GoodChild() {
  return <div data-testid="good-child">All good</div>;
}

describe("EditorErrorBoundary", () => {
  it("renders fallback when child throws error", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    render(
      <EditorErrorBoundary>
        <ThrowingChild shouldThrow={true} />
      </EditorErrorBoundary>
    );
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    consoleSpy.mockRestore();
  });

  it("shows error message in fallback", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    render(
      <EditorErrorBoundary>
        <ThrowingChild shouldThrow={true} />
      </EditorErrorBoundary>
    );
    expect(screen.getByText("Test error message")).toBeInTheDocument();
    consoleSpy.mockRestore();
  });

  it("retry button is clickable", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    render(
      <EditorErrorBoundary>
        <ThrowingChild shouldThrow={true} />
      </EditorErrorBoundary>
    );
    const retryBtn = screen.getByText("Try again");
    expect(retryBtn).toBeInTheDocument();
    fireEvent.click(retryBtn);
    consoleSpy.mockRestore();
  });

  it("renders children when no error", () => {
    render(
      <EditorErrorBoundary>
        <GoodChild />
      </EditorErrorBoundary>
    );
    expect(screen.getByTestId("good-child")).toBeInTheDocument();
    expect(screen.getByText("All good")).toBeInTheDocument();
  });
});
