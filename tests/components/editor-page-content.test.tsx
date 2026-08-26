// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

const { mockOpenCreate } = vi.hoisted(() => ({
  mockOpenCreate: vi.fn(),
}));

vi.mock("@/components/editor/project-actions-context", () => ({
  useProjectActionsContext: vi.fn().mockReturnValue({
    openCreate: mockOpenCreate,
  }),
}));

vi.mock("@/components/editor/editor-home", () => ({
  EditorHome: ({ onOpenCreate }: { onOpenCreate: () => void }) => (
    <div data-testid="editor-home">
      <button data-testid="trigger-create" onClick={onOpenCreate}>
        Open
      </button>
    </div>
  ),
}));

import { EditorPageContent } from "@/components/editor/editor-page-content";

describe("EditorPageContent", () => {
  it("renders EditorHome with openCreate wired", () => {
    render(<EditorPageContent />);
    expect(screen.getByTestId("editor-home")).toBeInTheDocument();
  });

  it("calls openCreate from context when EditorHome triggers", () => {
    render(<EditorPageContent />);
    screen.getByTestId("trigger-create").click();
    expect(mockOpenCreate).toHaveBeenCalledTimes(1);
  });
});
