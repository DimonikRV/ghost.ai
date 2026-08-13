#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKSPACE_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
LOCK_DIR="${WORKSPACE_ROOT}/.dev-service"
LOCK_FILE="${LOCK_DIR}/dev-service.lock"
PID_FILE="${LOCK_DIR}/dev-service.pid"
DEV_PROCESS_PATTERN='(next dev|trigger dev|concurrently|npm run dev|npm run trigger:dev)'

mkdir -p "${LOCK_DIR}"

# Guard against duplicate dev-service groups without matching unrelated processes.
# The lock is scoped to this workspace and the pid file is checked for stale entries.
if [ -f "${PID_FILE}" ]; then
  EXISTING_PID="$(cat "${PID_FILE}" 2>/dev/null || true)"
  if [ -n "${EXISTING_PID}" ] && kill -0 "${EXISTING_PID}" 2>/dev/null; then
    EXISTING_CMD="$(ps -o cmd= -p "${EXISTING_PID}" 2>/dev/null || true)"
    if printf '%s\n' "${EXISTING_CMD}" | grep -Eq "${DEV_PROCESS_PATTERN}"; then
      echo "[container] Dev processes already running; skipping duplicate start."
      exit 0
    fi
  fi
  rm -f "${PID_FILE}"
fi

exec 9>"${LOCK_FILE}"
if ! flock -n 9; then
  echo "[container] Dev service lock held by another workspace process; skipping duplicate start."
  exit 0
fi

echo "$$" > "${PID_FILE}"
cleanup() {
  rm -f "${PID_FILE}"
  flock -u 9
}
trap cleanup EXIT

echo "[container] Starting Next.js + Trigger.dev..."
cd "${WORKSPACE_ROOT}"
# Keep this process attached to the devcontainer lifecycle so the CLI does not
# treat the startup as a short-lived background job and tear down the session.
npx concurrently \
  --names "next,trigger" \
  --prefix-colors "cyan,magenta" \
  "npm run dev" \
  "npm run trigger:dev"
