#!/usr/bin/env bash
#
# One-time VPS provisioning for Ghost Pilot.
# Installs Docker + Compose plugin, creates the app directory, and
# scaffolds the deploy files. Run as root or with sudo on a fresh
# Ubuntu/Debian server.
#
# Usage:
#   sudo bash scripts/setup_server.sh [APP_DIR]
#
set -euo pipefail

APP_DIR="${1:-/opt/ghost-pilot}"

echo "==> Installing Docker (apt) + Compose plugin"
if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com | sh
  systemctl enable --now docker
fi
docker compose version >/dev/null 2>&1 || {
  echo "ERROR: docker compose plugin missing. Install it then re-run." >&2
  exit 1
}

echo "==> Creating app directory: ${APP_DIR}"
mkdir -p "${APP_DIR}"
cd "${APP_DIR}"

echo "==> Scaffolding files"
if [ ! -f docker-compose.yml ]; then
  curl -fsSL -o docker-compose.yml \
    https://raw.githubusercontent.com/DimonikRV/ghost.ai/main/docker-compose.yml
fi
if [ ! -f .env.production ]; then
  curl -fsSL -o .env.production \
    https://raw.githubusercontent.com/DimonikRV/ghost.ai/main/.env.example
  echo
  echo ">>> Edit ${APP_DIR}/.env.production with real values, then run:"
  echo "    cd ${APP_DIR} && docker compose pull app && docker compose up -d app"
else
  echo "    .env.production already present (left untouched)"
fi

echo "==> Done. Next steps:"
echo "    1. Fill in ${APP_DIR}/.env.production"
echo "    2. docker compose pull app && docker compose up -d app"
echo "    3. The app listens on port 3000. Point a reverse proxy (Caddy/Nginx) at it for TLS."
