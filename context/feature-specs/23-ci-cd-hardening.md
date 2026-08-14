# 23 — CI/CD Pipeline Hardening

Harden the existing CI/CD pipeline for reliability, security, performance,
scalability, maintainability, reproducibility, and observability. No new product
features. All changes are validated against the NFR audit findings.

## Goal

Bring `.github/workflows/ci.yml`, `.github/workflows/cd.yml`, `Dockerfile`,
`docker-compose.yml`, `playwright.config.ts`, and the pipeline docs
(`.github/instructions/`) in line with the non-functional requirements below.
Work is executed in order P0 → P1 → P2, one item at a time.

## Non-Functional Requirements

- **Reliability**: fail fast with meaningful errors; `npm ci` reproducible
  installs; gate deploy stages on prior success; post-deploy healthcheck with
  automatic rollback.
- **Security**: least-privilege `permissions` on every job; SHA-pinned
  third-party actions; no secrets in logs.
- **Performance**: parallel CI jobs, job-level caching, e2e against a
  production build (not `npm run dev`).
- **Scalability**: CI that scales with the test suite (sharding-ready),
  immutable deploy artifacts (`sha-*` tags).
- **Maintainability**: dependabot, `.nvmrc`, `CODEOWNERS`, docs kept in sync
  with the pipeline.
- **Observability**: test reports uploaded on failure, optional failure
  notifications.

## Implementation

### P0 — correctness & security floor

#### P0-1: Reproducible installs (`npm ci`)

- `package-lock.json` verified in sync (`npm install --package-lock-only` reported
  "up to date", no diff) — no regeneration needed.
- Replace `npm install --no-audit --no-fund` with `npm ci --no-audit --no-fund`
  in:
  - `.github/workflows/ci.yml`
  - `.github/workflows/cd.yml` (all jobs that install)
  - `Dockerfile` deps stage

#### P0-2: Least-privilege `permissions`

- Add `permissions: contents: read` to every job in `ci.yml` and `cd.yml`
  (top-level for `ci.yml`; per-job for `cd.yml` where only `build-push` needs
  `packages: write`).

#### P0-3: E2E against production build

- Change `playwright.config.ts` `webServer.command` from `npm run dev` to
  `npm run start` (production server; `NODE_ENV=production`, `PORT`).
- CI runs `npm run build` before Playwright so `next start` has an artifact.

### P1 — deployment & pipeline structure

#### P1-4: Gate `trigger-deploy` on `migrate`

- `cd.yml`: `trigger-deploy.needs` → `[build-push, migrate]`.

#### P1-5: Post-deploy healthcheck + rollback

- Deploy step waits for the container healthcheck to become healthy
  (`docker inspect -f '{{.State.Health.Status}}'`).
- On failure: roll back to the previous `sha-*` tag and exit non-zero.

#### P1-6: Immutable deploy tags

- `docker-compose.yml`: `image: ghcr.io/dimonikrv/ghost-pilot:${GHOST_PILOT_TAG:-latest}`
- `cd.yml` deploy job passes `GHOST_PILOT_TAG=sha-<shortsha>` (immutable) instead
  of `latest`.

#### P1-7: Parallel CI + caching

- Split `ci.yml` into parallel jobs: `lint`, `typecheck`, `test` (integration),
  `build`, `e2e` (needs build artifact).
- Caches: `.next`, Playwright browsers (`~/.cache/ms-playwright`), npm cache via
  `setup-node cache: npm`.
- e2e job downloads `.next` artifact and runs Playwright against the production
  build; upload `playwright-report` on failure.

### P2 — governance & maintenance

#### P2-8: Repo governance files

- `.github/dependabot.yml` — npm + GitHub Actions, weekly, grouped.
- `.nvmrc` — Node LTS pinned (match `engines.node`).
- `CODEOWNERS` — owner for `.github/**`, Dockerfile, workflows.

#### P2-9: SHA-pin third-party actions

- Resolve current SHAs (via GitHub API) and pin `actions/checkout`,
  `actions/setup-node`, `actions/cache`, `actions/upload-artifact`,
  `actions/download-artifact`, `docker/*-action`, `appleboy/ssh-action` to full
  commit SHAs. Consider upgrading `checkout`/`setup-node` to current majors.

#### P2-10: GHCR retention

- Add a scheduled cleanup for stale `sha-*` image versions (keep last N,
  delete untagged), gated behind a secret/PAT so it no-ops without it.

#### P2-11: Runtime image cleanup

- Remove `util-linux` and `procps` from the runner image (no runtime usage;
  verified by code search).

#### P2-12: Observability

- Always upload test reports on failure/cancellation.
- Optional failure notifications (gated behind a webhook secret).

### Docs

- Update `.github/instructions/ci-cd.instructions.md` and
  `devops-docker.instructions.md` to match the final pipeline shape.
- Keep `AGENTS.md` DevOps section and the `devops`/`ci-cd` skills consistent.

## Scope Limits

- No product/feature code changes (except `playwright.config.ts` webServer).
- No local Docker validation (no Docker CLI on host) — image changes verified in
  CI.
- `deploy` job stays dormant (gated on `ENABLE_VPS_DEPLOY == 'true'` + `VPS_*`
  secrets).

## Verify When Done

- [x] `npm ci` used everywhere; `package-lock.json` in sync
- [x] Every job declares explicit `permissions`
- [x] Playwright runs against production build in CI
- [x] `trigger-deploy` depends on `migrate`
- [x] Deploy healthcheck + rollback implemented (dormant path)
- [x] Compose uses `GHOST_PILOT_TAG`; deploys use `sha-*`
- [x] CI split into parallel jobs with caching
- [x] dependabot / `.nvmrc` / `CODEOWNERS` present
- [x] Third-party actions SHA-pinned
- [x] GHCR cleanup scheduled; `util-linux`/`procps` removed from image
- [x] Test reports uploaded on failure
- [x] Docs (`instructions`, `AGENTS.md`, skills) in sync
- [x] `npm run lint` and `npm run typecheck` pass
- [x] `npm run build` passes (requires `NODE_ENV=production`; this dev shell
      exports `NODE_ENV=development` which triggers a known Next.js 16
      `/_global-error` prerender bug — CI has a clean env)
- [x] `docker compose config` validates via YAML parse (no Docker CLI locally;
      image changes verified in CI)
