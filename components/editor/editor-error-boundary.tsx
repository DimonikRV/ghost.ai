"use client";

import { catchError, type ErrorInfo } from "next/error";
import { TriangleAlert } from "lucide-react";

interface EditorErrorBoundaryProps {
  label?: string;
}

function EditorErrorFallback(
  props: EditorErrorBoundaryProps,
  { error, retry }: ErrorInfo,
) {
  return (
    <div className="flex h-full w-full min-h-[40vh] items-center justify-center px-4">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent/50">
          <TriangleAlert className="h-8 w-8 text-muted-foreground" />
        </div>
        <h1 className="text-xl font-medium">
          {props.label ?? "Something went wrong"}
        </h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          {error instanceof Error ? error.message : String(error)}
        </p>
        <button
          type="button"
          onClick={() => retry()}
          className="mt-2 inline-flex h-9 items-center gap-2 rounded-md bg-accent-brand px-4 text-sm font-medium text-white hover:bg-accent-brand/90 transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

export const EditorErrorBoundary = catchError(EditorErrorFallback);
