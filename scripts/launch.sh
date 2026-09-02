#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKSPACE_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
LOCK_DIR="${WORKSPACE_ROOT}/.dev-service"
LOCK_FILE="${LOCK_DIR}/dev-service.lock"
PID_FILE="${LOCK_DIR}/dev-service.pid"
LOG_DIR="${LOCK_DIR}/logs"
STARTUP_TIMEOUT_SECONDS="${STARTUP_TIMEOUT_SECONDS:-180}"
MAX_STARTUP_TIMEOUT_SECONDS=600

if ! [[ "${STARTUP_TIMEOUT_SECONDS}" =~ ^[1-9][0-9]*$ ]] ||
  (( STARTUP_TIMEOUT_SECONDS > MAX_STARTUP_TIMEOUT_SECONDS )); then
  echo "[container] STARTUP_TIMEOUT_SECONDS must be an integer from 1 to ${MAX_STARTUP_TIMEOUT_SECONDS}."
  exit 1
fi

mkdir -p "${LOCK_DIR}" "${LOG_DIR}"

has_configured_value() {
  local variable_name="$1"

  if [[ -n "${!variable_name:-}" ]]; then
    return 0
  fi

  local env_files=()
  local env_file
  for env_file in "${WORKSPACE_ROOT}/.env.local" "${WORKSPACE_ROOT}/.env"; do
    if [[ -f "${env_file}" ]]; then
      env_files+=("${env_file}")
    fi
  done

  if (( ${#env_files[@]} == 0 )); then
    return 1
  fi

  awk -F= -v name="${variable_name}" '
    $1 == name {
      value = substr($0, index($0, "=") + 1)
      gsub(/^[[:space:]]+|[[:space:]]+$/, "", value)
      if (value != "") found = 1
    }
    END { exit(found ? 0 : 1) }
  ' "${env_files[@]}" 2>/dev/null
}

if ! has_configured_value "TRIGGER_PROJECT_REF"; then
  echo "[container] Missing TRIGGER_PROJECT_REF in environment, .env.local, or .env."
  exit 1
fi

if ! has_configured_value "TRIGGER_SECRET_KEY"; then
  echo "[container] Missing TRIGGER_SECRET_KEY in environment, .env.local, or .env."
  echo "[container] Authenticate the Trigger.dev CLI or configure the project secret before starting."
  exit 1
fi

# Only start the dev services once. Reusing a live PID avoids destructive
# restarts and reduces cold-start churn in the devcontainer.
if [ -f "${PID_FILE}" ]; then
  EXISTING_PID="$(cat "${PID_FILE}" 2>/dev/null || true)"
  if [ -n "${EXISTING_PID}" ] && kill -0 "${EXISTING_PID}" 2>/dev/null; then
    EXISTING_CMD="$(ps -o cmd= -p "${EXISTING_PID}" 2>/dev/null || true)"
    if printf '%s\n' "${EXISTING_CMD}" | grep -Eq 'next dev|trigger dev|concurrently'; then
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

CONCURRENTLY_BIN="$(command -v concurrently || true)"
if [ -z "${CONCURRENTLY_BIN}" ]; then
  echo "[container] concurrently is not installed; rebuild the devcontainer."
  exit 1
fi

setsid nohup "${CONCURRENTLY_BIN}" \
  --names "next,trigger" \
  --prefix-colors "cyan,magenta" \
  --kill-others-on-fail \
  "npm run dev > ${LOG_DIR}/next.log 2>&1" \
  "npm run trigger:dev > ${LOG_DIR}/trigger.log 2>&1" \
  > "${LOG_DIR}/concurrently.log" 2>&1 < /dev/null &

DEV_PID=$!
echo "${DEV_PID}" > "${PID_FILE}"
echo "${DEV_PID}" > "${LOG_DIR}/dev.pid"
echo "[container] Next.js logs:   tail -f ${LOG_DIR}/next.log"
echo "[container] Trigger logs:   tail -f ${LOG_DIR}/trigger.log"
echo "[container] Dashboard:     http://localhost:3000"

# Wait for Next.js to bind its port. An HTTP probe can trigger slow first-request
# compilation on the mounted workspace and make postStartCommand time out.
for _ in $(seq 1 "${STARTUP_TIMEOUT_SECONDS}"); do
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

echo "[container] Timed out waiting for Next.js. See ${LOG_DIR}/next.log and ${LOG_DIR}/trigger.log"
exit 1
