import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { checkProjectAccess, getProjectWithAccess } from "@/lib/project-access";
import { getProjects } from "@/lib/get-projects";
import { WorkspaceShell } from "@/components/editor/workspace-shell";
import { AccessDenied } from "@/components/editor/access-denied";
import { ProjectNotFound } from "@/components/editor/project-not-found";

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
      {/* Central canvas placeholder */}
      <div className="flex h-full w-full flex-col items-center justify-center bg-background">
        <p className="text-lg font-medium text-foreground">Canvas</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Your workspace canvas will appear here.
        </p>
      </div>
    </WorkspaceShell>
  );
}
