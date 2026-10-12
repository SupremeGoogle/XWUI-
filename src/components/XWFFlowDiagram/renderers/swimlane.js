/**
 * Swimlanes (cross-functional flowchart): one lane per system; a step sits in the lane of
 * the system it acts on; arrows that cross a lane boundary are hand-offs. Failed attempts
 * from the latest run are drawn under the step that retried.
 */
import { diagramElement as h, paint } from './svg.js';
import { DIAGRAM_GEOMETRY as G } from '../XWFFlowDiagram.model.js';
import { layoutColumns } from '../XWFFlowDiagram.logic.js';
import { defs, marker, svgRoot, LINE, MUTED, inkFor } from './svg.js';

const { lane: LANE_H, header: HEAD_W, column: COL_W, box: BOX } = G.swimlane;

const toneVar = (tone) => `var(--xw-${tone})`;

export function renderSwimlane({ flow, types, run, labels, uid, systemsModel }) {
  const { systems, systemOf } = systemsModel;
  const { steps } = layoutColumns(flow.graph, types);
  const laneIndex = new Map(systems.map((s, i) => [s.id, i]));
  const failedByNode = new Map();
  run?.ledger.filter((r) => r.result === 'failed' && r.attempt < (r.maxAttempts ?? 1)).forEach((r) => failedByNode.set(r.nodeId, r));

  let col = 0;
  const pos = new Map();
  steps.forEach((s) => {
    const lane = laneIndex.get(systemOf(s.node)) ?? 0;
    const x = 20 + HEAD_W + 40 + col * COL_W;
    pos.set(s.node.id, { x, y: 15 + lane * LANE_H + (LANE_H - BOX.h) / 2, lane, step: s });
    col += failedByNode.has(s.node.id) ? 2 : 1;
  });
  const width = Math.max(1000, 20 + HEAD_W + 80 + col * COL_W + 40);
  const height = 15 + systems.length * LANE_H + 15;

  const lanes = systems.map((s, i) => h('g', {},
    h('rect', { x: 20, y: 15 + i * LANE_H, width: width - 40, height: LANE_H, fill: toneVar(s.tone), opacity: '.07' }),
    h('rect', { x: 36, y: 15 + i * LANE_H + 49, width: 10, height: 10, rx: 3, fill: toneVar(s.tone) }),
    h('text', { x: 54, y: 15 + i * LANE_H + 59, fill: paint('text'), 'font-size': '16' }, s.label),
    s.hint && h('text', { x: 36, y: 15 + i * LANE_H + 81, fill: MUTED, 'font-size': '12', 'font-weight': '700' }, s.hint)));
  const grid = h('g', { stroke: paint('grid'), 'stroke-width': '1.5', fill: 'none' },
    systems.slice(1).map((_, i) => h('path', { d: `M20 ${15 + (i + 1) * LANE_H} H${width - 20}` })),
    h('rect', { x: 20, y: 15, width: width - 40, height: systems.length * LANE_H }),
    h('path', { d: `M${20 + HEAD_W} 15 V${15 + systems.length * LANE_H}` }));

  const boxes = [];
  const arrows = [];
  let handoff = 0;
  const byId = new Map(flow.graph.nodes.map((n) => [n.id, n]));
  pos.forEach((p, id) => {
    const { step } = p;
    const tone = step.node.disabled ? null : (systems[p.lane]?.tone ?? step.type.tone);
    if (step.type.ports?.includes('yes')) {
      const cx = p.x + BOX.w / 2; const cy = p.y + BOX.h / 2;
      boxes.push(h('polygon', { points: `${cx},${cy - 42} ${cx + 60},${cy} ${cx},${cy + 42} ${cx - 60},${cy}`, fill: paint('panel'), stroke: toneVar(step.type.tone), 'stroke-width': '2.5' }),
        h('text', { x: cx, y: cy + 5, fill: paint('white'), 'font-size': '13', 'text-anchor': 'middle' }, step.node.name));
    } else {
      boxes.push(h('rect', { x: p.x, y: p.y, width: BOX.w, height: BOX.h, rx: 14, fill: tone ? toneVar(tone) : paint('disabled-surface'), stroke: step.node.disabled ? MUTED : 'none', 'stroke-dasharray': step.node.disabled ? '6 5' : null }),
        h('text', { x: p.x + BOX.w / 2, y: p.y + 36, fill: tone ? inkFor(tone) : MUTED, 'font-size': '15', 'text-anchor': 'middle' }, step.node.name));
    }
    const fail = failedByNode.get(id);
    if (fail) {
      const fx = p.x + COL_W;
      boxes.push(h('rect', { x: fx, y: p.y, width: BOX.w, height: BOX.h, rx: 14, fill: paint('panel'), stroke: paint('red'), 'stroke-width': '2.5' }),
        h('text', { x: fx + BOX.w / 2, y: p.y + 27, fill: paint('error-text'), 'font-size': '14', 'text-anchor': 'middle' }, `${fail.error?.status ?? ''} ${labels.unavailable}`),
        h('text', { x: fx + BOX.w / 2, y: p.y + 46, fill: MUTED, 'font-size': '12', 'text-anchor': 'middle' }, `${labels.wait} ${(types[step.node.type]?.retry?.delayMs ?? 1000) / 1000} s, ${labels.tryWord} ${fail.attempt + 1}`));
      arrows.push(h('path', { d: `M${p.x + BOX.w} ${p.y + BOX.h / 2} H${fx - 6}`, stroke: paint('error-text'), 'stroke-width': '2.4', fill: 'none', 'stroke-dasharray': '7 5', 'marker-end': marker(uid, 'arrow-red') }));
      p.exitX = fx + BOX.w;
    }
  });
  flow.graph.edges.forEach((e) => {
    const a = pos.get(e.from); const b = pos.get(e.to);
    if (!a || !b) return;
    const ax = a.exitX ?? a.x + BOX.w; const ay = a.y + BOX.h / 2;
    const bx = b.x; const by = b.y + BOX.h / 2;
    const crosses = a.lane !== b.lane;
    if (crosses) handoff += 1;
    const d = Math.abs(ay - by) < 2 ? `M${ax} ${ay} H${bx - 6}` : `M${ax} ${ay} H${(ax + bx) / 2} V${by} H${bx - 6}`;
    arrows.push(h('path', { d, stroke: byId.get(e.to)?.disabled ? MUTED : LINE, 'stroke-width': '2.4', fill: 'none', 'stroke-dasharray': byId.get(e.to)?.disabled ? '7 6' : null, 'marker-end': marker(uid) }));
    if (e.port !== 'out') arrows.push(h('text', { x: (ax + bx) / 2 + 8, y: Math.min(ay, by) + (by > ay ? 30 : -8), fill: e.port === 'yes' ? paint('lime') : paint('secondary'), 'font-size': '13' }, labels[e.port] ?? e.port));
    if (crosses) arrows.push(h('text', { x: (ax + bx) / 2, y: (ay + by) / 2 - 6, fill: toneVar(systems[b.lane]?.tone), 'font-size': '11', 'font-family': 'JetBrains Mono', 'text-anchor': 'middle' }, `${labels.handoff} ${handoff}`));
  });

  const svg = svgRoot({ width, height, ariaLabel: `${labels.swimlaneAria} ${flow.name}` }, defs(uid), lanes, grid, arrows, boxes);
  svg.dataset.handoffs = String(handoff);
  return svg;
}
