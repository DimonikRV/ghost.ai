// @vitest-environment jsdom

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useCanvasAutosave } from "@/hooks/use-canvas-autosave";

const PROJECT_ID = "proj_test";
let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.useFakeTimers();
  fetchMock = vi.fn().mockResolvedValue({ ok: true });
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("useCanvasAutosave", () => {
  it("starts with idle status", () => {
    const { result } = renderHook(() =>
      useCanvasAutosave(PROJECT_ID, [], []),
    );
    expect(result.current).toBe("idle");
  });

  it("triggers a save after the debounce delay", async () => {
    const { result, rerender } = renderHook(
      ({ nodes, edges }) => useCanvasAutosave(PROJECT_ID, nodes, edges),
      { initialProps: { nodes: [] as unknown[], edges: [] as unknown[] } },
    );

    rerender({ nodes: [{ id: "1" }], edges: [] });

    expect(fetchMock).not.toHaveBeenCalled();

    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      `/api/projects/${PROJECT_ID}/canvas`,
      expect.objectContaining({ method: "PUT" }),
    );
  });

  it("shows saving while fetch is in flight", async () => {
    let resolveFetch!: (value: Response) => void;
    fetchMock.mockReturnValue(
      new Promise((r) => { resolveFetch = r; }),
    );

    const { result, rerender } = renderHook(
      ({ nodes }) => useCanvasAutosave(PROJECT_ID, nodes, []),
      { initialProps: { nodes: [] as unknown[] } },
    );

    rerender({ nodes: [{ id: "x" }] });

    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    expect(result.current).toBe("saving");

    await act(async () => {
      resolveFetch({ ok: true } as Response);
    });

    expect(result.current).toBe("saved");
  });

  it("shows saved after a successful save", async () => {
    const { result, rerender } = renderHook(
      ({ nodes }) => useCanvasAutosave(PROJECT_ID, nodes, []),
      { initialProps: { nodes: [] as unknown[] } },
    );

    rerender({ nodes: [{ id: "1" }] });

    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    expect(result.current).toBe("saved");
  });

  it("shows error after a failed save", async () => {
    fetchMock.mockResolvedValue({ ok: false });

    const { result, rerender } = renderHook(
      ({ nodes }) => useCanvasAutosave(PROJECT_ID, nodes, []),
      { initialProps: { nodes: [] as unknown[] } },
    );

    rerender({ nodes: [{ id: "1" }] });

    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    expect(result.current).toBe("error");
  });

  it("shows error when fetch throws", async () => {
    fetchMock.mockRejectedValue(new Error("Network error"));

    const { result, rerender } = renderHook(
      ({ nodes }) => useCanvasAutosave(PROJECT_ID, nodes, []),
      { initialProps: { nodes: [] as unknown[] } },
    );

    rerender({ nodes: [{ id: "1" }] });

    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    expect(result.current).toBe("error");
  });

  it("does not save when enabled=false", async () => {
    const { rerender } = renderHook(
      ({ nodes, enabled }) =>
        useCanvasAutosave(PROJECT_ID, nodes, [], enabled),
      { initialProps: { nodes: [] as unknown[], enabled: false } },
    );

    rerender({ nodes: [{ id: "1" }], enabled: false });

    await act(async () => {
      vi.advanceTimersByTime(5000);
    });

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("resets the debounce timer when nodes change rapidly", async () => {
    const { rerender } = renderHook(
      ({ nodes }) => useCanvasAutosave(PROJECT_ID, nodes, []),
      { initialProps: { nodes: [] as unknown[] } },
    );

    rerender({ nodes: [{ id: "1" }] });

    await act(async () => {
      vi.advanceTimersByTime(1500);
    });

    rerender({ nodes: [{ id: "1" }, { id: "2" }] });

    await act(async () => {
      vi.advanceTimersByTime(1500);
    });

    expect(fetchMock).not.toHaveBeenCalled();

    await act(async () => {
      vi.advanceTimersByTime(500);
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("sends correct body with nodes and edges", async () => {
    const nodes = [{ id: "n1" }, { id: "n2" }];
    const edges = [{ id: "e1", source: "n1", target: "n2" }];

    const { rerender } = renderHook(
      ({ nodes, edges }) => useCanvasAutosave(PROJECT_ID, nodes, edges),
      { initialProps: { nodes: [] as unknown[], edges: [] as unknown[] } },
    );

    rerender({ nodes, edges });

    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.nodes).toEqual(nodes);
    expect(body.edges).toEqual(edges);
  });

  it("queues a save when one is already in-flight", async () => {
    let resolveFetch!: (value: Response) => void;
    fetchMock.mockReturnValue(
      new Promise((r) => { resolveFetch = r; }),
    );

    const { rerender } = renderHook(
      ({ nodes }) => useCanvasAutosave(PROJECT_ID, nodes, []),
      { initialProps: { nodes: [] as unknown[] } },
    );

    rerender({ nodes: [{ id: "1" }] });

    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);

    rerender({ nodes: [{ id: "1" }, { id: "2" }] });

    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveFetch({ ok: true } as Response);
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
