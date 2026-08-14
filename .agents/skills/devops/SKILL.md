---
name: devops
description: >-
  Ghost Pilot DevOps standards for CI/CD: robustness, reliability, scalability,
  and maintainability. Use when designing, auditing, or extending
  .github/workflows/*, the Dockerfile, docker-compose.yml,
  scripts/setup_server.sh, or hardening pipeline reliability, quality gates,
  or deploy/rollback behavior. Load alongside the ci-cd skill (project
  specifics) and the installed external skills github-actions-generator and
  github-actions-validator (generic GitHub Actions best practices + validation).
---

# DevOps Skill (Ghost Pilot)

Standards for keeping the pipeline robust, reliable, scalable, and maintainable.
The `ci-cd` skill holds project-specific rules and file references; this skill
holds the quality bar any pipeline work must meet. Load both for pipeline edits.
For generic GitHub Actions authoring/auditing, also load
`github-actions-generator` and `github-actions-validator`.

## The four pillars

### Robustness

- Reproducible installs: `npm ci --no-audit --no-fund` everywhere; keep
  `package-lock.json` current and committed.
- Pin every third-party action to a verified full 40-character commit SHA and
  keep them fresh via dependabot (npm + GitHub Actions). Do not fall back to
  mutable major tags.
- Single source of truth for the Node version (`.nvmrc`) — workflows,
  Dockerfile, and `engines` must all match it.
- Least privilege: set `permissions:` on every job (`contents: read` minimum);
  never request secrets a job does not use.
- No silent dummy-secret drift: placeholder Clerk keys are OK in CI only when
  the affected paths are visibly not validated there.

### Reliability

- Migrations gate releases: anything that depends on the schema waits on the
  migrate step completing successfully.
- Post-deploy verification: after `docker compose up`, check `/api/health`; on
  failure roll back to the previous image rather than leaving a broken release.
- Deploys serialize (`cancel-in-progress: false`); CI cancels superseded runs.
- On failure: upload test artifacts, surface errors, and notify.

### Scalability

- Prefer parallel CI jobs over one long serial job; split lint/typecheck/build/
  tests and keep each fast.
- Cache the expensive layers: `.next`, Prisma client, Playwright browsers, npm.
- Keep test time low; shard e2e when it grows.

### Maintainability

- DRY: shared install/generate steps belong in a composite action or reusable
  workflow, not duplicated across ci.yml / cd.yml jobs.
- CODEOWNERS covers `.github/**`, Dockerfile, compose, and setup scripts.
- `.github/instructions/*.instructions.md` must stay in sync with the files they
  document — update them in the same change.
- Every pipeline change ships with a verification plan (see below).

## Current-state rules (from ci-cd skill)

- `ci.yml`: five parallel jobs — lint, typecheck, integration tests (Postgres
  service container), build (uploads `.next` artifact), e2e (needs build; runs
  Playwright against the production build `npm run start`). Report uploaded on
  failure/cancellation; Slack `notify` job if `SLACK_WEBHOOK_URL`.
- `cd.yml`: build-push → migrate → {deploy, trigger-deploy}. After migrate,
  `deploy` and `trigger-deploy` run in parallel. `deploy` is dormant (repo var
  `ENABLE_VPS_DEPLOY == 'true'` + `VPS_*` secrets); it pins
  `GHOST_PILOT_TAG=sha-<7>`, waits for a healthy container, and rolls back on
  failure. `trigger-deploy` needs build-push + migrate.
- `ghcr-prune.yml`: weekly `scripts/prune-ghcr.sh`; no-op without
  `GHCR_PACKAGES_PAT`.
- All third-party actions SHA-pinned with `# vX.Y.Z` comments.
- `.env*` is gitignored/dockerignored; CI/CD config comes from secrets/vars.

## Hardening roadmap (ordered)

1. ✅ Regenerate `package-lock.json`; switch CI/CD to `npm ci`.
2. ✅ Restructure CI into parallel jobs + caching (`.next`, Prisma, Playwright) +
   `permissions: contents: read`.
3. ✅ CD: gate `trigger-deploy` on `migrate`; add post-deploy healthcheck + rollback
   to the deploy script.
4. ✅ Repo hygiene: dependabot (npm + Actions), `.nvmrc`, CODEOWNERS for `.github/**`.
5. ✅ SHA-pin third-party actions; GHCR prune workflow.
6. Optional: staging environment + reusable workflows.

## Verification checklist (apply to any pipeline change)

- [ ] `npm run lint`, `npm run typecheck`, `npm run build`, `docker compose config`
      pass locally (no Docker CLI on host → image changes validated in CI).
- [ ] Lockfile/deps unchanged unless the change intentionally updates them.
- [ ] No new secrets baked into images; `NEXT_PUBLIC_*` only as build args.
- [ ] Dormant/disabled jobs stay explicitly gated; job `needs` reflect real
      dependencies (e.g. DB-dependent steps wait on migrate).
- [ ] Instruction docs updated to match.
