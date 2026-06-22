Set up the realtime collaboration infrastructure using liveblocks.

## Prerequisites

- Add `@liveblocks/node` as a dependency (server-side token generation requires the secret key; client packages alone are insufficient).
- `LIVEBLOCKS_SECRET_KEY` must be set in environment variables.

## Configuration

Edit the existing `liveblocks.config.ts` at the project root.

Define:

### Presence

- `cursor`: `{ x: number; y: number }` — real-time cursor position
- `isThinking`: boolean

### UserMeta

- `id`: string (Clerk userId)
- `info`:
  - `userId`: string
  - `displayName`: string
  - `avatarUrl`: string
  - `role`: `'owner' | 'member' | 'guest'`
  - `cursorColor`: string

## Liveblocks Client

Create a cached Liveblocks node client in `lib/liveblocks.ts`.

The module should:

- Export a singleton `Liveblocks` instance from `@liveblocks/node`, initialized with `LIVEBLOCKS_SECRET_KEY`. Fail-fast with a clear error if the env var is not set.
- Export a helper `getUserCursorColor(userId: string): string` that deterministically maps a userId to a consistent color from a fixed palette using a simple hash (e.g., `hash(userId) % palette.length`). The palette should be 10 distinct, visually distinguishable colors defined as string values in the same file.

## Auth Route

Create `POST /api/liveblocks-auth`.

This route must:

1. Require Clerk authentication via `auth()` — return `401` if unauthenticated.
2. Accept `roomId` (the projectId) from the request body.
3. Verify project access using the existing `checkProjectAccess()` helper from `lib/project-access.ts`.
4. **Create the room explicitly** via `liveblocks.getOrCreateRoom(roomId, ...)`:
   - `defaultAccesses: []` (private room — no anonymous access)
   - `usersAccesses`: give the owner `["room:write"]`; give collaborators `["room:presence:write", "room:read"]`
   - This call is idempotent — safe to invoke on every auth request. Existing room permissions are preserved; new permissions are added.
5. Call `liveblocks.identifyUser({ userId, userInfo: { userId, displayName, avatarUrl, role, cursorColor } })` — this is the recommended ID token method (not access tokens).
6. Return `{ token: body, status }` with the same status code Liveblocks returns — this is the response shape expected by the Liveblocks client SDK.

Return `400` if `roomId` is missing.
Return `403` if the user has no access to the project.
Return `500` if `LIVEBLOCKS_SECRET_KEY` is not configured.

### Room permission model

| Role | Permissions |
|------|-------------|
| Owner | `room:write` (full read/write on presence + storage) |
| Collaborator (member) | `room:presence:write` (can broadcast presence/cursors), `room:read` (can read storage) |

### Why ID tokens over access tokens

Access tokens encode permissions into the token itself, meaning stale tokens can carry outdated permissions. ID tokens check permissions against room state on each connection, giving finer-grained control. Per Liveblocks best practices, ID tokens are the recommended method.
