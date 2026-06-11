import { EditorShell } from "@/components/editor/editor-shell";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <EditorShell>{children}</EditorShell>;
}
