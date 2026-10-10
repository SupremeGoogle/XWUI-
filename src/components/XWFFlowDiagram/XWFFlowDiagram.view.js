/** XWFFlowDiagram - view: picks the renderer for the notation. */
import { renderFlowchart } from './renderers/flowchart.js';
import { renderSwimlane } from './renderers/swimlane.js';
import { renderBpmn } from './renderers/bpmn.js';
import { renderSequence } from './renderers/sequence.js';
import { renderSim } from './renderers/sim.js';
import { render3d } from './renderers/threeD.js';

const RENDERERS = {
  flowchart: renderFlowchart,
  swimlane: renderSwimlane,
  bpmn: renderBpmn,
  sequence: renderSequence,
  sim: renderSim,
  '3d': render3d,
};

export function projectXWFFlowDiagramView(notation, model) {
  return (RENDERERS[notation] ?? renderFlowchart)(model);
}
