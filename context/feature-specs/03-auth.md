Clerk is already installed and configured. Wire it into the Next.js app: provider, auth pages, redirects, route protection, and user menu.

## Design

Use Clerk's 'dark' theme from '@clerk/ui/themes' as the base.

Override Clerk appearance variables using the app's existing CSS variables. Don't hardcode colors.

### Sign-in and Sign-up pages

- large screens: simple two-panel layout
- left: compact logo, tagline, short text-only feature list
- right: centered Clerk form
- small screens: form only
- no gradient, no animations, no glassmorphism
- no oversized hero sections or large illustrations
- no feature cards
- no scroll-heavy layouts

Keep the layout minimal and professional.

## Implementation

Wrap the root layout with `ClerkProvider` using Clerk's `dark` theme.

**Important:** `ClerkProvider` must be placed inside `<body>`, not wrapping `<html>`. This is a Core 3 SDK requirement.

Create sign-in and sign-up pages using Clerk's components. Use catch-all routes (e.g. `[[...rest]]`).

Use `proxy.ts` at the project root, not `middleware.ts`.

Define public routes using the existing sign-in and sign-up env vars. Protect everything else by default.

**Middleware pattern:** Use `async (auth, req)` with `await auth.protect()`:

```typescript
export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});
```

Update '/':

 - authenticated users redirect to '/editor'
 - unauthenticated users redirect to '/sign-in'

Add Clerk's built-in 'UserButton' to the editor navbar right section for profile settings and logout.

Keep Clerk's default user menu and profile flows intact. Don't rebuild or heavily customize Clerk internals.

Use existing env vars. Don't rename or invent new ones.

After user signs out, redirect to '/sign-in' via 'NEXT_PUBLIC_CLERK_AFTER_SIGN_OUT_URL' env var and 'afterSignOutUrl' on 'ClerkProvider'.

## Dependencies

install: @clerk/ui.

## Check When Done

 - 'proxy.ts' exists at the root
 - all routes are protected except public auth paths
 - auth pages use CSS variables with no hardcoded colors
 - 'ClerkProvider' wraps root layout
 - 'npm run build' passes successfully.
 - sign-out redirects to '/sign-in'
