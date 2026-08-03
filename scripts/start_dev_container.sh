#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKSPACE_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

cd "${WORKSPACE_ROOT}"
npm install
npx concurrently --names "next,trigger" --prefix-colors "cyan,magenta" "npm run dev" "npm run trigger:dev"
