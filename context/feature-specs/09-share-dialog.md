Wire the existing Share2 button in the workspace navbar (`components/editor/workspace-shell.tsx`) to open a share dialog. The button already exists with `aria-label="Share project"` but has no `onClick` handler.

## Owners vs Collaborators

Owners can:
- invite collaborators by email
- view current collaborators
- remove collaborators (revoke access)
- copy the project link with temporary 'Copied!' toast notification

Collaborators can:
- view collaborator's list only
- not invite, remove, or manage access

## Share Link Format

The share link is `window.location.origin + /editor/[projectId]`. This is a simple deep-link — collaborators must already be in the database to access it (enforced server-side via `checkProjectAccess`). No token-based invitation flow.

## Clerk User Data

Collaborators are stored by email in the database.

Use `@clerk/backend` (`clerkClient.users.getUserList()`) to enrich collaborator emails with:

- display name (from `firstName`, `lastName`, or `username`)
- avatar image (from `imageUrl`)

If a Clerk user is not found for an email, fall back to displaying the email address only.

Batch-fetch all collaborator profiles in a single `getUserList` call to minimize API requests.

## Component Structure

Create `components/editor/share-dialog.tsx` following the existing dialog pattern:

- Props: `open`, `onOpenChange`, `projectId`, `isOwner`, `collaborators`, `isLoading`
- Controlled `open`/`onOpenChange` (same pattern as create/rename/delete dialogs)
- Import from `@/components/editor/dialog-pattern` for dialog primitives
- Email input field (owner only) with "Invite" button
- Collaborator list with avatar/name/email and remove button (owner only)
- "Copy link" button with inline "Copied!" text feedback (owner only)
- Read-only collaborator list for non-owners

## Dialog State Management

Manage share dialog state locally within `WorkspaceShell` (not in `useProjectActions`). The share dialog is workspace-scoped (tied to a specific project), unlike the editor-home dialogs. Follow the same local-state pattern as `sidebarOpen` and `aiSidebarOpen`.

## API Routes

Create `app/api/projects/[projectId]/collaborators/route.ts`:

- **GET** — List collaborators. Allow both owners and collaborators to read. Use `checkProjectAccess()` from `lib/project-access.ts` for access verification — do not re-implement the owner/collaborator check.
- **POST** — Invite collaborator (owner only). Accepts `{ email: string }`.
- **DELETE** — Revoke collaborator (owner only). Accepts `{ collaboratorId: string }` or `{ email: string }`.

Enforce ownership server-side for POST and DELETE using the existing pattern: `auth()` → fetch project → `project.ownerId === userId` → 403 if not owner.

**Clerk client:** Use `clerkClient()` from `@clerk/nextjs/server` (not `createClerkClient`). This is the idiomatic Next.js pattern — it returns a promise and benefits from internal caching:

```typescript
import { clerkClient } from "@clerk/nextjs/server";

const client = await clerkClient();
const users = await client.users.getUserList({ emailAddress: emails });
```

Don't add a local user table.

## Validation

- Validate email format (basic regex or `trim()` + non-empty check)
- Return 400 with `{ error: "User is already a collaborator" }` if email already exists (check before insert, don't rely on DB constraint)
- Return 400 with `{ error: "Cannot invite the project owner" }` if email matches the owner's Clerk email
- Return 400 with `{ error: "Email is required" }` if email is empty/missing

## WorkspaceShell Props

Extend `WorkspaceShell` props to include:
- `isOwner: boolean`
- `collaborators: { id: string; email: string; createdAt: string }[]`

Pass these from the server component (`app/editor/[projectId]/page.tsx`) using data already available from `getProjectWithAccess()`.

## Check When Done

- Share button in navbar opens the share dialog
- Owner can invite, view, remove, and copy link
- Collaborators see read-only access and cannot invite, remove, or manage access
- Emails, names, and avatar images are enriched with Clerk user data (fallback to email if not found)
- Validation works as expected (duplicate invite, owner invite, empty email)
- `npm run build` passes clean