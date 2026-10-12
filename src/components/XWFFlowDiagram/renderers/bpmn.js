/**
 * BPMN 2.0 collaboration: the trigger's source as a black-box pool sending a message to
 * the start event; the flow as a pool with lanes (automation + people); tasks with type
 * markers, exclusive gateways, an error boundary on retrying steps, a data store for table
 * steps, sticky notes as text annotations, and an end event.
 */
import { h } from '../../../core/dom.js';
import { layoutColumns } from '../XWFFlowDiagram.logic.js';
import { defs, marker, svgRoot, MUTED } from './svg.js';

const STROKE = '#d6d6e8';
const COL = 200;
const TASK = { w: 170, h: 76 };

const toneVar = (tone) => `var(--xw-${tone})`;

const TASK_MARKERS = {
  'task-service': (x, y, c) => [h('circle', { cx: x + 18, cy: y + 16, r: 7, fill: 'none', stroke: c, 'stroke-width': '2' }), h('circle', { cx: x + 18, cy: y + 16, r: 2.5, fill: c })],
  'task-send': (x, y, c) => [h('rect', { x: x + 12, y: y + 10, width: 20, height: 13, fill: c }), h('path', { d: `M${x + 12} ${y + 10} L${x + 22} ${y + 18} L${x + 32} ${y + 10}`, fill: 'none', stroke: '#06060d', 'stroke-width': '1.4' })],
  'task-script': (x, y, c) => [h('path', { d: `M${x + 14} ${y + 9} h14 c-6 6 6 10 0 16 h-14 c6 -6 -6 -10 0 -16 z`, fill: 'none', stroke: c, 'stroke-width': '1.6' })],
  'task-data': (x, y, c) => [h('rect', { x: x + 12, y: y + 10, width: 18, height: 14, fill: 'none', stroke: c, 'stroke-width': '1.6' })],
  task: () => [],
};

