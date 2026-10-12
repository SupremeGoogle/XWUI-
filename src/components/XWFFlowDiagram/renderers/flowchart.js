/**
 * Classic flowchart (ISO 5807): Start/End terminals, input for the trigger, process boxes,
 * decisions, predefined process, document; a retrying step gets its retry loop drawn.
 */
import { diagramElement as h, paint } from './svg.js';
import { DIAGRAM_GEOMETRY as G } from '../XWFFlowDiagram.model.js';
import { layoutColumns } from '../XWFFlowDiagram.logic.js';
import { defs, fill, marker, label, svgRoot, inkFor, LINE, MUTED } from './svg.js';

const { column: COL, row: ROW, box: BOX } = G.flowchart;

const SHAPES = {
  terminal: ({ x, y, w, h: hh, fill: f, dx = 0, dy = 0, opacity }) => h('rect', { x: x + dx, y: y + dy, width: w, height: hh, rx: hh / 2, fill: f, opacity }),
  io: ({ x, y, w, h: hh, fill: f, dx = 0, dy = 0, opacity }) => h('polygon', { points: `${x + 20 + dx},${y + dy} ${x + w + dx},${y + dy} ${x + w - 20 + dx},${y + hh + dy} ${x + dx},${y + hh + dy}`, fill: f, opacity }),
  process: ({ x, y, w, h: hh, fill: f, dx = 0, dy = 0, opacity }) => h('rect', { x: x + dx, y: y + dy, width: w, height: hh, rx: 6, fill: f, opacity }),
  decision: ({ x, y, w, h: hh, fill: f, dx = 0, dy = 0, opacity }) => {
    const cx = x + w / 2 + dx; const cy = y + hh / 2 + dy; const r = 66;
    return h('polygon', { points: `${cx},${cy - 60} ${cx + r},${cy} ${cx},${cy + 60} ${cx - r},${cy}`, fill: f, opacity });
  },
  document: ({ x, y, w, h: hh, fill: f, dx = 0, dy = 0, opacity }) => h('path', { d: `M${x + dx} ${y + dy} h${w} v${hh - 10} c-40 -22 -90 22 -${w} 0 z`, fill: f, opacity }),
  predefined: ({ x, y, w, h: hh, fill: f, dx = 0, dy = 0, opacity }) => h('rect', { x: x + dx, y: y + dy, width: w, height: hh, rx: 6, fill: f, opacity }),
  delay: ({ x, y, w, h: hh, fill: f, dx = 0, dy = 0, opacity }) => h('path', { d: `M${x + dx} ${y + dy} h${w - hh / 2} a${hh / 2} ${hh / 2} 0 0 1 0 ${hh} h-${w - hh / 2} z`, fill: f, opacity }),
};

const SHAPE_OF = { terminal: 'io', io: 'predefined', process: 'process', decision: 'decision', data: 'document', delay: 'delay', junction: 'process' };

function drawShape(uid, shape, box, tone, { faded = false } = {}) {
  const fn = SHAPES[shape] ?? SHAPES.process;
  const parts = [fn({ ...box, dx: 6, dy: 6, fill: paint('shadow'), opacity: '.5' }), fn({ ...box, fill: faded ? paint('disabled-surface') : fill(uid, tone) })];
  if (shape === 'predefined') {
    parts.push(h('line', { x1: box.x + 16, y1: box.y, x2: box.x + 16, y2: box.y + box.h, stroke: paint('ink'), 'stroke-width': '2' }));
    parts.push(h('line', { x1: box.x + box.w - 16, y1: box.y, x2: box.x + box.w - 16, y2: box.y + box.h, stroke: paint('ink'), 'stroke-width': '2' }));
  }
  if (!faded && shape !== 'decision') parts.push(h('rect', { x: box.x + 10, y: box.y + 5, width: box.w - 20, height: 16, rx: 8, fill: paint('white'), opacity: '.22' }));
  return h('g', {}, parts);
}

