import Link from "next/link";
import { FileQuestion } from "lucide-react";

export function ProjectNotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent/50">
          <FileQuestion className="h-8 w-8 text-muted-foreground" />
        </div>
        <h1 className="text-xl font-medium">Project Not Found</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          This project doesn&apos;t exist or may have been deleted.
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
