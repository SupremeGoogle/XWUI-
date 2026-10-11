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
`lanes` (catalog lanes for flows without `systems`), `labels`, `simState`,
`scenario` (simulation what-if: `{ arrivalFactor, serviceFactor, workers }`), `selectedId` (3D highlight).

`flow.sim` may name `focusNodeId` (the station the panel reports on), `countNodeId` and
`countLabel` (a step whose arrivals are counted, e.g. alerts sent).

## conf_comp

| Key | Default | Notes |
|---|---|---|
| `notation` | `'flowchart'` | see the table above |
| `thumbnail` / `animate` | `false` / `true` | thumbnails take no input |
| `laneBy` | `'system'` | `system`, `connection` or `team` lanes (swimlane, BPMN, 3D) |
| `zoom`, `minZoom`, `maxZoom` | `1`, `0.5`, `3` | 2D: scales the drawing; 3D: scales the plane |
| `tilt`, `spin`, `height` | `56`, `-24`, `1` | 3D camera and height scale |
| `floors`, `heightByDuration`, `failedOnly` | `true`, `true`, `false` | 3D layout switches |
| `replayStepMs` | `700` | 3D replay pace |

## Methods and events

- Simulation: `playSim()`, `pauseSim()`, `stepSimOnce()`, `resetSim()`, `setSimSpeed(n)`,
  `setScenario(patch)`, `getSimSummary()`, `isSimPlaying()`.
- View: `zoomBy(factor)`, `resetZoom()`, `getZoom()`, `setView({ tilt, spin, height, zoom })`, `getView()`,
  `setLayout({ floors, heightByDuration, failedOnly, laneBy })`, `setRun(run)`.
- 3D replay: `replay()`, `stopReplay()`, `isReplaying()`.
- Facts and export: `getSystems()`, `getHandoffs()`, `toSvgString()`.

Events: `xwf-step` (`{ state }` after each simulation step), `xwf-ledger` (`{ index }` when a receipt
dot is chosen in the sequence view), `xwf-replay` (`{ nodeId }` per replayed step, `{ done: true }` at the end).

## Pure helpers (logic)

`flowToMermaid`, `flowToList`, `sequenceToPlantUml`, `sequenceToMermaid`, `flowToBpmnXml`,
`validateBpmn`, `simModel`, `simSummary`, `queueBuckets`. `renderers/legend.js` draws legend symbols
at swatch size (`projectXWFDiagramSymbol` in the view module).