export function renderFlowchart({ flow, types, labels, uid, thumbnail }) {
  const { steps, cols, minRow, maxRow } = layoutColumns(flow.graph, types);
  const retrying = new Set(steps.filter((s) => s.node.params?.retry && s.type.retry).map((s) => s.node.id));
  const extraCols = retrying.size;
  const width = 120 + (cols + 2 + extraCols) * COL;
  const top = 140 + (-minRow) * ROW;
  const height = top + (maxRow + 1) * ROW + 100;
  const pos = new Map();
  let shift = 0;
  const byCol = new Map();
  steps.forEach((s) => { if (!byCol.has(s.col)) byCol.set(s.col, []); byCol.get(s.col).push(s); });
  const out = [];
  const edges = [];
  const notes = [];
  const startBox = { x: 30, y: top, w: 150, h: 70 };
  out.push(drawShape(uid, 'terminal', startBox, 'lime'), label(105, top + 35, labels.start));
  [...byCol.keys()].sort((a, b) => a - b).forEach((col) => {
    byCol.get(col).forEach((s) => {
      const x = 260 + (col + shift) * COL;
      const y = top + s.row * ROW;
      const shape = SHAPE_OF[s.type.notation?.flowchart] ?? 'process';
      const box = { x, y, w: BOX.w, h: BOX.h };
      pos.set(s.node.id, { box, shape, step: s });
      const faded = s.node.disabled;
      out.push(drawShape(uid, shape, box, s.type.tone, { faded }));
      out.push(label(x + BOX.w / 2, y + 35, shape === 'decision' ? [s.node.name] : [s.node.name, s.type.label], { color: faded ? MUTED : inkFor(s.type.tone), size: shape === 'decision' ? 14 : 15 }));
      if (faded) notes.push(h('text', { x, y: y - 14, fill: MUTED, 'font-size': '12', 'font-family': 'JetBrains Mono' }, labels.disabled));
      if (retrying.has(s.node.id) && !thumbnail) {
        shift += 1;
        const dx = x + COL;
        const dbox = { x: dx, y, w: BOX.w, h: BOX.h };
        out.push(drawShape(uid, 'decision', dbox, 'orange'), label(dx + BOX.w / 2, y + 35, [labels.found, `${labels.tryWord} <= ${s.type.retry.tries}`], { size: 14, sub: 11 }));
        const wbox = { x: dx - 10, y: y + 220, w: 150, h: 56 };
        out.push(drawShape(uid, 'process', wbox, 'amber'), label(wbox.x + 75, wbox.y + 28, [`${labels.wait} ${s.type.retry.delayMs / 1000} ${labels.secondsUnit}`, labels.thenRetry], { size: 14 }));
        edges.push({ d: `M${x + BOX.w} ${y + 35} H${dx + 18}`, tone: 'arrow' });
        edges.push({ d: `M${dx + BOX.w / 2} ${y + 95} V${wbox.y - 4}`, tone: 'arrow', text: labels.no, at: [dx + BOX.w / 2 + 16, y + 150], color: paint('error-text') });
        edges.push({ d: `M${wbox.x} ${wbox.y + 28} H${x + BOX.w / 2} V${y + BOX.h + 6}`, tone: 'arrow', text: labels.tryAgain, at: [x + BOX.w / 2 + 20, wbox.y + 20], color: paint('warning-text') });
        pos.get(s.node.id).exit = { x: dx + BOX.w / 2 + 66, y: y + 35, yesLabel: true };
      }
      if (s.node.disabled === false && !faded && !thumbnail && s.col > 0) {
        notes.push(h('text', { x, y: y - 14, fill: MUTED, 'font-size': '12', 'font-family': 'JetBrains Mono' }, `${labels.step} ${s.col + 1}`));
      }
    });
  });
  // trigger connects from Start
  const first = steps.find((s) => s.col === 0);
  if (first) edges.push({ d: `M180 ${top + 35} H${pos.get(first.node.id).box.x - 6}` });
  // graph edges
  flow.graph.edges.forEach((e) => {
    const a = pos.get(e.from); const b = pos.get(e.to);
    if (!a || !b) return;
    const ax = a.exit?.x ?? a.box.x + BOX.w + (a.shape === 'decision' ? -19 : 0);
    const ay = a.exit?.y ?? a.box.y + 35;
    const bx = b.box.x + (b.shape === 'decision' ? 18 : 0);
    const by = b.box.y + 35;
    let d;
    if (e.port === 'yes' && a.shape === 'decision') d = `M${a.box.x + BOX.w / 2} ${a.box.y - 25} V${by} H${bx - 6}`;
    else if (e.port === 'no' && a.shape === 'decision') d = `M${a.box.x + BOX.w / 2} ${a.box.y + 95} V${by} H${bx - 6}`;
    else d = Math.abs(ay - by) < 2 ? `M${ax} ${ay} H${bx - 6}` : `M${ax} ${ay} H${(ax + bx) / 2} V${by} H${bx - 6}`;
    const port = e.port !== 'out' ? e.port : null;
    edges.push({ d, faded: b.step.node.disabled, text: port ? labels[port] ?? port : (a.exit?.yesLabel ? labels.yes : null), at: port ? [a.box.x + BOX.w / 2 + 14, port === 'yes' ? a.box.y - 40 : a.box.y + 130] : [ax + 10, ay - 10], color: port === 'no' ? paint('error-text') : 'var(--xw-lime)' });
  });
  // End terminal after the last column
  const sinks = flow.graph.nodes.filter((n) => !flow.graph.edges.some((e) => e.from === n.id) && pos.get(n.id));
  const endX = 260 + (cols + shift) * COL;
  const endBox = { x: endX, y: top, w: 110, h: 60 };
  out.push(drawShape(uid, 'terminal', endBox, 'lime'), label(endX + 55, top + 30, labels.end));
  sinks.forEach((n) => {
    const p = pos.get(n.id);
    edges.push({ d: `M${p.box.x + BOX.w} ${p.box.y + 35} H${endX - 40} V${top + 30} H${endX - 6}`, faded: n.disabled });
  });

  const edgeEls = edges.map((e) => h('g', {},
    h('path', { d: e.d, fill: 'none', stroke: e.faded ? MUTED : LINE, 'stroke-width': '2.5', 'stroke-dasharray': e.faded ? '7 6' : null, 'marker-end': marker(uid) }),
    e.text && h('text', { x: e.at[0], y: e.at[1], fill: e.color ?? LINE, 'font-size': '14' }, e.text)));

  return svgRoot({ width, height, ariaLabel: `${labels.flowchartAria} ${flow.name}` }, defs(uid), edgeEls, out, notes);
}
