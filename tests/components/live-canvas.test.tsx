// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@liveblocks/react", () => ({
  ClientSideSuspense: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("@xyflow/react", () => ({
  ReactFlowProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/editor/canvas", () => ({
  Canvas: ({ projectId }: { projectId: string }) => (
    <div data-testid="canvas" data-project-id={projectId} />
  ),
}));

vi.mock("@/components/editor/workspace-shell", () => {
  const React = require("react");
  return {
    CanvasSaveStatusContext: React.createContext(null),
  };
});

vi.mock("@/components/editor/react-flow-wrapper-ref-context", () => {
  const React = require("react");
  return {
    RegisterWrapperRefContext: React.createContext(null),
    useRegisterWrapperRef: () => () => {},
    ExportDialogContext: React.createContext(null),
    useExportDialog: () => vi.fn(),
  };
});

import { LiveCanvas } from "@/components/editor/live-canvas";

describe("LiveCanvas", () => {
  it("renders Canvas component when projectId provided", () => {
    render(<LiveCanvas projectId="proj_123" />);
    expect(screen.getByTestId("canvas")).toBeInTheDocument();
    expect(screen.getByTestId("canvas")).toHaveAttribute("data-project-id", "proj_123");
  });

  it("shows No project ID fallback when projectId is empty string", () => {
    render(<LiveCanvas projectId="" />);
    expect(screen.getByText("No project ID provided")).toBeInTheDocument();
    expect(screen.queryByTestId("canvas")).not.toBeInTheDocument();
  });
});
