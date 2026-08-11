#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKSPACE_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

echo "[container] Installing dependencies..."
cd "${WORKSPACE_ROOT}"
npm install
echo "[container] Starting Next.js + Trigger.dev..."
# Stagger startup so Next.js's filesystem benchmark finishes before
# Trigger.dev starts hammering the disk (avoids the
# "Slow filesystem detected" false positive).
npx concurrently \
  --names "next,trigger" \
  --prefix-colors "cyan,magenta" \
  "npm run dev" \
  "sleep 15 && npm run trigger:dev"
