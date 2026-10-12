/**
 * XWFFlowDiagram - model.
 * Draws one flow in a chosen notation, generated from the same graph (and, where the
 * notation shows time, from the latest run receipt): classic flowchart, swimlanes,
 * BPMN 2.0, UML sequence, discrete-event simulation, 3D floors.
 */
export const XWF_DIAGRAM_NOTATIONS = Object.freeze(['flowchart', 'swimlane', 'bpmn', 'sequence', 'sim', '3d']);

export const XWF_FLOW_DIAGRAM_DEFINITION = Object.freeze({
  id: 'XWFFlowDiagram',
  component: 'XWFFlowDiagram',
  properties: {
    data: {
      properties: {
        flow: { type: 'object', default: { name: '', graph: { nodes: [], edges: [] } } },
        nodeTypes: { type: 'object', default: {} },
        run: { type: 'object', default: null },
        connections: { type: 'array', default: [] },
        labels: { type: 'object', default: {} },
        simState: { type: 'object', default: null },
        uid: { type: 'string' },
      },
    },
    conf_comp: {
      properties: {
        notation: { type: 'string', enum: XWF_DIAGRAM_NOTATIONS, default: 'flowchart' },
        thumbnail: { type: 'boolean', default: false },
        animate: { type: 'boolean', default: true },
        laneBy: { type: 'string', enum: ['system', 'kind'], default: 'system' },
        tilt: { type: 'number', default: 56 },
        spin: { type: 'number', default: -24 },
        height: { type: 'number', default: 1 },
        className: { type: 'string' },
      },
    },
  },
});

/** Shape per step type for the classic flowchart (ISO 5807). */
export const XWF_FLOWCHART_SHAPES = Object.freeze({
  terminal: 'terminal', io: 'io', process: 'process', decision: 'decision', data: 'document', delay: 'delay', junction: 'process', predefined: 'predefined',
});

export const XWF_FLOW_DIAGRAM_EVENTS = Object.freeze({ STEP: 'xwf-step', LEDGER: 'xwf-ledger' });

export const DIAGRAM_TONES = Object.freeze(['lime', 'cyan', 'violet', 'orange', 'pink', 'amber', 'green', 'red']);
export const SVG_EXPORT_PROPERTIES = Object.freeze([
  'fill', 'stroke', 'stop-color', 'stop-opacity', 'color', 'font-family', 'font-size',
  'font-weight', 'font-style', 'text-anchor', 'dominant-baseline', 'opacity',
  'stroke-width', 'stroke-dasharray', 'stroke-linecap', 'stroke-linejoin',
  'marker-start', 'marker-end', 'filter', 'fill-opacity', 'stroke-opacity',
]);
export const DIAGRAM_TIMING = Object.freeze({ minutesPerTick: 2, tickMs: 300 });
export const DIAGRAM_GEOMETRY = Object.freeze({
  flowchart: { column: 230, row: 190, box: { w: 170, h: 70 } },
  swimlane: { lane: 140, header: 150, column: 190, box: { w: 150, h: 60 } },
  bpmn: { column: 200, task: { w: 170, h: 76 } },
  sequence: { laneGap: 250, head: { w: 180, h: 54 }, row: 46 },
  sim: { column: 270, row: 135, box: { w: 200, h: 90 } },
  threeD: { lane: 128, column: 210, node: 180 },
  orbit: { spinFactor: 0.25, tiltFactor: 0.2, minTilt: 10, maxTilt: 80 },
});
