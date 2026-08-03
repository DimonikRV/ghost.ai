# 22 — Design Agent API (Backend Wiring)

Set up the backend flow for design generation using Trigger.dev.
This unit handles triggering background jobs, tracking runs, and issuing tokens. No AI logic yet.

## Implementation

### 1. Add the design trigger route.

   Create: `POST /api/ai/design`
   This route should:
   - accept a JSON body with `prompt` (string, required, non-empty, max 4000 chars) and `roomId` (string, required)
   - treat `roomId` as the project ID (consistent with `liveblocks-auth` convention where `roomId === projectId`)
   - verify the current authenticated user has access to the project via `checkProjectAccess(roomId)`
   - trigger the design task through Trigger.dev with payload `{ prompt, roomId }`
   - on successful trigger: create a `TaskRun` record with `runId`, `projectId` (= `roomId`), `userId` (from Clerk `auth()`)
   - return `{ runId }` to the client
   - if `tasks.trigger()` fails: return 502 with error message; do NOT create a `TaskRun` record
   - return 400 if prompt is empty or exceeds 4000 characters
   - return 401 if unauthenticated, 403 if no project access

### 2. Add task run tracking.

   Create a `TaskRun` model in Prisma to track Trigger.dev runs and verify ownership.

   Fields:
   - `id` (auto-generated cuid, primary key)
   - `runId` (string, unique, indexed) — the Trigger.dev run ID
   - `task` (string) — the task identifier (e.g., `"design-agent"`)
   - `projectId` (string)
   - `userId` (string) — Clerk user ID
   - `createdAt` (DateTime, defaults to now)

   Indexes:
   - unique index on `runId`
   - compound index on `userId` + `projectId`

### 3. Add the token route.

   Create: `POST /api/ai/design/token`
   This route should:
   - accept a JSON body with `runId` (string, required)
   - extract `userId` from Clerk `auth()`
   - look up the `TaskRun` record by `runId`
   - verify `taskRun.userId === clerkUserId` — return 403 if mismatch
   - generate a Trigger.dev public token scoped to that specific run via `auth.createPublicToken()`
   - return `{ token }` to the client
   - return 404 if no TaskRun found for the given runId
   - return 401 if unauthenticated

### 4. Create the design task.

   Create `trigger/design-agent.ts`
   - check the existing Trigger.dev setup in `trigger/tasks.ts` for patterns
   - reuse the same `task` import from `@trigger.dev/sdk` (not `client.defineJob`)
   - use `schemaTask` with Zod validation for payload: `{ prompt: z.string(), roomId: z.string() }`
   - export the task as `designAgent`
   - task ID: `"design-agent"`
   - accept the validated payload (`prompt`, `roomId`)
   - log the input for now (`logger.info` or `console.log`)
   - don't add AI logic yet
   - retry: maxAttempts 3, factor 2, minTimeout 1000ms, maxTimeout 10000ms

## Scope Limits

- don't generate nodes or edges yet
- don't call any AI providers
- don't update the canvas
- keep this focused on backend task wiring only

## Check When Done

- `POST /api/ai/design` triggers a background task and returns a run ID.
- Task runs are stored in Prisma with `runId`, `task`, `projectId`, `userId`.
- `POST /api/ai/design/token` returns a run-scoped public token after ownership verification.
- Design task exists in `trigger/design-agent.ts` and is callable.
- `npm run build` passes.