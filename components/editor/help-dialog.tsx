"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CANNVAS_TEMPLATES } from "./starter-templates";

interface HelpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function HelpDialog({ open, onOpenChange }: HelpDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-xl rounded-xl">
        <DialogHeader>
          <DialogTitle>Getting Started</DialogTitle>
          <DialogDescription>
            Learn how to use starter templates to kick-start your diagrams.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-2">
          <div className="space-y-6 text-sm text-foreground">
            {/* Section: Importing templates */}
            <section>
              <h3 className="font-medium text-foreground mb-1">
                Importing a Template
              </h3>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>
                  Click the <strong className="text-foreground">Templates...</strong> button in the bottom-left control bar.
                </li>
                <li>
                  Browse the available starter templates in the modal.
                </li>
                <li>
                  Click <strong className="text-foreground">Import</strong> on any template card to create a new canvas with that diagram.
                </li>
              </ol>
              <p className="text-muted-foreground mt-2">
                Importing a template replaces your current canvas — it does not merge with existing nodes or edges.
              </p>
            </section>

            {/* Section: Available templates */}
            <section>
              <h3 className="font-medium text-foreground mb-1">
                Available Templates
              </h3>
              <div className="space-y-3">
                {CANNVAS_TEMPLATES.map((t) => (
                  <div key={t.id} className="rounded-md border border-border bg-card p-3">
                    <h4 className="text-sm font-medium text-foreground">{t.name}</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">{t.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      <strong className="text-foreground">Nodes:</strong> {t.nodes.length} ·{" "}
                      <strong className="text-foreground">Edges:</strong> {t.edges.length}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* Section: Tips */}
            <section>
              <h3 className="font-medium text-foreground mb-1">
                Tips & Best Practices
              </h3>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>
                  Use templates as a starting point — customize node labels, colors, and positions after importing.
                </li>
                <li>
                  Drag shapes from the bottom panel to add new nodes to an imported template.
                </li>
                <li>
                  Double-click any node to edit its label inline.
                </li>
                <li>
                  Select a node to see the color toolbar — pick a color to differentiate nodes visually.
                </li>
                <li>
                  Imported canvases are saved like any other canvas — no special metadata is stored.
                </li>
                <li>
                  Undo/redo works for edits made after importing, but the import itself is a one-time action.
                </li>
              </ul>
            </section>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
