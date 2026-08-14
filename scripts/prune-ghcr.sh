#!/usr/bin/env bash
# ============================================================
# Prune stale Ghost Pilot container images from GHCR.
#
# The package is user-scoped (dimonikrv/ghost-pilot), so this
# needs a PAT with `read:packages` + `delete:packages` scopes and
# admin rights on the package. It is a no-op unless that token is
# provided, so it can run on a schedule safely.
#
# Policy:
#   - keep the KEEP_LAST most recent versions (by created_at)
#   - never touch the `latest` tag or any non-sha-* custom tag
#   - prune sha-* and untagged versions older than KEEP_YOUNGER_THAN_DAYS
#
# Usage:
#   GHCR_PACKAGES_PAT=... bash scripts/prune-ghcr.sh
#   DRY_RUN=true GHCR_PACKAGES_PAT=... bash scripts/prune-ghcr.sh
# ============================================================

set -euo pipefail

GHCR_USER="${GHCR_USER:-dimonikrv}"
GHCR_PACKAGE="${GHCR_PACKAGE:-ghost-pilot}"
KEEP_LAST="${KEEP_LAST:-5}"
KEEP_YOUNGER_THAN_DAYS="${KEEP_YOUNGER_THAN_DAYS:-30}"
DRY_RUN="${DRY_RUN:-false}"

if [ -z "${GHCR_PACKAGES_PAT:-}" ]; then
  echo "GHCR_PACKAGES_PAT not set; skipping prune."
  exit 0
fi

export GH_TOKEN="$GHCR_PACKAGES_PAT"

cutoff_epoch=$(( $(date +%s) - KEEP_YOUNGER_THAN_DAYS * 86400 ))

# All versions, newest first: id, name, created_at, tags
versions_json=$(gh api --paginate "/user/packages/container/${GHCR_PACKAGE}/versions" --jq \
  'sort_by(.created_at) | reverse | map({id, name, created_at, tags: (.metadata.container.tags // [])})')

# Count of versions we will always keep (KEEP_LAST), newest first.
keep=0
pruned=0

while IFS= read -r line; do
  id="${line%%|*}"
  rest="${line#*|}"
  created_at="${rest%%|*}"
  tags="${rest#*|}"
  created_epoch=$(date -d "$created_at" +%s)

  # Never touch the newest KEEP_LAST versions.
  if [ "$keep" -lt "$KEEP_LAST" ]; then
    keep=$((keep + 1))
    echo "[keep] version $id ($created_at)"
    continue
  fi

  # Never touch anything newer than the cutoff.
  if [ "$created_epoch" -ge "$cutoff_epoch" ]; then
    echo "[keep] version $id ($created_at) is recent"
    continue
  fi

  # Only prune untagged versions and sha-* tagged versions.
  sha_only=1
  for tag in $tags; do
    if [ "$tag" != "latest" ] && [[ "$tag" != sha-* ]]; then
      echo "[keep] version $id has protected tag '$tag'"
      sha_only=0
      continue 2
    fi
  done
  if [ "$sha_only" -eq 0 ]; then
    continue
  fi

  echo "[prune] version $id ($created_at) tags=[${tags// /,}]"
  if [ "$DRY_RUN" != "true" ]; then
    gh api --method DELETE "/user/packages/container/${GHCR_PACKAGE}/versions/${id}" --silent
    pruned=$((pruned + 1))
  else
    pruned=$((pruned + 1))
  fi
done <<< "$(echo "$versions_json" | jq -r '.[] | [.id, .created_at, (.tags | join(" "))] | join("|")')"

echo "Done. kept=${keep} would_prune/pruned=${pruned} dry_run=${DRY_RUN}"
