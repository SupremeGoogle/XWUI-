/**
 * XWFFlowCanvas - model.
 * A node-graph canvas for a flow: steps (nodes) wired by edges from an output port to the
 * next step, optional frames (labelled groups) and sticky notes, pan and zoom, a minimap.
 */

/**
 * @typedef {{ id: string, type: string, name: string, x: number, y: number,
 *   disabled?: boolean, pinned?: boolean, needsConnection?: boolean }} XWFFlowNode
 * @typedef {{ id: string, from: string, port: string, to: string }} XWFFlowEdge
 * @typedef {{ id: string, label: string, tone: string, x: number, y: number, w: number, h: number }} XWFFlowFrame
 * @typedef {{ id: string, text: string, x: number, y: number, rotate?: number }} XWFFlowSticky
 * @typedef {{ nodes: XWFFlowNode[], edges: XWFFlowEdge[], frames?: XWFFlowFrame[], stickies?: XWFFlowSticky[] }} XWFFlowGraph
 * @typedef {{ id: string, label: string, tone: string, icon: string, ports: string[] }} XWFFlowNodeType
 * @typedef {{ label: string, kind: string }} XWFFlowNodeState status line under a node
 */

export const XWF_FLOW_CANVAS_DEFINITION = Object.freeze({
  id: 'XWFFlowCanvas',
  component: 'XWFFlowCanvas',
  properties: {
    data: {
      properties: {
        graph: { type: 'object', default: { nodes: [], edges: [], frames: [], stickies: [] } },
        nodeTypes: { type: 'object', default: {} },
        nodeStates: { type: 'object', default: {} },
        portLabels: { type: 'object', default: { yes: 'yes', no: 'no' } },
        selectedId: { type: 'string', default: '' },
        labels: { type: 'object', default: {} },
        uid: { type: 'string' },
      },
    },
    conf_comp: {
      properties: {
        readOnly: { type: 'boolean', default: false },
        nodeWidth: { type: 'number', default: 150 },
        showMinimap: { type: 'boolean', default: true },
        showTools: { type: 'boolean', default: true },
        minZoom: { type: 'number', default: 0.4 },
        maxZoom: { type: 'number', default: 2 },
        zoomStep: { type: 'number', default: 0.15 },
        gridSize: { type: 'number', default: 22 },
        tidyGap: { type: 'object', default: { x: 200, y: 130 } },
        /** screen area covered by floating panels; fit and the overlays stay clear of it */
        safeArea: { type: 'object', default: { left: 0, right: 0, top: 0, bottom: 0 } },
        className: { type: 'string' },
      },
    },
  },
});

/** Geometry constants of a node card (match the prototype's .nd). */
export const XWF_NODE_GEOMETRY = Object.freeze({
  baseHeight: 84,
  branchHeight: 100,
  portY: 40,
  branchPortsY: { yes: 32, no: 66 },
  minimap: { width: 130, height: 84, padding: 10 },
});

export const XWF_FLOW_CANVAS_EVENTS = Object.freeze({
  SELECT: 'xwf-select',
  CHANGE: 'xwf-change',
  ACTIVATE: 'xwf-activate',
  DROP_TYPE: 'xwf-drop-type',
  VIEWPORT: 'xwf-viewport',
});

/** MIME type used when the palette drags a step type onto the canvas. */
export const XWF_FLOW_DND_TYPE = 'application/x-xwflow-step';
