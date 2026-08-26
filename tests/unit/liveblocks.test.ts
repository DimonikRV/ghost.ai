import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const VALID_KEY = "sk_test1234567890";

vi.mock("@liveblocks/node", () => {
  class MockLiveblocks {
    constructor(_opts: { secret: string }) {}
  }
  return { Liveblocks: MockLiveblocks };
});

let savedEnv: string | undefined;

beforeEach(() => {
  savedEnv = process.env.LIVEBLOCKS_SECRET_KEY;
});

afterEach(() => {
  if (savedEnv === undefined) {
    delete process.env.LIVEBLOCKS_SECRET_KEY;
  } else {
    process.env.LIVEBLOCKS_SECRET_KEY = savedEnv;
  }
  vi.resetModules();
});

describe("getUserCursorColor", () => {
  it("returns a valid hex color", async () => {
    const { getUserCursorColor } = await import("@/lib/liveblocks");
    expect(getUserCursorColor("user_123")).toMatch(/^#[0-9a-f]{6}$/);
  });

  it("returns the same color for the same userId", async () => {
    const { getUserCursorColor } = await import("@/lib/liveblocks");
    expect(getUserCursorColor("user_abc")).toBe(getUserCursorColor("user_abc"));
  });

  it("returns colors only from the fixed palette", async () => {
    const palette = [
      "#06b6d4", "#f472b6", "#a78bfa", "#34d399", "#fb923c",
      "#facc15", "#38bdf8", "#e879f9", "#22d3ee", "#f87171",
    ];
    const { getUserCursorColor } = await import("@/lib/liveblocks");
    for (let i = 0; i < 100; i++) {
      expect(palette).toContain(getUserCursorColor(`user_${i}`));
    }
  });

  it("is deterministic: same input always yields the same output", async () => {
    const { getUserCursorColor } = await import("@/lib/liveblocks");
    const runs = Array.from({ length: 50 }, (_, i) => getUserCursorColor(`id-${i}`));
    const again = Array.from({ length: 50 }, (_, i) => getUserCursorColor(`id-${i}`));
    expect(runs).toEqual(again);
  });

  it("different inputs can produce different outputs", async () => {
    const { getUserCursorColor } = await import("@/lib/liveblocks");
    const colors = new Set<string>();
    for (let i = 0; i < 20; i++) {
      colors.add(getUserCursorColor(`user_${i}`));
    }
    expect(colors.size).toBeGreaterThan(1);
  });
});

describe("getLiveblocks", () => {
  it("returns a singleton Liveblocks instance", async () => {
    process.env.LIVEBLOCKS_SECRET_KEY = VALID_KEY;
    const { getLiveblocks } = await import("@/lib/liveblocks");
    const a = getLiveblocks();
    const b = getLiveblocks();
    expect(a).toBe(b);
  });

  it("throws when LIVEBLOCKS_SECRET_KEY is missing", async () => {
    delete process.env.LIVEBLOCKS_SECRET_KEY;
    const { getLiveblocks } = await import("@/lib/liveblocks");
    expect(() => getLiveblocks()).toThrow(/not configured or invalid/);
  });

  it("throws when LIVEBLOCKS_SECRET_KEY does not start with sk_", async () => {
    process.env.LIVEBLOCKS_SECRET_KEY = "invalid_key";
    const { getLiveblocks } = await import("@/lib/liveblocks");
    expect(() => getLiveblocks()).toThrow(/must start with 'sk_'/);
  });

  it("throws when LIVEBLOCKS_SECRET_KEY is an empty string", async () => {
    process.env.LIVEBLOCKS_SECRET_KEY = "";
    const { getLiveblocks } = await import("@/lib/liveblocks");
    expect(() => getLiveblocks()).toThrow(/not configured or invalid/);
  });

  it("returns a new instance after module reset with valid key", async () => {
    process.env.LIVEBLOCKS_SECRET_KEY = VALID_KEY;
    const { getLiveblocks: first } = await import("@/lib/liveblocks");
    const a = first();

    vi.resetModules();
    process.env.LIVEBLOCKS_SECRET_KEY = VALID_KEY;
    const { getLiveblocks: second } = await import("@/lib/liveblocks");
    const b = second();
    expect(a).not.toBe(b);
  });
});
