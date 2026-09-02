import { Suspense } from "react";
import { SignIn } from "@clerk/nextjs";

function SignInSkeleton() {
  return (
    <div className="w-full max-w-sm space-y-6 animate-pulse">
      <div className="space-y-2">
        <div className="h-8 w-48 rounded bg-muted" />
        <div className="h-4 w-64 rounded bg-muted" />
      </div>
      <div className="space-y-3">
        <div className="h-10 rounded bg-muted" />
        <div className="h-10 rounded bg-muted" />
      </div>
      <div className="h-10 rounded bg-accent-brand/60" />
    </div>
  );
}

export default function SignInPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background lg:flex-row">
      <div className="flex w-full shrink-0 flex-col justify-center border-b border-border bg-card px-8 py-12 lg:w-80 lg:border-r lg:border-b-0">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-brand">
              <span className="text-sm font-bold tracking-tight text-white">
                G
              </span>
            </div>
            <span className="text-base font-medium tracking-tight text-foreground">
              Ghost Pilot
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            AI-assisted code editing and project management.
          </p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Intelligent code generation</li>
            <li>• Real-time collaboration</li>
            <li>• Secure, cloud-hosted projects</li>
          </ul>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center px-4">
        <Suspense fallback={<SignInSkeleton />}>
          <SignIn
            appearance={{
              elements: {
                rootBox: "w-full max-w-sm",
              },
            }}
            forceRedirectUrl={
              process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL || "/editor"
            }
          />
        </Suspense>
      </div>
    </div>
  );
}
