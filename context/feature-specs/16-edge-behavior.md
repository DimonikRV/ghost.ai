Replace the default canvas edges with custom edges that feel easier to folow, easier to click, and support inline labels.

## Implementation

1. Add connection handles to every node.
   - place handles on the top, right, bottom, and left sides
   - users should be able to connect from any handle to any other handle
   - keep the handles subtle: small white dotes with a dark border
   - hide them by default and fade them in when hovering the node

2. Add a default style for new edges.
   - use a light stroke with rounded ends
   - add an arrowhead at the end of each edge
   - make new connections use the custom canvas edge renderer

3. Create the custom edge renderer.
   - use clean right-angle routing
   - keep edges slightly dimmed at rest
   - brighten edges when hovered
   - make edges easier to hover and click without increasing the visible line thickness
   
 4. Add inline edge label editing
    - double-click an edge to edit its label
    - use React Flow's 'EdgeLabelRenderer' to render the label and the path midpoint coordinates from 'getSmoothStepPath' to position the label - don't calculate midpoint position manually 
    - use an input that arows with the label text

## Check When Done

- All edges are rendered using the custom edge renderer
- All nodes have connection handles on all four sides
- Handles only appear when hovering a node
- Edges use right-angle routing
- Edges dim at rest and brighten on hover
- Edge labels can be double-clicked and edited in place
- Edge labels use React Flow's 'EdgeLabelRenderer' and 'getSmoothStepPath' to position the label
- 'npm run build' passes without types errors