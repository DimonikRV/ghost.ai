# CI/CD Pipeline Instructions (Ghost Pilot)

The pipeline runs on **GitHub-hosted runners** (`ubuntu-latest`). The app is
pushed to GHCR and deployed to a VPS over SSH via Docker Compose.

## Dependency installation notes

CI/CD uses `npm ci --no-audit --no-fund` (reproducible installs) everywhere —
`ci.yml`, `cd.yml`, and the `Dockerfile` deps stage. `package-lock.json` is
committed and kept in sync (`npm install`, then commit it).

## Secrets to configure in the repo (Settings → Secrets and variables → Actions)

Required for CI:
- `CI_CLERK_PUBLISHABLE_KEY` — optional; safe placeholder fallback is built in.

Required for CD (all mandatory; without them the deploy fails):
- `CLERK_PUBLISHABLE_KEY`, `CLERK_SIGN_IN_URL`, `CLERK_SIGN_UP_URL`,
  `CLERK_AFTER_SIGN_IN_URL`, `CLERK_AFTER_SIGN_UP_URL`,
  `CLERK_AFTER_SIGN_OUT_URL` — public Clerk build args.
- `DATABASE_URL` — production Prisma Postgres URL (used by `prisma migrate deploy`).
- `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY`, `VPS_PORT` (optional, default 22).
- `TRIGGER_PROJECT_REF`, `TRIGGER_SECRET_KEY` — for `npx trigger.dev deploy`.
- `GHCR_PAT` — required for the VPS deploy path when the GHCR package remains
  private; used to pull the image on the server.

Optional:
- `SLACK_WEBHOOK_URL` — sends failure notifications (CI + CD `notify` jobs).
- `GHCR_PACKAGES_PAT` — PAT with `read:packages` + `delete:packages` for the
  weekly GHCR image prune (`ghcr-prune.yml`, user-scoped package).

Variables (optional):
- `VPS_APP_DIR` — default `/opt/ghost-pilot` (must match `scripts/setup_server.sh`).
- `ENABLE_VPS_DEPLOY` — set to `true` to activate the VPS deploy job.

## ci.yml

Triggered on PR + push to `main`/`development`. Five parallel jobs (all with
`permissions: contents: read`):

1. **lint** — `npm ci` → `npm run lint`.
2. **typecheck** — `npm ci` → `prisma generate` → `npm run typecheck`.
3. **test** — Postgres **service container**; `npm ci` → `prisma generate` →
   `prisma migrate deploy` → `npm run test:integration`.
4. **build** — `npm ci` → `prisma generate` → `npm run build` → uploads the
   `.next` artifact (1-day retention) for e2e.
5. **e2e** (needs build) — Postgres service container; `npm ci` → `prisma generate`
   → `prisma migrate deploy` → download `.next` artifact → Playwright Chromium
   against the **production build** (`npm run start`) → upload report on
   failure/cancellation.

A `notify` job posts to Slack (if `SLACK_WEBHOOK_URL` is set) when any job fails.

## cd.yml

Triggered on push to `main`. Jobs, ordered:

1. **build-push** — buildx + login GHCR + build/push
   `ghcr.io/dimonikrv/ghost-pilot` with `latest` + full `sha-<hash>` +
   short `sha-<7>` tags, GHA layer cache, `NEXT_PUBLIC_*` build args. Emits
   `sha_tag` output for the deploy job.
2. **migrate** — `npm ci` + `npx prisma migrate deploy` against prod `DATABASE_URL`
   (runs before the app swap so schema is ready).
3. **deploy** — `appleboy/ssh-action` → VPS: pulls the **pinned `sha-<7>` tag**
   via `GHOST_PILOT_TAG`, `docker compose up -d --remove-orphans app`, waits for
   the container healthcheck to become healthy, and **rolls back to the previous
   tag on failure** (exits non-zero). **Dormant by default**: gated behind the
   repository variable `ENABLE_VPS_DEPLOY == 'true'`. Until that is set (and the
   `VPS_*` secrets exist) the job is skipped.
4. **trigger-deploy** — `npm ci` → `prisma generate` → `npx trigger.dev deploy`
   to ship `trigger/` tasks. Requires `build-push` + `migrate` and runs in
   parallel with `deploy` after `migrate` completes.

A `notify` job posts to Slack (if `SLACK_WEBHOOK_URL` is set) when any job fails.

Order matters: migrate before deploy and trigger-deploy; deploy and
trigger-deploy run in parallel after migrate completes.

## ghcr-prune.yml

Weekly (Mon 03:17 UTC) + manual. Runs `scripts/prune-ghcr.sh`: keeps the newest
5 versions, never removes `latest` or custom tags, prunes `sha-*` and untagged
versions older than 30 days. No-op unless `GHCR_PACKAGES_PAT` is set.

## Action pinning

All third-party actions are pinned to full commit SHAs (with the release tag in
a trailing comment). Dependabot (`github-actions` ecosystem) keeps them current.

## One-time server setup

`sudo bash scripts/setup_server.sh` installs Docker + compose, creates the app
dir (default `/opt/ghost-pilot`), downloads `docker-compose.yml`, and scaffolds
`.env.production` from `.env.example`. Fill real values there; do not commit them.

## Local verification without Docker

No Docker CLI exists on the WSL host; image builds are validated in CI. Locally
you can run `npm run lint`, `npm run typecheck`, `npm run build`, and
`docker compose config` to sanity-check compose.
