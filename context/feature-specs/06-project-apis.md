The database schema is ready. Build the backend project API routes only.

## Routes

Create REST endpoints for:

- `GET /api/projects` — list current user's projects
- `POST /api/projects` — create project
- `PATCH /api/projects/[projectId]` — rename project
- `DELETE /api/projects/[projectId]` — delete project

## File Structure

- `app/api/projects/route.ts` — GET + POST handlers
- `app/api/projects/[projectId]/route.ts` — PATCH + DELETE handlers

## Rules

Use the authenticated Clerk user ID as `ownerId`. Call `auth()` from `@clerk/nextjs/server` inside each handler to get `userId`.

When creating:

- default missing or empty (after trim) project name to `'Untitled Project'`
- trim whitespace from name before saving
- use the schema's existing ID strategy (`cuid()`), don't generate IDs client-side

Input validation:

- reject names longer than 255 characters with `400`
- treat empty-after-trim names as `'Untitled Project'`
- PATCH with no updatable fields returns `400`

Security:

- unauthenticated requests return `401`
- only the project owner can rename or delete
- non-owner mutations return `403`
- DELETE: return `404` before `403` (check existence before ownership) so non-owners cannot enumerate project IDs

GET pagination:

- support optional `?limit` and `?cursor` query params
- default `limit=50`, max `100`
- order by `createdAt` descending

Keep this backend-only. Don't wire the UI yet.

## Check When Done

- routes exist for list/create/rename/delete
- owner checks are enforced for rename/delete
- `401` and `403` responses are handled correctly
- input validation rejects overly long or empty names
- DELETE returns `404` for non-existent projects before checking ownership
- `npm run build` passes