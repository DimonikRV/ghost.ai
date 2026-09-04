import { auth } from "@clerk/nextjs/server";
import { getProjects } from "@/lib/get-projects";
import { EditorShell } from "@/components/editor/editor-shell";
import { EditorPageContent } from "@/components/editor/editor-page-content";
import { EditorErrorBoundary } from "@/components/editor/editor-error-boundary";

export default async function EditorPage() {
  await auth.protect();

  const { owned, shared } = await getProjects();

  return (
    <EditorShell ownedProjects={owned} sharedProjects={shared}>
      <EditorErrorBoundary label="Editor failed to load">
        <EditorPageContent />
      </EditorErrorBoundary>
    </EditorShell>
  );
}
