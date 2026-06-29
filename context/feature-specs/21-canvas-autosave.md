Add autosave and loading for the collaborative canvas so project state is persisted before adding AI generation Canvas JSON should be stored in Versel Blob, and the saved blob URL should be stored on the Prisma project record.

## What to install

- '@vercel/blob'
- Set `BLOB_READ_WRITE_TOKEN` in `.env.local` for Vercel Blob SDK authentication

## Prerequisites

- No Prisma migration needed — the existing `canvasJsonPath` field on the `Project` model will be reused for storing the Vercel Blob URL

## Implementation

1. Reuse the existing `canvasJsonPath` field on the Project model.
   - The field already exists in `prisma/models/project.prisma` as `canvasJsonPath String? @map("canvas_json_path")`
   - Store the Vercel Blob URL here — no schema change required
   - Prisma remains responsible for metadata only

2. Add canvas save/load API routes.
   Both routes must follow the project's existing API pattern:
   - Gate with `auth()` from `@clerk/nextjs/server` for userId extraction
   - Verify project access via `checkProjectAccess()` from `lib/project-access`
   - Return 401 for unauthenticated, 403 for no access, 404 for missing project, 500 for server errors

    Create `PUT /api/projects/[projectId]/canvas`
    This route should:
    - accept JSON body `{ nodes: Node[], edges: Edge[] }`
    - validate that body contains nodes and edges arrays
    - serialize to JSON and upload to Vercel Blob via `put()` with a project-scoped key (e.g. `canvas-{projectId}.json`)
    - store the returned blob URL in the project's `canvasJsonPath` field via Prisma
    - return `{ url: string }` on success

    Create `GET /api/projects/[projectId]/canvas`
    This route should:
    - read the project's `canvasJsonPath` from Prisma
    - if no URL is stored, return 200 with `{ nodes: [], edges: [] }`
    - fetch the canvas JSON from Vercel Blob via `get()`
    - parse and return `{ nodes: Node[], edges: Edge[] }`

3. Add an autosave hook in the `hooks/` folder.
   - Create `hooks/use-canvas-autosave.ts`
   - Accept `nodes` and `edges` as parameters
   - Debounce saves to 2 seconds to avoid excessive writes
   - Save through the PUT canvas API route
   - Expose save status: `'idle' | 'saving' | 'saved' | 'error'`
   - Clean up pending debounce on unmount

4. Load saved canvas state in the editor.
   - When the editor loads, check if the Liveblocks room has any existing nodes or edges
   - If the room is empty and the project has a saved canvas blob URL, fetch and load the saved canvas state via the GET canvas API route
   - If the room already has nodes/edges, skip the load entirely to avoid overwriting active collaboration

5. Add a save status indicator in the workspace navbar.
   - Place in the navbar right section (between AI toggle button and PresenceAvatars)
   - Show small text badge: "Saving…" (muted-foreground), "Saved" (muted-foreground), or "Error" (text-destructive)
   - No button — purely informational

## Storage Pattern

- Prisma stores project metadata and the canvas blob URL
- Vercel Blob stores the actual canvas JSON
- Liveblocks stores real-time collaborative state

## Check When Done

 - [ ] Install @vercel/blob
 - [ ] Reuse existing canvasJsonPath field (no migration needed)
 - [ ] Create canvas save API route (PUT /api/projects/[projectId]/canvas)
 - [ ] Create canvas load API route (GET /api/projects/[projectId]/canvas)
 - [ ] Add autosave hook with debouncing (hooks/use-canvas-autosave.ts)
 - [ ] Load saved state on editor init (in Canvas component)
 - [ ] Add save status indicator in workspace navbar
 - [ ] Review and test end-to-end
 - [ ] 'npm run build' without type errors
 
   

    
