import { clerkMiddleware } from "@clerk/nextjs/server";

// Auth is enforced at each resource (pages, layouts, API routes) via
// `auth()` / `auth.protect()` rather than middleware path matching.
// clerkMiddleware() is still required for Clerk to work (session cookie,
// JWT parsing) but performs no gatekeeping here.
export default clerkMiddleware();

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
