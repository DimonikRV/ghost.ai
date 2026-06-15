import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen bg-background">
      {/* Left panel — compact branding, hidden on small screens */}
      <div className="hidden lg:flex lg:w-80 flex-col justify-center border-r border-border bg-card px-8 py-12">
        {/* Branding */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-brand">
              <span className="text-sm font-bold tracking-tight text-white">G</span>
            </div>
            <span className="text-base font-medium tracking-tight text-foreground">Ghost Pilot</span>
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

      {/* Right panel — Clerk form */}
      <div className="flex flex-1 items-center justify-center px-4">
        <SignUp
          appearance={{
            elements: {
              rootBox: "w-full max-w-sm",
            },
          }}
          forceRedirectUrl={process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL || "/editor"}
        />
      </div>
    </div>
  );
}
