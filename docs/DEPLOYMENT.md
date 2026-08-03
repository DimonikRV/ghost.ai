# Ghost Pilot — Deployment Manual

Complete, step-by-step guide to ship Ghost Pilot to production. The pipeline is
fully GitHub-hosted: CI validates every push, CD builds the Docker image, applies
database migrations, and deploys the Trigger.dev tasks. There is **no VPS
involved in the current setup** — the VPS deploy step exists in the workflow but
is dormant until you opt in (see "Enable VPS deployment later").

---

## Architecture at a glance

```
push to development / PR
        │
        ▼
   ci.yml ── npm install → prisma generate → migrate deploy (test DB)
              → lint → typecheck → build → Playwright e2e
        │
push to main
        ▼
   cd.yml ── build-push (GHCR image latest + sha-*)
              → migrate (prod DATABASE_URL)
              → trigger-deploy (npx trigger.dev deploy)
        │
   VPS deploy job ── dormant (skipped unless ENABLE_VPS_DEPLOY=true)
```

- **CI** runs on every PR and every push to `main`/`development`.
- **CD** runs only on pushes to `main` (plus manual `workflow_dispatch`).
- Database is **cloud Prisma Postgres** — no database runs inside the pipeline or
  on any server.

---

## Prerequisites

- A machine with **Node 22** and a working `npm` (for step 1 only; the local WSL
  host may be too slow to install packages — use any other machine or a
  Codespace).
- Admin access to the GitHub repo `DimonikRV/ghost.ai`.
- Accounts: Clerk, Trigger.dev, Prisma Postgres (all already in use by the app).

---

## Step 1 — Regenerate `package-lock.json` (recommended, usually already done)

The lockfile was stale after the Trigger.dev v3→v4 / Prisma 6→7 migration.
CI/CD currently uses `npm install` so a stale lockfile won't break the pipeline,
but regenerating it keeps installs deterministic.

```bash
git clone https://github.com/DimonikRV/ghost.ai.git
cd ghost.ai
npm install --no-audit --no-fund   # regenerates package-lock.json
git add package-lock.json
git commit -m "chore(deps): regenerate package-lock.json"
git push
```

Verify the key versions:

```bash
npm ls @trigger.dev/sdk prisma
# expect @trigger.dev/sdk@4.5.9 and prisma@7.9.1
```

### Optional: switch CI/CD back to `npm ci`

Once a fresh lockfile is committed you may switch the three install steps back to
`npm ci` for fully reproducible installs:

- `.github/workflows/ci.yml` — the "Install dependencies" step
- `.github/workflows/cd.yml` — both the migrate and trigger-deploy jobs
- `Dockerfile` — the `deps` stage

---

## Step 2 — Configure GitHub secrets

Go to **github.com/DimonikRV/ghost.ai → Settings → Secrets and variables →
Actions** and create the following repository secrets (names must match exactly).

| Secret | Value / where to get it |
|---|---|
| `CLERK_PUBLISHABLE_KEY` | Clerk dashboard → **API Keys** → publishable key (`pk_test_...`) |
| `CLERK_SIGN_IN_URL` | `/sign-in` |
| `CLERK_SIGN_UP_URL` | `/sign-up` |
| `CLERK_AFTER_SIGN_IN_URL` | `/editor` |
| `CLERK_AFTER_SIGN_UP_URL` | `/editor` |
| `CLERK_AFTER_SIGN_OUT_URL` | `/sign-in` |
| `DATABASE_URL` | Production Prisma Postgres pooled connection string |
| `TRIGGER_PROJECT_REF` | Trigger.dev dashboard → project ref (`proj_xxx`) |
| `TRIGGER_SECRET_KEY` | Trigger.dev dashboard → **API keys** → secret key (`tr_xxx`) |
| `CI_CLERK_PUBLISHABLE_KEY` *(optional)* | Any valid Clerk publishable key; CI falls back to a placeholder if absent |

The six Clerk URL values must match `.env.example` or the app's redirect paths
will point at stale locations.

---

## Step 3 — Push to `main`: CI validates, CD deploys

The pipeline is fully automated. The typical workflow:

```bash
# work on development, then integrate and ship
git checkout development
git add -A
git commit -m "..."
git push origin development        # CI runs (validation only)

git checkout main
git merge development              # bring development into main
git push origin main               # CI + CD run (production deploy)
```

### What happens on the `main` push

1. **ci.yml** — `npm install` → `prisma generate` → `prisma migrate deploy`
   (against a disposable Postgres service container) → lint → typecheck →
   `npm run build` → Playwright e2e.
2. **cd.yml → build-push** — builds and pushes
   `ghcr.io/dimonikrv/ghost-pilot:latest` and `:sha-<hash>`, with the six
   `NEXT_PUBLIC_CLERK_*` values passed as build args.
3. **cd.yml → migrate** — `npx prisma migrate deploy` against the production
   `DATABASE_URL`.
4. **cd.yml → trigger-deploy** — `npx trigger.dev deploy` ships the `trigger/`
   tasks to the Trigger.dev cloud.
5. **cd.yml → deploy (VPS)** — skipped by default (see below).

### Verify the deployment

- **Actions**: `github.com/DimonikRV/ghost.ai/actions` — CI job green; CD jobs
  build-push, migrate, trigger-deploy green (deploy job shows "skipped").
- **Image**: `github.com/DimonikRV/ghost.ai/pkgs/container/ghost-pilot` — a new
  version with `latest` + `sha-*` tags.
- **Tasks**: Trigger.dev dashboard → your project → Deployments shows the new
  deployment.

---

## Enable VPS deployment later (optional)

When you're ready to run the app on a server:

1. Add the VPS secrets: `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY` (private key whose
   public half is in the VPS `~/.ssh/authorized_keys`), and optional `VPS_PORT`.
2. Add the repository **variable** `ENABLE_VPS_DEPLOY=true` (and optionally
   `VPS_APP_DIR`, default `/opt/ghost-pilot`).
3. On the VPS, run the one-time bootstrap:

   ```bash
   sudo bash scripts/setup_server.sh
   ```

   This installs Docker, creates `/opt/ghost-pilot`, downloads
   `docker-compose.yml`, and scaffolds `.env.production`. Fill in real values
   (Clerk secret key, `DATABASE_URL`, Liveblocks, Trigger.dev, etc.).

4. The next `main` push will also SSH-deploy the container via
   `docker compose pull app && docker compose up -d app`.

> The setup script downloads `docker-compose.yml`/`.env.example` from `main`, so
> it must run after the files exist on `main`.

---

## Troubleshooting

| Symptom | Likely cause / fix |
|---|---|
| CI fails at `npm ci` | Stale lockfile — rerun Step 1, or the workflow still uses `npm ci`. |
| CD `build-push` fails | A `CLERK_*` secret is missing/empty — check Step 2. |
| CD `migrate` fails | `DATABASE_URL` secret wrong or unreachable. |
| CD `trigger-deploy` fails | `TRIGGER_PROJECT_REF`/`TRIGGER_SECRET_KEY` missing or expired. |
| Deploy job shows "skipped" | Expected — VPS deploy is dormant. Set `ENABLE_VPS_DEPLOY=true` to enable. |
| E2E failures on auth pages | Invalid `CI_CLERK_PUBLISHABLE_KEY` or dummy fallback used. |
| Rollback | Re-run a previous commit: Actions → the `cd` workflow → **Run workflow** → choose the commit, or redeploy an old image tag (`ghcr.io/dimonikrv/ghost-pilot:sha-<old>`). |
