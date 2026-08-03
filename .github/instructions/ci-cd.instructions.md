# CI/CD Pipeline Instructions (Ghost Pilot)

The pipeline runs on **GitHub-hosted runners** (`ubuntu-latest`). The app is
pushed to GHCR and deployed to a VPS over SSH via Docker Compose.

## Dependency installation notes

CI/CD uses `npm install` (not `npm ci`) because `package-lock.json` is stale
(after the Trigger.dev v3→v4 / Prisma 6→7 migration) and cannot be regenerated
on the slow local WSL host. Once the lockfile is regenerated on a machine with
working npm (`npm install`, then commit it), prefer switching CI/CD back to
`npm ci` for reproducible installs.

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

Variables (optional):
- `VPS_APP_DIR` — default `/opt/ghost-pilot` (must match `scripts/setup_server.sh`).

## ci.yml

Triggered on PR + push to `main`/`development`. One job:
`npm install` → `prisma generate` → `prisma migrate deploy` (against a Postgres
**service container**) → `npm run lint` → `npm run typecheck` → `npm run build`
→ Playwright Chromium e2e → upload report on failure.

## cd.yml

Triggered on push to `main`. Four jobs, ordered:

1. **build-push** — buildx + login GHCR + build/push `ghcr.io/dimonikrv/ghost-pilot`
   with `latest` + `sha-<hash>` tags, GHA layer cache, `NEXT_PUBLIC_*` build args.
2. **migrate** — `npm install` + `npx prisma migrate deploy` against prod `DATABASE_URL`
   (runs before the app swap so schema is ready).
3. **deploy** — `appleboy/ssh-action` → VPS: `docker compose pull app`,
   `docker compose up -d --remove-orphans app`, prune old images.
   **Dormant by default**: gated behind the repository variable
   `ENABLE_VPS_DEPLOY == 'true'`. Until that is set (and the `VPS_*` secrets
   exist) the job is skipped.
4. **trigger-deploy** — `npx trigger.dev deploy` to ship `trigger/` tasks.
   Depends only on `build-push`, so it runs even while the VPS deploy is skipped.

Order matters: migrate before deploy; trigger-deploy after build-push.

## One-time server setup

`sudo bash scripts/setup_server.sh` installs Docker + compose, creates the app
dir (default `/opt/ghost-pilot`), downloads `docker-compose.yml`, and scaffolds
`.env.production` from `.env.example`. Fill real values there; do not commit them.

## Local verification without Docker

No Docker CLI exists on the WSL host; image builds are validated in CI. Locally
you can run `npm run lint`, `npm run typecheck`, `npm run build`, and
`docker compose config` to sanity-check compose.
