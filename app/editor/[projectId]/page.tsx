import { getProjects } from "@/lib/get-projects";
import { EditorShell } from "@/components/editor/editor-shell";

export default async function WorkspacePage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const { owned, shared } = await getProjects();

  return (
    <EditorShell ownedProjects={owned} sharedProjects={shared}>
      <div className="flex min-h-[calc(100vh-3rem)] flex-col items-center justify-center px-4">
        <h1 className="text-xl font-medium">Workspace</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Project ID: <span className="font-mono">{projectId}</span>
        </p>
      </div>
    </EditorShell>
  );
}
