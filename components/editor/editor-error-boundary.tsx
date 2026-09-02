"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { TriangleAlert } from "lucide-react";

interface EditorErrorBoundaryProps {
  label?: string;
  children: ReactNode;
}

interface EditorErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class EditorErrorBoundary extends Component<
  EditorErrorBoundaryProps,
  EditorErrorBoundaryState
> {
  state: EditorErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  static getDerivedStateFromError(error: Error): EditorErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("EditorErrorBoundary caught an error", error, errorInfo);
  }

  reset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-full w-full min-h-[40vh] items-center justify-center px-4">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent/50">
              <TriangleAlert className="h-8 w-8 text-muted-foreground" />
            </div>
            <h1 className="text-xl font-medium">
              {this.props.label ?? "Something went wrong"}
            </h1>
            <p className="max-w-sm text-sm text-muted-foreground">
              {this.state.error instanceof Error
                ? this.state.error.message
                : String(this.state.error)}
            </p>
            <button
              type="button"
              onClick={this.reset}
              className="mt-2 inline-flex h-9 items-center gap-2 rounded-md bg-accent-brand px-4 text-sm font-medium text-white hover:bg-accent-brand/90 transition-colors"
            >
              Try again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
