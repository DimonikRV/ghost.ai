#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKSPACE_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

echo "[container] Installing dependencies..."
cd "${WORKSPACE_ROOT}"
npm install
echo "[container] Starting Next.js + Trigger.dev..."
npx concurrently \
  --names "next,trigger" \
  --prefix-colors "cyan,magenta" \
  "npm run dev" \
  "npm run trigger:dev"
