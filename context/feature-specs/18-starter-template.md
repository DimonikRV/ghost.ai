Add a small starter template library so users can start a canvas from a pre-built diagram instead of building from scratch.

## Implementation

1. Create 'components/editor/starter-templates.ts'.

   Include:
   - a 'CanvasTemplate' type
   - a 'CANVAS_TEMPLATES' array
   - at least three templates, such as microservices, CI/CD pipeline, and event-driven system

   Each template should include:
   - id: string
   - name: string
   - description: string
   - nodes: DiagramNode[]
   - edges: DiagramEdge[]

Use the shared canvas types and existing node color palette. Add small helper functions if needed to keep the template data readable.

2. Create 'components/editor/starter-templates-modal.tsx'.

   The modal should:
   - open as a dialog
   - show template cards in a scrollable grid
   - show the template name and description
   - include an import button for each template
   - call 'onImport' with the selected template, then close

3. Add a simple diagram preview to each template card.
   - fit the preview to a fixed-size viewport
   - calculate the preview bounds from the template node positions
   - draw edges as simple lines between node centers (no routing)
   - draw nodes using their shape and color data
   - keep the preview lightweight, no React Flow instance needed, just draw in a div with SVG

4. Add a "Templates..." option to the diagram toolbar.

   - When clicked, show the 'starter-templates-modal'
   - The modal should appear on top of the canvas

5. When a user clicks "Import" on a template:
   - Create a new canvas with the imported nodes and edges
   - Replace the current canvas with the new one
   - Keep the new canvas at position (0, 0), no need to center it
   - Don't merge nodes or change existing canvas data, just create a new canvas

6. When the user saves a diagram that was created from a template:
   - The saved canvas data should be the raw nodes and edges from the template
   - Don't store template-specific metadata in the saved canvas
   - Treat imported canvases like any other canvas when saving

7. No undo/redo support is required for this feature.
   - Imported canvases don't need to support undo or redo
   - The import operation is considered a "one-time" action
   - No special handling is needed for undo/redo when importing templates

8. Create "How to use" documentation for the starter templates.
   - Add a "Getting Started" section to the help documentation
   - Explain how to import and use templates
   - Provide usage examples for each template
   - Include tips and best practices for working with templates

9. Check When Done
   - Verify that the 'starter-templates.ts' file is created
   - Verify that the 'starter-templates-modal.tsx' file is created
   - Verify that the diagram toolbar has a "Templates..." option
   - Verify that the modal opens when the "Templates..." option is clicked
   - Verify that templates are displayed in the modal
   - Verify that clicking "Import" on a template creates a new canvas
   - Verify that the new canvas has the imported nodes and edges
   - Verify that the new canvas is at position (0, 0)
   - Verify that the imported canvas can be saved
   - Verify that the saved canvas contains the raw nodes and edges from the template
   - Verify that the "How to use" documentation is created and accessible
   - Verify that the documentation includes usage examples for each template
   - Verify that the undo/redo functionality works for non-template canvases
   - Verify that the undo/redo functionality does not affect imported canvases
   - Verify that 'npm run build' completes without type errors

