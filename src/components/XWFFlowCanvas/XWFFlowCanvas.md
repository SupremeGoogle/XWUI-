# XWFFlowCanvas

Node-graph canvas for a flow. XWUI basic has no graph editor (`XWUIDiagram` is in the
licensed super tier), so this component is built on `XWUIComponent` and composes XWUI
basics: `XWUIButton` (tools), `XWUIIcon` (step glyphs), `XWUIDisplayTag` (frame labels) and
`XWFStatus` (node state).

## data

| Key | Type |
|---|---|
| `graph` | `{ nodes, edges, frames?, stickies? }` (see the typedefs in the model) |
| `nodeTypes` | map type id → `{ label, tone, icon, ports, group }` |
| `nodeStates` | map node id → `{ label, kind }` status line under the node |
| `selectedId` | node or edge id |
| `portLabels` | `{ yes, no }` |
| `labels` | `{ canvas, tools, zoomIn, zoomOut, fit, tidy, minimap, empty }` |

## conf_comp

`readOnly`, `nodeWidth` (150), `showMinimap`, `showTools`, `minZoom`, `maxZoom`, `zoomStep`,
`gridSize`, `tidyGap`, `safeArea` (`{ left, right, top, bottom }` covered by floating panels).

Responsive layouts can override each safe-area side through `--xwf-canvas-safe-left`,
`--xwf-canvas-safe-right`, `--xwf-canvas-safe-top`, and `--xwf-canvas-safe-bottom` (px).
The same resolved area positions the tools, minimap and fitted graph.

## Events (bubble from the canvas root)

| Event | detail |
|---|---|
| `xwf-select` | `{ id, node, edge }` |
| `xwf-change` | `{ graph, reason }` reason: `move` `connect` `delete` `tidy` |
| `xwf-activate` | `{ id }` (double click on a step) |
| `xwf-drop-type` | `{ type, x, y }` (a palette step dropped at world x/y) |
| `xwf-viewport` | `{ x, y, k }` |

## Methods

`setGraph`, `setNodeStates`, `setSelected`, `getGraph`, `fit`, `zoomBy`, `focusNode`, `tidy`,
`deleteSelection`, `getTransform`, `destroy`.

## Keyboard

Focus the canvas: `Delete` removes the selection, arrows nudge a step (Shift = 40 px),
`Escape` clears the selection.
