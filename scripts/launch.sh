#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKSPACE_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

# postStartCommand runs on every container start. If the dev processes are
# already running (e.g. a plain reopen, or a restart that didn't clean up),
# bail out instead of spawning a duplicate Next.js/Trigger.dev pair.
if pgrep -f "concurrently" >/dev/null 2>&1; then
  echo "[container] Dev processes already running; skipping duplicate start."
  exit 0
fi

echo "[container] Starting Next.js + Trigger.dev..."
cd "${WORKSPACE_ROOT}"
npx concurrently \
  --names "next,trigger" \
  --prefix-colors "cyan,magenta" \
  "npm run dev" \
  "npm run trigger:dev"
