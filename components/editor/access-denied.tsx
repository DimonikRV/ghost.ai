import Link from "next/link";
import { Lock } from "lucide-react";

export function AccessDenied() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent/50">
          <Lock className="h-8 w-8 text-muted-foreground" />
        </div>
        <h1 className="text-xl font-medium">Access Denied</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          You don&apos;t have permission to view this project. Contact the project owner to request access.
        </p>
        <Link
          href="/editor"
          className="mt-2 inline-flex h-9 items-center gap-2 rounded-md bg-accent-brand px-4 text-sm font-medium text-white hover:bg-accent-brand/90 transition-colors"
        >
          Back to Editor
        </Link>
      </div>
    </div>
  );
}
