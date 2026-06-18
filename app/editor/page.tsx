import { getProjects } from "@/lib/get-projects";
import { EditorShell } from "@/components/editor/editor-shell";
import { EditorPageContent } from "@/components/editor/editor-page-content";

export default async function EditorPage() {
  const { owned, shared } = await getProjects();

  return (
    <EditorShell ownedProjects={owned} sharedProjects={shared}>
      <EditorPageContent />
    </EditorShell>
  );
}
