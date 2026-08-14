---
name: ci-cd
description: >-
  Ghost Pilot's containerization and CI/CD pipeline. Use when editing the
  Dockerfile, docker-compose.yml, .github/workflows/*, scripts/setup_server.sh,
  or debugging VPS/GHCR/Trigger.dev deploys.
---

# CI/CD Skill (Ghost Pilot)

Project-specific rules distilled from the pipeline and containerization setup.
Always check the instruction docs first:
`.github/instructions/devops-docker.instructions.md` and
`.github/instructions/ci-cd.instructions.md`.

## Golden rules

- **Next.js standalone**: runtime image copies only `.next/standalone`,
  `.next/static`, `public`; `CMD ["node","server.js"]` with
  `HOSTNAME=0.0.0.0 PORT=3000 NODE_ENV=production`.
- **Prisma 7 is binary-free in runtime**: `prisma-client` generator +
  `@prisma/adapter-pg`. Run `prisma generate` in the build stage, never at
  runtime. `prisma migrate deploy` runs in CI/CD only.
- **Clerk public vars are build args**; server secrets are runtime env via
  compose `env_file`. Never bake secrets into images; `.env*` is dockerignored.
- **Trigger.dev v4 only**: tasks ship via `npx trigger.dev deploy` in CD
  (needs `TRIGGER_PROJECT_REF`/`TRIGGER_SECRET_KEY`). Never use v3
  `client.defineJob` or `trigger-v3-cli`.
- **Healthcheck** depends on `app/api/health/route.ts` being in Clerk's public
  routes (`proxy.ts` `isPublicRoute`). Don't remove it.
- **Reproducible installs**: `npm ci --no-audit --no-fund` in every job and the
  Dockerfile deps stage; keep `package-lock.json` committed and in sync.
- **Least privilege**: every job declares explicit `permissions` (mostly
  `contents: read`); only `build-push` adds `packages: write`.
- **Immutable deploys**: `docker-compose.yml` uses
  `ghcr.io/dimonikrv/ghost-pilot:${GHOST_PILOT_TAG:-latest}`; CD pins the short
  `sha-<7>` tag (output of build-push), waits for a healthy container, and rolls
  back to the previous tag on failure.
- **Action pinning**: third-party actions are pinned to full commit SHAs with a
  `# vX.Y.Z` comment; let dependabot bump them.

## Workflow rules

- `ci.yml`: five parallel jobs (lint, typecheck, integration tests, build,
  e2e) — e2e downloads the `.next` build artifact and runs Playwright against
  the **production build** (`npm run start`). Playwright report uploaded on
  failure/cancellation; `notify` job posts to Slack if `SLACK_WEBHOOK_URL`.
- `cd.yml` job order (push to `main`): build-push → migrate → {deploy,
  trigger-deploy}. After migrate, the `deploy` (VPS ssh-action) job and
  `trigger-deploy` run in parallel. The `deploy` job is **dormant**: gated
  behind repository variable `ENABLE_VPS_DEPLOY == 'true'` and the `VPS_*`
  secrets. `trigger-deploy` needs `build-push` + `migrate`.
- `ghcr-prune.yml`: weekly `scripts/prune-ghcr.sh` cleanup (keeps newest 5,
  prunes `sha-*`/untagged older than 30 days); no-op without `GHCR_PACKAGES_PAT`.
- `.env*` is gitignored, so all CI/CD config must come from GitHub secrets/vars.

## Verification

- No Docker CLI on the local WSL host → validate image changes in CI.
- Sanity-check locally with `npm run lint`, `npm run typecheck`, `npm run build`,
  and `docker compose config`.