export function renderBpmn({ flow, types, labels, uid, systemsModel }) {
  const { systems, systemOf } = systemsModel;
  const { steps } = layoutColumns(flow.graph, types);
  const source = systems.find((s) => s.kind === 'source');
  const peopleLanes = systems.filter((s) => s.kind === 'people');
  const automation = { id: '__automation', label: labels.automation, tone: 'violet' };
  const lanes = [automation, ...peopleLanes];
  const laneOf = (node) => (peopleLanes.some((p) => p.id === systemOf(node)) ? systemOf(node) : automation.id);
  const laneH = 300;
  const poolTop = source ? 110 : 20;
  const width = Math.max(1100, 220 + (steps.length + 2) * COL);
  const height = poolTop + lanes.length * laneH + 20;
  const laneY = (id) => poolTop + lanes.findIndex((l) => l.id === id) * laneH;

  const out = [];
  const flows = [];
  if (source) {
    out.push(h('rect', { x: 120, y: 20, width: width - 140, height: 60, rx: 4, fill: 'rgba(46,230,255,.06)', stroke: STROKE, 'stroke-width': '1.6' }),
      h('text', { x: (width + 100) / 2, y: 56, 'text-anchor': 'middle', 'font-size': '16', fill: '#f5f5fa' }, source.label),
      h('text', { x: width - 30, y: 56, 'text-anchor': 'end', 'font-size': '11', fill: MUTED }, labels.blackBox));
  }
  out.push(h('rect', { x: 20, y: poolTop, width: width - 40, height: lanes.length * laneH, rx: 4, fill: 'rgba(255,255,255,.015)', stroke: STROKE, 'stroke-width': '1.6' }),
    h('line', { x1: 60, y1: poolTop, x2: 60, y2: poolTop + lanes.length * laneH, stroke: STROKE, 'stroke-width': '1.6' }),
    h('line', { x1: 100, y1: poolTop, x2: 100, y2: poolTop + lanes.length * laneH, stroke: '#5a5a75', 'stroke-width': '1.2' }),
    h('text', { transform: `translate(46 ${poolTop + (lanes.length * laneH) / 2}) rotate(-90)`, 'text-anchor': 'middle', 'font-size': '15', fill: '#f5f5fa' }, `${flow.name} (xwflow)`));
  lanes.forEach((l, i) => {
    if (i) out.push(h('line', { x1: 60, y1: poolTop + i * laneH, x2: width - 20, y2: poolTop + i * laneH, stroke: '#5a5a75', 'stroke-width': '1.2' }),
      h('rect', { x: 100, y: poolTop + i * laneH, width: width - 120, height: laneH, fill: toneVar(l.tone), opacity: '.035' }));
    out.push(h('text', { transform: `translate(86 ${poolTop + i * laneH + laneH / 2}) rotate(-90)`, 'text-anchor': 'middle', 'font-size': '13', fill: toneVar(l.tone) }, l.label));
  });

  const pos = new Map();
  let col = 0;
  steps.forEach((s) => {
    const lane = laneOf(s.node);
    const cy = laneY(lane) + laneH / 2 - (lane === automation.id ? 30 : 0);
    const kind = s.type.notation?.bpmn ?? 'task';
    const x = 150 + col * COL;
    pos.set(s.node.id, { x, cy, kind, step: s });
    col += 1;
  });

  const drawn = [];
  pos.forEach((p) => {
    const { step } = p;
    const c = toneVar(step.type.tone);
    if (p.kind.startsWith('start')) {
      drawn.push(h('circle', { cx: p.x + 20, cy: p.cy, r: 24, fill: '#06060d', stroke: 'var(--xw-lime)', 'stroke-width': '2.2' }));
      if (p.kind === 'start-message') drawn.push(h('rect', { x: p.x + 8, y: p.cy - 8, width: 24, height: 16, fill: 'none', stroke: 'var(--xw-lime)', 'stroke-width': '1.6' }), h('path', { d: `M${p.x + 8} ${p.cy - 8} L${p.x + 20} ${p.cy + 1} L${p.x + 32} ${p.cy - 8}`, fill: 'none', stroke: 'var(--xw-lime)', 'stroke-width': '1.6' }));
      else drawn.push(h('circle', { cx: p.x + 20, cy: p.cy, r: 12, fill: 'none', stroke: 'var(--xw-lime)', 'stroke-width': '1.6' }), h('path', { d: `M${p.x + 20} ${p.cy - 8} V${p.cy} H${p.x + 27}`, stroke: 'var(--xw-lime)', 'stroke-width': '1.6', fill: 'none' }));
      drawn.push(h('text', { x: p.x + 20, y: p.cy + 48, 'text-anchor': 'middle', 'font-size': '13', fill: '#f5f5fa' }, step.node.name));
      p.in = [p.x - 4, p.cy]; p.out = [p.x + 44, p.cy];
      if (source) flows.push(h('g', {}, h('path', { d: `M${p.x + 20} 88 V${p.cy - 28}`, stroke: '#a9a9c2', 'stroke-width': '1.8', 'stroke-dasharray': '8 6', fill: 'none', 'marker-end': marker(uid, 'arrow-muted') }),
        h('circle', { cx: p.x + 20, cy: 86, r: 5, fill: '#06060d', stroke: '#a9a9c2', 'stroke-width': '1.6' }),
        h('text', { x: p.x + 32, y: (88 + p.cy) / 2, 'font-size': '12', fill: '#a9a9c2' }, labels.message)));
    } else if (p.kind.startsWith('gateway')) {
      drawn.push(h('polygon', { points: `${p.x + 34},${p.cy - 34} ${p.x + 68},${p.cy} ${p.x + 34},${p.cy + 34} ${p.x},${p.cy}`, fill: '#06060d', stroke: 'var(--xw-orange)', 'stroke-width': '2.4' }));
      if (p.kind === 'gateway-xor') drawn.push(h('path', { d: `M${p.x + 23} ${p.cy - 11} L${p.x + 45} ${p.cy + 11} M${p.x + 45} ${p.cy - 11} L${p.x + 23} ${p.cy + 11}`, stroke: 'var(--xw-orange)', 'stroke-width': '3' }));
      else drawn.push(h('path', { d: `M${p.x + 34} ${p.cy - 14} V${p.cy + 14} M${p.x + 20} ${p.cy} H${p.x + 48}`, stroke: 'var(--xw-orange)', 'stroke-width': '3' }));
      drawn.push(h('text', { x: p.x + 34, y: p.cy - 48, 'text-anchor': 'middle', 'font-size': '13', fill: '#f5f5fa' }, step.node.params?.expression ? `${step.node.name}` : step.node.name));
      p.in = [p.x - 4, p.cy]; p.out = [p.x + 68, p.cy]; p.up = [p.x + 34, p.cy - 34]; p.down = [p.x + 34, p.cy + 34];
    } else {
      const disabled = step.node.disabled;
      drawn.push(h('rect', { x: p.x, y: p.cy - TASK.h / 2, width: TASK.w, height: TASK.h, rx: 14, fill: disabled ? 'rgba(255,255,255,.04)' : `color-mix(in srgb, ${c} 14%, transparent)`, stroke: disabled ? MUTED : c, 'stroke-width': '2', 'stroke-dasharray': disabled ? '6 5' : null }));
      drawn.push(...(TASK_MARKERS[p.kind] ?? TASK_MARKERS.task)(p.x, p.cy - TASK.h / 2, disabled ? MUTED : c));
      drawn.push(h('text', { x: p.x + TASK.w / 2, y: p.cy + 5, 'text-anchor': 'middle', 'font-size': '15', fill: disabled ? MUTED : '#f5f5fa' }, step.node.name));
      p.in = [p.x - 4, p.cy]; p.out = [p.x + TASK.w, p.cy];
      if (step.node.params?.retry && step.type.retry) {
        const bx = p.x + TASK.w - 20; const by = p.cy + TASK.h / 2;
        drawn.push(h('path', { d: `M${p.x + TASK.w / 2 - 6} ${p.cy + 28} a7 7 0 1 1 8 0`, fill: 'none', stroke: c, 'stroke-width': '1.8' }),
          h('circle', { cx: bx, cy: by, r: 16, fill: '#06060d', stroke: '#ff5c6c', 'stroke-width': '2' }),
          h('circle', { cx: bx, cy: by, r: 12, fill: 'none', stroke: '#ff5c6c', 'stroke-width': '1.4' }),
          h('path', { d: `M${bx - 6} ${by + 6} L${bx - 2} ${by - 4} L${bx + 2} ${by + 2} L${bx + 6} ${by - 8}`, fill: 'none', stroke: '#ff5c6c', 'stroke-width': '2' }),
          h('circle', { cx: bx - 70, cy: by + 86, r: 20, fill: '#06060d', stroke: '#ff5c6c', 'stroke-width': '5' }),
          h('text', { x: bx - 70, y: by + 128, 'text-anchor': 'middle', 'font-size': '12', fill: '#ff8e9a' }, `${labels.notFoundAfter} ${step.type.retry.tries} ${labels.tries}`),
          h('text', { x: bx - 70, y: by + 144, 'text-anchor': 'middle', 'font-size': '11', fill: MUTED }, labels.errorEnd));
        flows.push(h('path', { d: `M${bx} ${by + 16} V${by + 86} H${bx - 46}`, stroke: STROKE, 'stroke-width': '2', fill: 'none', 'marker-end': marker(uid) }));
      }
      if (p.kind === 'task-data') {
        const sx = p.x + TASK.w / 2 - 25; const sy = p.cy + TASK.h / 2 + 50;
        drawn.push(h('path', { d: `M${sx} ${sy} v34 a25 8 0 0 0 50 0 v-34`, fill: 'rgba(200,255,61,.1)', stroke: 'var(--xw-lime)', 'stroke-width': '1.8' }),
          h('ellipse', { cx: sx + 25, cy: sy, rx: 25, ry: 8, fill: 'rgba(200,255,61,.18)', stroke: 'var(--xw-lime)', 'stroke-width': '1.8' }),
          h('text', { x: sx + 25, y: sy + 62, 'text-anchor': 'middle', 'font-size': '12', fill: '#a9a9c2' }, step.node.params?.table ?? labels.dataStore));
        flows.push(h('path', { d: `M${p.x + TASK.w / 2} ${p.cy + TASK.h / 2} V${sy - 10}`, stroke: '#a9a9c2', 'stroke-width': '1.6', 'stroke-dasharray': '3 4', fill: 'none', 'marker-end': marker(uid, 'arrow-muted') }));
      }
    }
  });

  // sequence flows
  flow.graph.edges.forEach((e) => {
    const a = pos.get(e.from); const b = pos.get(e.to);
    if (!a || !b) return;
    let start = a.out;
    if (e.port === 'yes' && a.up && b.cy !== a.cy) start = b.cy < a.cy ? a.up : a.down;
    if (e.port === 'no' && a.down && b.cy !== a.cy) start = b.cy > a.cy ? a.down : a.up;
    const [sx, sy] = start; const [tx, ty] = b.in;
    const d = Math.abs(sy - ty) < 2 ? `M${sx} ${sy} H${tx}` : (start === a.out ? `M${sx} ${sy} H${(sx + tx) / 2} V${ty} H${tx}` : `M${sx} ${sy} V${ty} H${tx}`);
    flows.push(h('path', { d, stroke: STROKE, 'stroke-width': '2', fill: 'none', 'marker-end': marker(uid) }));
    if (e.port !== 'out') flows.push(h('text', { x: sx + 14, y: sy + (ty > sy ? 40 : -12), 'font-size': '13', fill: e.port === 'yes' ? '#c8ff3d' : '#a9a9c2' }, labels[e.port] ?? e.port));
  });
  // end event after the last automation step
  const ex = 150 + col * COL;
  const ey = poolTop + laneH / 2 - 30;
  drawn.push(h('circle', { cx: ex + 24, cy: ey, r: 22, fill: '#06060d', stroke: '#f5f5fa', 'stroke-width': '5' }),
    h('text', { x: ex + 24, y: ey + 46, 'text-anchor': 'middle', 'font-size': '13', fill: '#f5f5fa' }, labels.end));
  flow.graph.nodes.filter((n) => !flow.graph.edges.some((e) => e.from === n.id)).forEach((n) => {
    const p = pos.get(n.id);
    if (!p?.out) return;
    flows.push(h('path', { d: `M${p.out[0]} ${p.out[1]} H${ex - 20} V${ey} H${ex}`, stroke: STROKE, 'stroke-width': '2', fill: 'none', 'marker-end': marker(uid) }));
  });
  // annotations from sticky notes, attached to the first decision
  const gateway = [...pos.values()].find((p) => p.kind.startsWith('gateway'));
  (flow.graph.stickies ?? []).slice(0, 1).forEach((s) => {
    const ax = (gateway?.x ?? 300) + 110; const ay = poolTop + 14;
    const words = s.text.split(' ');
    const half = Math.ceil(words.length / 2);
    drawn.push(h('path', { d: `M${ax + 14} ${ay} H${ax} V${ay + 52} H${ax + 14}`, fill: 'none', stroke: MUTED, 'stroke-width': '1.6' }),
      h('text', { x: ax + 22, y: ay + 22, 'font-size': '12', fill: '#a9a9c2' }, words.slice(0, half).join(' ')),
      h('text', { x: ax + 22, y: ay + 39, 'font-size': '12', fill: '#a9a9c2' }, words.slice(half).join(' ')));
    if (gateway) drawn.push(h('path', { d: `M${ax} ${ay + 52} L${gateway.x + 34} ${gateway.cy - 34}`, stroke: MUTED, 'stroke-width': '1.4', 'stroke-dasharray': '2 4' }));
  });

  return svgRoot({ width, height, ariaLabel: `${labels.bpmnAria} ${flow.name}` }, defs(uid), out, flows, drawn);
}
