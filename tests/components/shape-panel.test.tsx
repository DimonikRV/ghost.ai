// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ShapePanel } from "@/components/editor/shape-panel";

describe("ShapePanel", () => {
  it("renders all 6 shape types", () => {
    render(<ShapePanel />);
    expect(screen.getAllByTitle("Rectangle").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByTitle("Diamond").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByTitle("Circle").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByTitle("Pill").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByTitle("Cylinder").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByTitle("Hexagon").length).toBeGreaterThanOrEqual(1);
  });

  it("has draggable buttons", () => {
    const { container } = render(<ShapePanel />);
    const draggableButtons = container.querySelectorAll('[draggable="true"]');
    expect(draggableButtons.length).toBeGreaterThanOrEqual(6);
  });

  it("sets drag data on dragStart", () => {
    render(<ShapePanel />);
    const rectBtn = screen.getAllByTitle("Rectangle")[0];
    const dataTransfer = {
      setData: vi.fn(),
      effectAllowed: "copy",
    };
    fireEvent.dragStart(rectBtn, { dataTransfer: dataTransfer as never });
    expect(dataTransfer.setData).toHaveBeenCalledWith(
      "application/ghost-shape",
      expect.stringContaining('"type":"rectangle"'),
    );
  });
});
