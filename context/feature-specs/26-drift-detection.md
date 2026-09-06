# 26 — Drift Detection (Diagram vs. Last Export)

After generating a code scaffold from the canvas, detect later whether the architecture diagram has changed since that export and surface a warning that the previously downloaded scaffold is stale. This implements the drift-detection item explicitly deferred in spec 25 ("Don't implement drift detection (diagram vs codebase comparison)").

## Scope

Drift detection compares the **current canvas** against the **canvas at the time of the last completed export** for each framework. It uses an architectural fingerprint that deliberately ignores shape position — moving a node around the canvas is not drift. Any change to node identity (`id`, `label`, `shape`) or edge topology (`source`, `target`, `label`) flips the hash and marks the export as out of date.

Position-independent by design: two canvases with identical topology anywhere on the grid hash identically.

## Stack

| Layer            | Technology                            | Role                                                    |
| ---------------- | ------------------------------------- | ------------------------------------------------------- |
| Fingerprint      | `node:crypto` SHA-256                 | Deterministic, order-independent canvas hash            |
| Fingerprint lib  | `lib/export/canvas-hash.ts`           | Shared hashing used by the export POST route + drift API |
| Track            | Prisma 7 + PostgreSQL (`ExportRun`)   | Store `canvas_hash` on each export run                  |
| Drift API        | Next.js route handler                 | Compare current canvas hash to last completed export    |
| UI               | shadcn Dialog + existing patterns     | Amber warning banner in the export dialog               |

## What This Feature Does

1. When a code export is triggered (`POST /api/export/code`), compute a fingerprint of the canvas the export is generated from and store it on the `ExportRun` as `canvasHash`.
2. `GET /api/projects/:projectId/drift` reads the **current** saved canvas, computes its fingerprint, and compares it to the most recent completed `ExportRun` (optionally filtered by `?framework=`).
3. If the fingerprints differ, the export dialog shows a warning that the last generated scaffold is out of date and should be regenerated.

## Design

### Displacement invariance

The fingerprint ignores `position` entirely. Relocating shapes or reordering the canvas is not architectural drift. Only identity and topology changes count:

- Node: `id`, `data.label`, `data.shape`
- Edge: `source`, `target`, `data.label`

### Canonical fingerprint

```
sha256( JSON({ nodes: [ "id","label","shape" ] sorted, edges: [ "source","target","label" ] sorted }) )
```

Sorting makes the hash order-independent; SHA-256 makes collisions effectively impossible. Nodes/edges that lack the expected string fields degrade gracefully to empty strings so parsed blob JSON never throws.

### Per-framework comparison

A scaffold for `docker-compose` maps nodes to services while a `spring-boot` scaffold maps them to classes. Drift is only meaningful when comparing against the same framework's prior export, so the drift API filters by `framework`. The general (no-framework) query returns the latest export across all frameworks and is used to show drift before a framework is selected.

### Unknown-canvas handling

If the current canvas blob can't be read, the API returns `comparable: false` and `drifted: false` so the client hides the banner rather than guessing.

## Implementation

### `lib/export/canvas-hash.ts`

New module exporting:

- `fingerprintCanvas(nodes: unknown[], edges: unknown[]): string` — normalizes each entry to its identity tuple, sorts, JSON-serializes, and returns a SHA-256 hex digest.
- `hashCanvas(canvas: { nodes?: unknown[]; edges?: unknown[] }): string` — convenience wrapper defaulting missing arrays to empty.

Both tolerate malformed entries (non-objects, missing fields) via defensive coercion.

### `prisma/models/export-run.prisma`

Add a nullable column:

```prisma
canvasHash String? @map("canvas_hash") // fingerprint of the canvas this export was generated from
```

New migration `prisma/migrations/<ts>_add_export_canvas_hash/migration.sql`:

```sql
ALTER TABLE "export_runs" ADD COLUMN "canvas_hash" TEXT;
```

Legacy rows have `NULL` and are never selected as drift candidates (the drift query requires `canvasHash IS NOT NULL`).

### `app/api/export/code/route.ts` (POST)

After the empty-canvas guard, compute `const canvasHash = hashCanvas(canvasJson)` and include it in the `prisma.exportRun.create` data. No change to the Trigger.dev payload — the hash is derived from the same `canvasJson` sent to the task.

### `app/api/projects/[projectId]/drift/route.ts` (GET)

- Auth: `auth()` + `checkProjectAccess` (401 / 404 / 403).
- Query the most recent completed `ExportRun` for the project where `canvasHash` is not null, filtered by `?framework=` when present; order by `createdAt desc`.
- If none → `{ hasExport: false, drifted: false }`.
- Read the current canvas from `project.canvasJsonPath`, compute `hashCanvas`, compare.
- Return `{ hasExport, framework, lastExportAt, drifted, comparable }`.

### `components/editor/export-dialog.tsx`

- On open, fetch drift (no framework) alongside the existing `fetchCanvasState()`.
- When a framework is selected, refetch drift scoped to that framework.
- Reset drift state when the dialog closes.
- Render a non-blocking amber banner (using `AlertTriangle`) above the Generate button when `hasExport && comparable && drifted`:

> Your last export is out of date — the canvas changed since it was generated. Re-export to refresh the scaffold.

The banner is informational; regeneration uses the existing "Generate & Download ZIP" button.

## Dependencies

- `node:crypto` (built-in, already used)
- No new packages.

## Verify When Done

- [ ] `tests/unit/lib/export/canvas-hash.test.ts` passes (determinism, order-independence, position insensitivity, label/shape/edge/node sensitivity, malformed input tolerance)
- [ ] `tests/integration/api/drift.test.ts` passes (401/403/404, no-export, pending-only, match, drift, framework filter, unreadable canvas)
- [ ] `tests/components/export-dialog.test.tsx` drift tests pass (banner shown when drifted, hidden when not)
- [ ] `tests/integration/api/export/code.test.ts` still passes (POST writes canvasHash)
- [ ] `prisma generate` and `prisma validate` succeed
- [ ] Migration `add_export_canvas_hash` applies cleanly
- [ ] No TypeScript errors (excluding pre-existing `.next/types` stale reference)
- [ ] No lint errors
- [ ] No console errors
- [ ] Build passes
- [ ] Responsive at mobile and desktop