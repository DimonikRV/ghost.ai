import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { checkProjectAccess, getProjectWithAccess } from "@/lib/project-access";
import { getProjects } from "@/lib/get-projects";
import { WorkspaceShell } from "@/components/editor/workspace-shell";
import { AccessDenied } from "@/components/editor/access-denied";
import { ProjectNotFound } from "@/components/editor/project-not-found";
import { LiveCanvas } from "@/components/editor/live-canvas";
import { EditorErrorBoundary } from "@/components/editor/editor-error-boundary";

export default async function WorkspacePage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  // Check authentication — redirect unauthenticated users
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  // Check project access
  const result = await checkProjectAccess(projectId);

  if (result.found === false) {
    return <ProjectNotFound />;
  }

  if (!result.access.hasAccess) {
    return <AccessDenied />;
  }

  // Fetch project data for the workspace shell
  const project = await getProjectWithAccess(projectId);
  if (!project) {
    return <ProjectNotFound />;
  }

  // Fetch project lists for sidebar
  const { owned, shared } = await getProjects();

  const isOwner = project.ownerId === userId;
  const collaborators = project.collaborators.map((c) => ({
    id: c.id,
    email: c.email,
    createdAt: c.createdAt.toISOString(),
  }));

  return (
    <WorkspaceShell
      project={{ id: project.id, name: project.name }}
      ownedProjects={owned}
      sharedProjects={shared}
      isOwner={isOwner}
      collaborators={collaborators}
    >
      <EditorErrorBoundary label="Canvas failed to load">
        <LiveCanvas projectId={project.id} />
      </EditorErrorBoundary>
    </WorkspaceShell>
  );
}
