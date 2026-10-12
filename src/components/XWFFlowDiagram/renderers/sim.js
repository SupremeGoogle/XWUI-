/**
 * Discrete-event simulation (Arena-style modules): Create -> Process (queue, workers) ->
 * Decide (share per branch) -> Process -> Dispose, with tokens moving along the
 * connectors and live counters from the simulation state.
 */
import { diagramElement as h, paint } from './svg.js';
import { DIAGRAM_GEOMETRY as G } from '../XWFFlowDiagram.model.js';
import { layoutColumns } from '../XWFFlowDiagram.logic.js';
import { defs, marker, svgRoot, LINE, inkFor } from './svg.js';

const { column: COL, row: ROW, box: BOX } = G.sim;

const toneVar = (tone) => `var(--xw-${tone})`;
const mono = { 'font-family': 'JetBrains Mono', 'font-size': '15', fill: 'var(--xw-cyan)' };

export function renderSim({ flow, types, labels, uid, simState, animate }) {
  const { steps, cols, minRow, maxRow } = layoutColumns(flow.graph, types);
  const top = 90 + (-minRow) * ROW;
  const width = 80 + (cols + 1) * COL;
  const height = top + (maxRow + 1) * ROW + 80;
  const st = simState?.stations ?? {};
  const pos = new Map();
  const out = [];
  const paths = [];

  steps.forEach((s) => {
    const x = 60 + s.col * COL;
    const y = top + s.row * ROW;
    pos.set(s.node.id, { x, y, step: s });
    const counters = st[s.node.id] ?? { in: 0, out: 0, queue: 0 };
    const isTrigger = s.type.group === 'trigger';
    const isDecision = s.type.ports?.includes('yes');
    const tone = s.node.disabled ? null : s.type.tone;
    if (isTrigger) {
      out.push(h('polygon', { points: `${x},${y} ${x + 160},${y} ${x + 200},${y + 45} ${x + 160},${y + 90} ${x},${y + 90}`, fill: toneVar('lime') }),
        h('text', { x: x + 90, y: y + 41, 'text-anchor': 'middle', 'font-size': '17', fill: paint('ink') }, s.node.name),
        h('text', { x: x + 90, y: y + 62, 'text-anchor': 'middle', 'font-size': '12', fill: paint('ink') }, labels.create),
        h('text', { x: x + 90, y: y + 122, 'text-anchor': 'middle', ...mono }, String(simState?.arrived ?? 0)));
    } else if (isDecision) {
      const cx = x + 80; const cy = y + 45;
      const share = flow.sim?.branchShare?.yes ?? 0.5;
      out.push(h('polygon', { points: `${cx},${cy - 55} ${cx + 80},${cy} ${cx},${cy + 55} ${cx - 80},${cy}`, fill: toneVar('orange') }),
        h('text', { x: cx, y: cy + 5, 'text-anchor': 'middle', 'font-size': '15', fill: paint('ink') }, s.node.name),
        h('text', { x: cx + 40, y: cy - 75, 'font-size': '13', fill: 'var(--xw-lime)' }, `${labels.true} ${Math.round(share * 100)}%`),
        h('text', { x: cx + 40, y: cy + 92, 'font-size': '13', fill: paint('secondary') }, `${labels.false} ${Math.round((1 - share) * 100)}%`));
    } else {
      out.push(h('rect', { x, y, width: BOX.w, height: BOX.h, rx: 6, fill: tone ? toneVar(tone) : paint('disabled-surface'), stroke: tone ? 'none' : paint('tertiary'), 'stroke-dasharray': tone ? null : '6 5' }),
        h('text', { x: x + BOX.w / 2, y: y + 41, 'text-anchor': 'middle', 'font-size': '17', fill: tone ? inkFor(tone) : paint('secondary') }, s.node.name),
        h('text', { x: x + BOX.w / 2, y: y + 62, 'text-anchor': 'middle', 'font-size': '12', fill: tone ? inkFor(tone) : paint('secondary'), opacity: '.85' },
          s.node.disabled ? labels.bypassed : `${labels.process}${s.col === 1 && flow.sim?.workers ? `, ${flow.sim.workers} ${labels.workers}` : ''}`),
        h('text', { x: x + BOX.w / 2, y: y + 122, 'text-anchor': 'middle', ...mono }, counters.queue ? `${counters.out} ${labels.out}, ${counters.queue} ${labels.waiting}` : String(counters.out)));
      const q = Math.min(6, counters.queue);
      if (q) {
        out.push(h('line', { x1: x + 10, y1: y - 22, x2: x + BOX.w - 10, y2: y - 22, stroke: LINE, 'stroke-width': '2' }),
          h('text', { x: x + BOX.w - 50, y: y - 30, 'font-size': '11', fill: paint('muted') }, labels.queue));
        for (let i = 0; i < q; i += 1) out.push(h('circle', { cx: x + 26 + i * 20, cy: y - 34, r: 8, fill: 'var(--xw-cyan)' }));
      }
    }
  });
  // dispose module
  const dx = 60 + cols * COL;
  const dy = top;
  out.push(h('polygon', { points: `${dx + 40},${dy} ${dx + 240},${dy} ${dx + 240},${dy + 90} ${dx + 40},${dy + 90} ${dx},${dy + 45}`, fill: paint('done-surface'), stroke: LINE, 'stroke-width': '1.6' }),
    h('text', { x: dx + 130, y: dy + 41, 'text-anchor': 'middle', 'font-size': '17', fill: paint('white') }, labels.done),
    h('text', { x: dx + 130, y: dy + 62, 'text-anchor': 'middle', 'font-size': '12', fill: paint('secondary') }, labels.dispose),
    h('text', { x: dx + 130, y: dy + 122, 'text-anchor': 'middle', ...mono }, String(simState?.done ?? 0)));

  const anchor = (p, side) => {
    const isDecision = p.step.type.ports?.includes('yes');
    if (side === 'out') return isDecision ? [p.x + 160, p.y + 45] : [p.x + BOX.w, p.y + 45];
    return isDecision ? [p.x, p.y + 45] : [p.x, p.y + 45];
  };
  flow.graph.edges.forEach((e, i) => {
    const a = pos.get(e.from); const b = pos.get(e.to);
    if (!a || !b) return;
    let [x1, y1] = anchor(a, 'out');
    const [x2, y2] = anchor(b, 'in');
    if ((e.port !== 'out') && y1 !== y2) { x1 = a.x + 80; y1 = a.y + 45 + (y2 < y1 ? -55 : 55); }
    const d = y1 === y2 ? `M${x1} ${y1} H${x2 - 4}` : `M${x1} ${y1} V${y2} H${x2 - 4}`;
    paths.push({ id: `${uid}-p${i}`, d });
  });
  flow.graph.nodes.filter((n) => !flow.graph.edges.some((e) => e.from === n.id)).forEach((n, i) => {
    const p = pos.get(n.id);
    if (!p) return;
    const [x1, y1] = anchor(p, 'out');
    paths.push({ id: `${uid}-d${i}`, d: y1 === dy + 45 ? `M${x1} ${y1} H${dx - 4}` : `M${x1} ${y1} H${(x1 + dx) / 2} V${dy + 45} H${dx - 4}` });
  });
  const pathEls = h('g', { stroke: LINE, 'stroke-width': '2.4', fill: 'none' }, paths.map((p) => h('path', { id: p.id, d: p.d, 'marker-end': marker(uid) })));
  const tokens = animate && simState?.running ? h('g', { fill: 'var(--xw-lime)' }, paths.flatMap((p, i) => [0, 1].map((k) => {
    const motionId = `${p.id}-motion${k}`;
    return h('circle', { r: k ? 5 : 7, visibility: 'hidden', filter: k ? null : `url(#${uid}-glow)` },
      h('set', { attributeName: 'visibility', to: 'visible', begin: `${motionId}.begin`, fill: 'freeze' }),
      h('animateMotion', { id: motionId, dur: `${1.2 + (i % 4) * 0.3}s`, begin: `${(i + k) * 0.15}s`, repeatCount: 'indefinite' }, h('mpath', { href: `#${p.id}` })));
  }))) : null;

  return svgRoot({ width, height, ariaLabel: `${labels.simAria} ${flow.name}` }, defs(uid), pathEls, out, tokens);
}
