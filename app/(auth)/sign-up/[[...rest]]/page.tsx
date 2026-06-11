import { SignUp } from "@clerk/nextjs";
import { Check } from "lucide-react";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen bg-background">
      {/* Left panel — hidden on small screens */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between border-r border-border bg-card px-16 py-12">
        {/* Top: branding */}
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#06b6d4]">
              <span className="text-base font-bold tracking-tight text-white">G</span>
            </div>
            <span className="text-xl font-medium tracking-tight text-foreground">Ghost Pilot</span>
          </div>
        </div>

        {/* Center: feature list */}
        <div className="max-w-md space-y-8">
          <h2 className="text-4xl font-medium leading-tight tracking-tight text-foreground">
            Build faster with AI-assisted development
          </h2>
          <ul className="space-y-5 text-base text-muted-foreground">
            <li className="flex items-start gap-3">
              <span className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#06b6d4]/20">
                <Check className="h-3 w-3 text-[#06b6d4]" />
              </span>
              Intelligent code generation and editing
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#06b6d4]/20">
                <Check className="h-3 w-3 text-[#06b6d4]" />
              </span>
              Real-time collaboration and sharing
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#06b6d4]/20">
                <Check className="h-3 w-3 text-[#06b6d4]" />
              </span>
              Secure, cloud-hosted projects
            </li>
          </ul>
        </div>

        {/* Bottom: footer */}
        <p className="text-sm text-muted-foreground">
          © 2026 Ghost Pilot. All rights reserved.
        </p>
      </div>

      {/* Right panel — Clerk form */}
      <div className="flex flex-1 items-center justify-center px-4">
        <SignUp
          appearance={{
            elements: {
              rootBox: "w-full max-w-sm",
            },
          }}
          forceRedirectUrl={process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL}
        />
      </div>
    </div>
  );
}
