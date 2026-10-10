# XWFFlowDiagram

One flow drawn in different notations, generated from the same graph and (where time
matters) the latest run receipt. Nothing is drawn by hand: layout, lanes, retries, branches
and messages are derived in `XWFFlowDiagram.logic.js`.

| `conf_comp.notation` | Renderer | Built from |
|---|---|---|
| `flowchart` | ISO 5807 symbols, retry loops | graph + step `retry` params |
| `swimlane` | one lane per system, hand-offs | graph + `flow.systems` / connections |
| `bpmn` | pools, lanes, gateways, error boundary, data store, annotation | graph + systems + sticky notes |
| `sequence` | lifelines, calls/replies, waits, `alt` fragments, receipt dots | run ledger |
| `sim` | Create / Process / Decide / Dispose with moving tokens | graph + `flow.sim` + `stepSim()` |
| `3d` | lanes as floors, steps floating by duration | graph + run durations |

## data

`flow` (`{ name, graph, systems?, sim?, samplePayload? }`), `nodeTypes`, `run`, `connections`,
`lanes` (catalog lanes for flows without `systems`), `labels`, `simState`.

## conf_comp

`notation`, `thumbnail` (no interaction, compact), `animate`, `tilt`, `spin`, `height` (3D).

## Methods and events

`playSim()`, `pauseSim()`, `stepSimOnce()`, `resetSim()`, `setSimSpeed(n)`, `setView({ tilt, spin, height })`,
`getSystems()`, `getHandoffs()`, `toSvgString()`.
Events: `xwf-step` (`{ state }` after each simulation step), `xwf-ledger` (`{ index }` when a receipt
dot is chosen in the sequence view).
