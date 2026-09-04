import { auth } from "@clerk/nextjs/server";
import { getProjects } from "@/lib/get-projects";
import { EditorShell } from "@/components/editor/editor-shell";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await auth.protect();

  const { owned, shared } = await getProjects();

  return (
    <EditorShell ownedProjects={owned} sharedProjects={shared}>
      {children}
    </EditorShell>
  );
}
