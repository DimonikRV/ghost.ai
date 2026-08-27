import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";

describe("useKeyboardShortcuts", () => {
  let onZoomIn = vi.fn<() => void>();
  let onZoomOut = vi.fn<() => void>();
  let onFitView = vi.fn<() => void>();
  let onUndo = vi.fn<() => void>();
  let onRedo = vi.fn<() => void>();
  let result: ReturnType<typeof renderHook>;

  beforeEach(() => {
    onZoomIn.mockClear();
    onZoomOut.mockClear();
    onFitView.mockClear();
    onUndo.mockClear();
    onRedo.mockClear();
  });

  afterEach(() => {
    result?.unmount();
  });

  function fireKey(
    key: string,
    opts: Partial<KeyboardEventInit> = {},
    target?: EventTarget,
  ) {
    act(() => {
      const el = target ?? window;
      el.dispatchEvent(
        new KeyboardEvent("keydown", { key, bubbles: true, ...opts }),
      );
    });
  }

  function mount() {
    result = renderHook(() =>
      useKeyboardShortcuts({ onZoomIn, onZoomOut, onFitView, onUndo, onRedo }),
    );
  }

  it("calls onZoomIn when + is pressed", () => {
    mount();
    fireKey("+");
    expect(onZoomIn).toHaveBeenCalledTimes(1);
  });

  it("calls onZoomIn when = is pressed", () => {
    mount();
    fireKey("=");
    expect(onZoomIn).toHaveBeenCalledTimes(1);
  });

  it("calls onZoomOut when - is pressed", () => {
    mount();
    fireKey("-");
    expect(onZoomOut).toHaveBeenCalledTimes(1);
  });

  it("calls onUndo when Ctrl+Z is pressed", () => {
    mount();
    fireKey("z", { ctrlKey: true });
    expect(onUndo).toHaveBeenCalledTimes(1);
  });

  it("calls onRedo when Ctrl+Shift+Z is pressed", () => {
    mount();
    fireKey("z", { ctrlKey: true, shiftKey: true });
    expect(onRedo).toHaveBeenCalledTimes(1);
  });

  it("ignores shortcuts when focus is in an input", () => {
    mount();
    const input = document.createElement("input");
    document.body.appendChild(input);
    input.focus();
    fireKey("+", {}, input);
    expect(onZoomIn).not.toHaveBeenCalled();
    document.body.removeChild(input);
  });

  it("ignores shortcuts when focus is in a textarea", () => {
    mount();
    const textarea = document.createElement("textarea");
    document.body.appendChild(textarea);
    textarea.focus();
    fireKey("-", {}, textarea);
    expect(onZoomOut).not.toHaveBeenCalled();
    document.body.removeChild(textarea);
  });

  it("ignores shortcuts when focus is in a contentEditable element", () => {
    mount();
    const div = document.createElement("div");
    div.contentEditable = "true";
    document.body.appendChild(div);
    div.focus();
    fireKey("=", {}, div);
    expect(onZoomIn).not.toHaveBeenCalled();
    document.body.removeChild(div);
  });

  it("does not call zoom when Ctrl+Plus is pressed (modifier held)", () => {
    mount();
    fireKey("+", { ctrlKey: true });
    expect(onZoomIn).not.toHaveBeenCalled();
  });
});
