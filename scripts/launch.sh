#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKSPACE_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
LOCK_DIR="${WORKSPACE_ROOT}/.dev-service"
LOCK_FILE="${LOCK_DIR}/dev-service.lock"
PID_FILE="${LOCK_DIR}/dev-service.pid"
LOG_DIR="${LOCK_DIR}/logs"
DEV_PROCESS_PATTERN='(next dev|trigger dev|concurrently|npm run dev|npm run trigger:dev)'

mkdir -p "${LOCK_DIR}" "${LOG_DIR}"

# Guard against duplicate dev-service groups without matching unrelated processes.
if [ -f "${PID_FILE}" ]; then
  EXISTING_PID="$(cat "${PID_FILE}" 2>/dev/null || true)"
  if [ -n "${EXISTING_PID}" ] && kill -0 "${EXISTING_PID}" 2>/dev/null; then
    EXISTING_CMD="$(ps -o cmd= -p "${EXISTING_PID}" 2>/dev/null || true)"
    if printf '%s\n' "${EXISTING_CMD}" | grep -Eq "${DEV_PROCESS_PATTERN}"; then
      echo "[container] Dev processes already running (pid ${EXISTING_PID}); skipping duplicate start."
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

cleanup() {
  flock -u 9
}
trap cleanup EXIT

echo "[container] Starting Next.js + Trigger.dev in background..."
cd "${WORKSPACE_ROOT}"

# Start dev services detached from the terminal. Output goes to log files so it
# never blocks on a TTY. setsid runs them in a new session so they survive the
# postStartCommand session teardown; < /dev/null detaches stdin (otherwise the
# backgrounded process may fail or hang on the closed terminal).
CONCURRENTLY_BIN="$(command -v concurrently || true)"
if [ -z "${CONCURRENTLY_BIN}" ]; then
  echo "[container] concurrently is not installed; rebuild the devcontainer."
  exit 1
fi

setsid nohup "${CONCURRENTLY_BIN}" \
  --names "next,trigger" \
  --prefix-colors "cyan,magenta" \
  "npm run dev > ${LOG_DIR}/next.log 2>&1" \
  "npm run trigger:dev > ${LOG_DIR}/trigger.log 2>&1" \
  > "${LOG_DIR}/concurrently.log" 2>&1 < /dev/null &

DEV_PID=$!
echo "${DEV_PID}" > "${PID_FILE}"
echo "${DEV_PID}" > "${LOG_DIR}/dev.pid"
echo "[container] Next.js logs:   tail -f ${LOG_DIR}/next.log"
echo "[container] Trigger logs:   tail -f ${LOG_DIR}/trigger.log"
echo "[container] Dashboard:     http://localhost:3000"

# Wait for Next.js to bind its port so postStartCommand reports a real startup
# failure instead of claiming success while the background process is booting.
for _ in $(seq 1 60); do
  if (echo >/dev/tcp/127.0.0.1/3000) 2>/dev/null; then
    echo "[container] Dev services ready (pid ${DEV_PID})"
    disown || true
    exit 0
  fi

  if ! kill -0 "${DEV_PID}" 2>/dev/null; then
    echo "[container] Dev services exited during startup. See ${LOG_DIR}/concurrently.log"
    exit 1
  fi

  sleep 1
done

echo "[container] Timed out waiting for Next.js. See ${LOG_DIR}/next.log"
exit 1
