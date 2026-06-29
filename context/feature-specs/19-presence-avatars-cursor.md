Show active room participants inside the editor canvas view, without changing the editor home navbar.

## Implementation Details & Codebase Review

Based on codebase review and Liveblocks/Clerk best practices:
1. **Lifting Providers**: Since `WorkspaceShell` renders the navbar and is currently outside `LiveCanvas` (which holds `LiveblocksProvider` and `RoomProvider`), we will lift the Liveblocks provider wrappers from `live-canvas.tsx` into `WorkspaceShell.tsx` (wrapping its root layout) so that navbar elements can access Liveblocks hooks.
2. **Subcomponent extraction**: Since `WorkspaceShell` itself cannot call Liveblocks hooks if it renders the providers, we will create a helper client component `PresenceAvatars` (in `components/editor/presence-avatars.tsx` or inside `workspace-shell.tsx`) which is a child of the providers, allowing it to call `useOthers()`.
3. **Cursor component compatibility**: The default `<Cursors />` component from `@liveblocks/react-flow` expects `name: string` and `color: string` in the user's metadata `info` object. We will update `UserMeta.info` in `liveblocks.config.ts` and the `identifyUser` call in `app/api/liveblocks-auth/route.ts` to include `name` and `color` mapped to the user's display name and deterministic cursor color.
4. **Current User Filtering**: The `useOthers()` hook returns only other participants, but to handle multiple tabs/sessions by the same Clerk user, we will filter using `other.info?.userId !== clerkUserId` (retrieved via Clerk `useUser()`).

## Implementation

1. Keep the existing navbar behavior as-is.
   - don't change the editor home navbar
   - don't move or redesign the shared navbar component globally
   - if the editor home and editor canvas use the same navbar component, make sure this presence UI only appears in the canvas/editor room view

2. Add the participant avatar group inside the editor canvas area.
   - position it in the top-right corner of the editor canvas view (inside the workspace navbar)
   - keep it visually separate from the main navbar actions
   - get the current user's ID from the active Clerk session (using `useUser()` or `useAuth()`)
   - filter the Liveblocks presence list to exclude any entry whose user ID matches the current Clerk user ID
   - render the filtered list as collaborator avatars only
   - render the current user separately using the existing Clerk UserButton - don't render a second avatar for them from the Liveblocks presence list
   - keep collaborator avatars and the Clerk UserButton the same size so the group looks visually consistent
   - collaborator avatars are display-only, not interactive
   - show a divider between the collaborator avatars and the Clerk UserButton only when at least one collaborator exists
   - if no collaborators are present, show only the Clerk UserButton with no divider

3. Render collaborator avatars.
   - use profile photos when available
   - fall back to initials when there is no image
   - show up to five collaborator avatars in an overlapping stack
   - show a +N overflow chip when there are more than five
   - add a subtle ring so avatars stay readable on the dark canvas

4. Add live cursors to the canvas.
   - render cursors for other participants only, never the current user
   - use the existing Liveblocks presence state to broadcast cursor position
   - update cursor position on React Flow's onMouseMove event
   - clear cursor to null on mouse leave
   - show a small colored pointer with a name badge attached
   - match the pointer and badge color to the participant's presence color

5. Define the shared presence type in 'liveblocks.config.ts'.
   Presence should include:
   - 'cursor': '{ x: number; y: number } | null'
   - 'thinking': boolean

## Scope Limits

- don't add participant avatars to the shared navbar globally
- don't remove existing navbar actions like Save, Import, Share, or AI
- don't replace Clerk user/profile/logout behavior
- don't make collaborator avatars interactive
- don't change canvas node or edge behavior

## Check When Done
 - Verify that the editor home and editor canvas use the same navbar component
 - Verify that participant avatars appear in the editor canvas view, not the home view
 - Verify that the collaborator avatar group is positioned in the top-right corner of the editor canvas view
 - Verify that collaborator avatars are visually separate from main navbar actions
 - Verify that the current user's ID is retrieved from the active Clerk session
 - Verify that the Liveblocks presence list is filtered to exclude the current user
 - Verify that only collaborators are rendered as avatar chips
 - Verify that the Clerk UserButton displays the current user separately
 - Verify that collaborator avatars and the UserButton are the same size
 - Verify that collaborator avatars are display-only and not interactive
 - Verify that a divider appears between collaborator avatars and the UserButton only when collaborators exist
 - Verify that if no collaborators are present, only the Clerk UserButton is shown
 - Verify that collaborator avatars show profile photos when available
 - Verify that collaborator avatars show initials when no photo is available
 - Verify that up to five collaborator avatars are shown in an overlapping stack
 - Verify that a +N overflow chip appears when more than five collaborators exist
 - Verify that avatars have a subtle ring for better readability
 - Verify that live cursors are rendered for other participants only, never the current user
 - Verify that cursor position is broadcast using Liveblocks presence state
 - Verify that cursor position updates on mouse move events
 - Verify that cursors clear to null on mouse leave
 - Verify that cursors show a colored pointer with a name badge
 - Verify that pointer and badge colors match the participant's presence color
 - Verify that the shared presence type includes 'cursor' and 'thinking' fields
 - Verify that no participant avatars are added to the shared navbar globally
 - Verify that existing navbar actions (Save, Import, Share, AI) remain unchanged
 - Verify that Clerk user/profile/logout behavior is not replaced
 - Verify that collaborator avatars are not interactive
 - Verify that canvas node and edge behavior is unchanged
 - Verify that 'npm run build' completes without type errors
