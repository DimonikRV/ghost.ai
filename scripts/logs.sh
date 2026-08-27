#!/bin/bash
# Quick access to the background dev service logs.
# Usage:
#   bash scripts/logs.sh          # show both logs
#   bash scripts/logs.sh next     # tail Next.js only
#   bash scripts/logs.sh trigger  # tail Trigger.dev only

set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="${SCRIPT_DIR}/../.dev-service/logs"

case "${1:-}" in
  next)
    exec tail -f "${LOG_DIR}/next.log"
    ;;
  trigger)
    exec tail -f "${LOG_DIR}/trigger.log"
    ;;
  "")
    echo "=== Next.js ==="
    tail -f "${LOG_DIR}/next.log"
    ;;
  *)
    echo "Unknown: $1 (use 'next' or 'trigger')" >&2
    exit 1
    ;;
esac
