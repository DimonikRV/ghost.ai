import { Liveblocks } from "@liveblocks/node";

/**
 * Fixed palette of 10 distinct, visually distinguishable cursor colors.
 * Chosen for contrast against dark surfaces (#1a1a1a / oklch ~0.2).
 */
const CURSOR_PALETTE = [
  "#06b6d4", // cyan (brand accent)
  "#f472b6", // pink
  "#a78bfa", // violet
  "#34d399", // emerald
  "#fb923c", // orange
  "#facc15", // yellow
  "#38bdf8", // sky
  "#e879f9", // fuchsia
  "#22d3ee", // bright cyan
  "#f87171", // red
] as const;

/**
 * Simple string hash — DJB2 variant.
 * Returns a non-negative integer.
 */
function hashString(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }
  return Math.abs(hash);
}

/**
 * Deterministically maps a userId to a consistent cursor color.
 * Same userId always returns the same color.
 */
export function getUserCursorColor(userId: string): string {
  const index = hashString(userId) % CURSOR_PALETTE.length;
  return CURSOR_PALETTE[index];
}

/**
 * Cached Liveblocks node client singleton.
 * Lazily initialized on first access to avoid build-time failures
 * when LIVEBLOCKS_SECRET_KEY is not yet configured.
 */
let _liveblocks: Liveblocks | undefined;

export function getLiveblocks(): Liveblocks {
  if (!_liveblocks) {
    const secret = process.env.LIVEBLOCKS_SECRET_KEY;
    if (!secret || !secret.startsWith("sk_")) {
      throw new Error(
        "LIVEBLOCKS_SECRET_KEY is not configured or invalid. " +
        "It must start with 'sk_'. Get it from https://liveblocks.io/dashboard/apikeys",
      );
    }
    _liveblocks = new Liveblocks({ secret });
  }
  return _liveblocks;
}
