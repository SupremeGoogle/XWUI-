/**
 * XWFFlowDiagram - model.
 * Draws one flow in a chosen notation, generated from the same graph (and, where the
 * notation shows time, from the latest run receipt): classic flowchart, swimlanes,
 * BPMN 2.0, UML sequence, discrete-event simulation, 3D floors.
 */
export const XWF_DIAGRAM_NOTATIONS = Object.freeze(['flowchart', 'swimlane', 'bpmn', 'sequence', 'sim', '3d']);
export const XWF_DIAGRAM_LANE_BY = Object.freeze(['system', 'connection', 'team']);

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
        /** What-if for the simulation: { arrivalFactor, serviceFactor, workers }. */
        scenario: { type: 'object', default: null },
        /** Highlighted step (3D replay). */
        selectedId: { type: 'string', default: '' },
        uid: { type: 'string' },
      },
    },
    conf_comp: {
      properties: {
        notation: { type: 'string', enum: XWF_DIAGRAM_NOTATIONS, default: 'flowchart' },
        thumbnail: { type: 'boolean', default: false },
        animate: { type: 'boolean', default: true },
        /** Lanes from declared systems, from the connection each step uses, or from teams. */
        laneBy: { type: 'string', enum: XWF_DIAGRAM_LANE_BY, default: 'system' },
        /** 3D layout: lanes as separate floors, height by step duration, dim steps without a failure. */
        floors: { type: 'boolean', default: true },
        heightByDuration: { type: 'boolean', default: true },
        failedOnly: { type: 'boolean', default: false },
        replayStepMs: { type: 'number', default: 700 },
        tilt: { type: 'number', default: 56 },
        spin: { type: 'number', default: -24 },
        height: { type: 'number', default: 1 },
        zoom: { type: 'number', default: 1 },
        minZoom: { type: 'number', default: 0.5 },
        maxZoom: { type: 'number', default: 3 },
        className: { type: 'string' },
      },
    },
  },
});

/** Shape per step type for the classic flowchart (ISO 5807). */
export const XWF_FLOWCHART_SHAPES = Object.freeze({
  terminal: 'terminal', io: 'io', process: 'process', decision: 'decision', data: 'document', delay: 'delay', junction: 'process', predefined: 'predefined',
});

export const XWF_FLOW_DIAGRAM_EVENTS = Object.freeze({ STEP: 'xwf-step', LEDGER: 'xwf-ledger', REPLAY: 'xwf-replay' });
