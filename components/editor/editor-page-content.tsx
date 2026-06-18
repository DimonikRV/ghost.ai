"use client";

import { useProjectActionsContext } from "@/components/editor/project-actions-context";
import { EditorHome } from "@/components/editor/editor-home";

export function EditorPageContent() {
  const { openCreate } = useProjectActionsContext();
  return <EditorHome onOpenCreate={openCreate} />;
}
