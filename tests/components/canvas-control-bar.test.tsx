// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CanvasControlBar } from "@/components/editor/canvas-control-bar";

describe("CanvasControlBar", () => {
  const defaultProps = {
    onZoomIn: vi.fn(),
    onZoomOut: vi.fn(),
    onFitView: vi.fn(),
    onUndo: vi.fn(),
    onRedo: vi.fn(),
    canUndo: true,
    canRedo: true,
    onTemplates: vi.fn(),
    onExport: vi.fn(),
    onHelp: vi.fn(),
  };

  it("renders control buttons", () => {
    render(<CanvasControlBar {...defaultProps} />);
    expect(screen.getByRole("button", { name: /Templates/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Export/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Zoom in/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Zoom out/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Fit view/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Undo/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Redo/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Help/ })).toBeInTheDocument();
  });

  it("calls onZoomIn when zoom in button is clicked", async () => {
    const user = userEvent.setup();
    const onZoomIn = vi.fn();
    render(<CanvasControlBar {...defaultProps} onZoomIn={onZoomIn} />);
    await user.click(screen.getByRole("button", { name: /Zoom in/ }));
    expect(onZoomIn).toHaveBeenCalledTimes(1);
  });

  it("calls onZoomOut when zoom out button is clicked", async () => {
    const user = userEvent.setup();
    const onZoomOut = vi.fn();
    render(<CanvasControlBar {...defaultProps} onZoomOut={onZoomOut} />);
    await user.click(screen.getByRole("button", { name: /Zoom out/ }));
    expect(onZoomOut).toHaveBeenCalledTimes(1);
  });

  it("calls onFitView when fit view button is clicked", async () => {
    const user = userEvent.setup();
    const onFitView = vi.fn();
    render(<CanvasControlBar {...defaultProps} onFitView={onFitView} />);
    await user.click(screen.getByRole("button", { name: /Fit view/ }));
    expect(onFitView).toHaveBeenCalledTimes(1);
  });

  it("calls onTemplates when templates button is clicked", async () => {
    const user = userEvent.setup();
    const onTemplates = vi.fn();
    render(<CanvasControlBar {...defaultProps} onTemplates={onTemplates} />);
    await user.click(screen.getByRole("button", { name: /Templates/ }));
    expect(onTemplates).toHaveBeenCalledTimes(1);
  });

  it("calls onHelp when help button is clicked", async () => {
    const user = userEvent.setup();
    const onHelp = vi.fn();
    render(<CanvasControlBar {...defaultProps} onHelp={onHelp} />);
    await user.click(screen.getByRole("button", { name: /Help/ }));
    expect(onHelp).toHaveBeenCalledTimes(1);
  });

  it("calls onExport when export button is clicked", async () => {
    const user = userEvent.setup();
    const onExport = vi.fn();
    render(<CanvasControlBar {...defaultProps} onExport={onExport} />);
    await user.click(screen.getByRole("button", { name: /Export/ }));
    expect(onExport).toHaveBeenCalledTimes(1);
  });

  it("disables undo when canUndo is false", () => {
    render(<CanvasControlBar {...defaultProps} canUndo={false} />);
    expect(screen.getByRole("button", { name: /Undo/ })).toBeDisabled();
  });

  it("disables redo when canRedo is false", () => {
    render(<CanvasControlBar {...defaultProps} canRedo={false} />);
    expect(screen.getByRole("button", { name: /Redo/ })).toBeDisabled();
  });
});
