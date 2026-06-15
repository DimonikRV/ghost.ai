"use client"

import { EditorShell } from "@/components/editor/editor-shell"
import { EditorHome } from "@/components/editor/editor-home"
import { useProjectDialogsContext } from "@/components/editor/project-dialogs-context"

export default function EditorPage() {
  return (
    <EditorShell>
      <EditorPageContent />
    </EditorShell>
  )
}

function EditorPageContent() {
  const { openCreate } = useProjectDialogsContext()
  return <EditorHome onOpenCreate={openCreate} />
}
