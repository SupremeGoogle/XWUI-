/**
 * 3D space: lanes become floors on a tilted plane, steps float above their floor at a
 * height that grows with how long they took in the latest run; wires run across floors.
 * Pure CSS 3D (no WebGL), so it degrades to a flat drawing without transforms.
 */
import { h } from '../../../core/dom.js';
import { layoutColumns } from '../XWFFlowDiagram.logic.js';

const LANE_H = 128;
const COL_W = 210;
const NODE_W = 180;

const toneVar = (tone) => `var(--xw-${tone})`;

export function render3d({ flow, types, run, labels, systemsModel, ui, tilt, spin, height: heightScale }) {
  const { systems, systemOf } = systemsModel;
  const { steps } = layoutColumns(flow.graph, types);
  const laneIndex = new Map(systems.map((s, i) => [s.id, i]));
  const planeW = Math.max(900, 120 + steps.length * COL_W);
  const planeH = systems.length * LANE_H;
  const durationOf = (id) => run?.ledger.filter((r) => r.nodeId === id && r.durationMs).reduce((a, r) => a + r.durationMs, 0) ?? 0;
  const maxDur = Math.max(1, ...steps.map((s) => durationOf(s.node.id)));

  const pos = new Map();
  steps.forEach((s, i) => {
    const lane = laneIndex.get(systemOf(s.node)) ?? 0;
    const z = Math.round((28 + (durationOf(s.node.id) / maxDur) * 110) * heightScale);
    pos.set(s.node.id, { x: 60 + i * COL_W, y: lane * LANE_H + 34, z, lane, step: s });
  });

  const wires = flow.graph.edges.map((e) => {
    const a = pos.get(e.from); const b = pos.get(e.to);
    if (!a || !b) return null;
    const x1 = a.x + NODE_W; const y1 = a.y + 30; const x2 = b.x; const y2 = b.y + 30;
    const d = `M${x1} ${y1} C ${x1 + 40} ${y1}, ${x2 - 40} ${y2}, ${x2} ${y2}`;
    const tone = systems[b.lane]?.tone ?? 'violet';
    const off = b.step.node.disabled;
    return h('g', {},
      h('path', { d, stroke: off ? '#6f6f8a' : toneVar(tone), 'stroke-width': '5', 'stroke-dasharray': off ? '10 8' : null, fill: 'none' }),
      !off && h('path', { d, class: 'flow', stroke: '#fff', 'stroke-width': '2', fill: 'none' }));
  });

  const floors = systems.map((s, i) => h('div', { class: 'xwf-3d__lane', style: { '--lc': toneVar(s.tone), top: `${i * LANE_H}px`, width: `${planeW}px` } }, h('b', {}, s.label.toUpperCase())));
  const shadows = [...pos.values()].map((p) => h('div', { class: 'xwf-3d__shadow', style: { '--sc': toneVar(p.step.type.tone), left: `${p.x}px`, top: `${p.y}px` } }));
  const nodes = [...pos.values()].map((p, i) => {
    const failed = run?.ledger.some((r) => r.nodeId === p.step.node.id && r.result === 'failed');
    return h('div', {
      class: ['nd', 'nd3', 'xwf-3d__node', { off: p.step.node.disabled, fail: failed }],
      style: { '--z': `${p.z}px`, left: `${p.x}px`, top: `${p.y}px`, width: `${NODE_W}px`, '--gc': toneVar(p.step.type.tone), animationDelay: `${-i * 0.7}s` },
    }, h('div', { class: 'hd' },
      h('span', { class: 'ico s', style: { '--gc': toneVar(p.step.type.tone) } }, ui.icon(p.step.type.icon ?? 'box', { size: 'sm' })),
      h('div', {}, h('div', { class: 'nm' }, p.step.node.name), h('div', { class: 'ty' }, systems[p.lane]?.label ?? p.step.type.label))));
  });

  return h('div', { class: 'xwf-3d__stage', 'aria-label': `${labels.threeDAria} ${flow.name}`, role: 'img' },
    h('div', { class: 'orb', style: { '--oc': 'var(--xw-violet)', width: '70px', height: '70px', left: '6%', top: '60px' }, 'aria-hidden': 'true' }),
    h('div', { class: 'cube', style: { '--s': '46px', '--cc': 'var(--xw-lime)', left: '14%', bottom: '80px' }, 'aria-hidden': 'true' }, Array.from({ length: 6 }, () => h('i'))),
    h('div', { class: 'xwf-3d__plane', style: { width: `${planeW}px`, height: `${planeH}px`, marginLeft: `${-planeW / 2}px`, transform: `rotateX(${tilt}deg) rotateZ(${spin}deg)` } },
      floors,
      h('svg', { width: planeW, height: planeH, viewBox: `0 0 ${planeW} ${planeH}`, fill: 'none', 'stroke-linecap': 'round', class: 'xwf-3d__wires', 'aria-hidden': 'true' }, wires),
      shadows, nodes));
}
