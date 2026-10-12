/**
 * XWFFlowCanvas - view.
 * Projects the graph into a transformed "world" layer (frames, stickies, edges, nodes) and
 * screen-space overlays (tools, minimap). Returns the element references the component
 * needs to patch positions while dragging without re-rendering everything.
 */
import { h } from '../../core/dom.js';
import { edgeGeometry, nodeHeight, isBranching, outputPorts } from './XWFFlowCanvas.logic.js';
import { XWF_NODE_GEOMETRY as G } from './XWFFlowCanvas.model.js';

const tone = (name) => `var(--xw-${name ?? 'violet'})`;

function nodeCard(node, type, state, { width, selected, readOnly, ui, statusEl, portLabels }) {
  const branching = isBranching(type);
  const classes = ['xwf-node', 'nd', {
    sel: selected,
    pinned: node.pinned,
    off: node.disabled,
    fail: state?.kind === 'err',
    'is-readonly': readOnly,
  }];
  const pins = [];
  pins.push(h('span', { class: ['pin', 'l', { on: !node.disabled }], style: { top: `${G.portY - 6}px` }, 'aria-hidden': 'true' }));
  const outPorts = outputPorts(type);
  outPorts.forEach(([port, y]) => pins.push(h('span', {
    class: ['pin', 'r', 'on', 'xwf-node__out'],
    style: { top: `${y - 6}px` },
    dataset: { port, nodeId: node.id },
    title: branching ? portLabels[port] ?? port : null,
    'aria-hidden': 'true',
  })));
  return h('div', {
    class: classes,
    style: { left: `${node.x}px`, top: `${node.y}px`, width: `${width}px`, minHeight: `${nodeHeight(type) - 16}px`, '--gc': tone(type?.tone) },
    dataset: { nodeId: node.id },
    role: 'button',
    tabindex: '-1',
    'aria-pressed': String(selected),
    'aria-label': `${node.name}, ${type?.label ?? node.type}${state ? `, ${state.label}` : ''}`,
  },
  pins,
  h('div', { class: 'hd' },
    h('span', { class: 'ico s', style: { '--gc': tone(type?.tone) } }, ui.icon(type?.icon ?? 'box', { size: 'sm', color: 'currentColor' })),
    h('div', { class: 'xwf-node__titles' },
      h('div', { class: 'nm' }, node.name),
      h('div', { class: ['ty', { 'xwf-node__warn': node.needsConnection }] }, node.needsConnection ? state?.needsConnectionLabel ?? type?.label : type?.label ?? node.type))),
  state && statusEl(state.label, state.kind));
}

export function projectXWFFlowCanvasView(model, ctx) {
  const { graph, types, states, selectedId, width, readOnly, portLabels, labels } = model;
  const { ui, statusEl } = ctx;
  const edges = edgeGeometry(graph, types, width);
  const nodeById = new Map(graph.nodes.map((n) => [n.id, n]));

  const defs = h('defs', {}, edges.map((e) => h('linearGradient', {
    id: `xwf-eg-${ctx.uid}-${e.id}`, gradientUnits: 'userSpaceOnUse', x1: e.a.x, y1: e.a.y, x2: e.b.x, y2: e.b.y,
  },
  h('stop', { offset: '0', style: { stopColor: tone(types[nodeById.get(e.from)?.type]?.tone) } }),
  h('stop', { offset: '1', style: { stopColor: tone(types[nodeById.get(e.to)?.type]?.tone) } }))));

  const edgeRefs = new Map();
  const edgeEls = edges.map((e) => {
    const target = nodeById.get(e.to);
    const muted = target?.disabled;
    const base = h('path', { d: e.d, class: ['xwf-edge', { 'is-muted': muted, 'is-selected': selectedId === e.id }], style: { stroke: muted ? 'var(--xw-tx3)' : `url(#xwf-eg-${ctx.uid}-${e.id})` }, dataset: { edgeId: e.id } });
    const flow = h('path', { d: e.d, class: ['xwf-edge__flow', 'flow', { 'is-hidden': muted }] });
    const hit = h('path', { d: e.d, class: 'xwf-edge__hit', dataset: { edgeId: e.id } });
    edgeRefs.set(e.id, [base, flow, hit]);
    return h('g', {}, base, flow, hit);
  });

  const svg = h('svg', { class: 'xwf-flow-canvas__wires wires', width: '1', height: '1', 'aria-hidden': 'true' }, defs, edgeEls,
    h('path', { class: 'xwf-edge xwf-edge--draft', d: '', 'data-draft': 'true' }));

  const portLabelEls = edges.filter((e) => e.port !== 'out').map((e) => h('span', {
    class: ['xs', 'b', 'xwf-edge__label', `xwf-edge__label--${e.port}`],
    style: { left: `${e.labelAt.x}px`, top: `${e.port === 'no' ? e.a.y + 6 : e.labelAt.y - 10}px` },
    dataset: { edgeLabel: e.id },
  }, portLabels[e.port] ?? e.port));

  const frames = (graph.frames ?? []).map((f) => [
    h('div', { class: 'xwf-frame', style: { left: `${f.x}px`, top: `${f.y}px`, width: `${f.w}px`, height: `${f.h}px`, '--fc': tone(f.tone) } }),
    h('div', { class: 'xwf-frame__label', style: { left: `${f.x + 14}px`, top: `${f.y + 8}px` } }, ui.tag(f.label, f.tone === 'lime' ? 'primary' : 'default', f.tone === 'lime' ? {} : { className: `xw-tone-${f.tone}` })),
  ]);

  const stickies = (graph.stickies ?? []).map((s) => h('div', {
    class: 'xwf-sticky', style: { left: `${s.x}px`, top: `${s.y}px`, transform: `rotate(${s.rotate ?? 0}deg)` }, role: 'note',
  }, s.text));

  const nodeRefs = new Map();
  const nodes = graph.nodes.map((n) => {
    const el = nodeCard(n, types[n.type], states[n.id], { width, selected: selectedId === n.id, readOnly, ui, statusEl, portLabels });
    nodeRefs.set(n.id, el);
    return el;
  });

  const world = h('div', { class: 'xwf-flow-canvas__world' }, frames, stickies, svg, portLabelEls, nodes);

  const empty = !graph.nodes.length && h('div', { class: 'xwf-flow-canvas__empty' }, labels.empty);

  return { world, svg, nodeRefs, edgeRefs, empty };
}

/** Minimap overlay (screen space). */
export function projectXWFFlowMinimap(mini, { selectedId, labels, box }) {
  return h('div', { class: 'xwf-minimap fl', role: 'img', 'aria-label': labels.minimap, style: { width: `${box.width}px`, height: `${box.height}px` } },
    mini.nodes.map((n) => h('i', {
      class: ['xwf-minimap__node', { 'is-selected': n.id === selectedId, 'is-off': n.disabled }],
      style: { left: `${n.x}px`, top: `${n.y}px`, width: `${Math.max(6, n.w)}px`, height: `${Math.max(4, n.h * 0.45)}px`, background: n.disabled ? 'var(--xw-tx3)' : tone(n.tone) },
    })),
    h('b', { class: 'xwf-minimap__view', style: { left: `${mini.view.x}px`, top: `${mini.view.y}px`, width: `${mini.view.w}px`, height: `${mini.view.h}px` } }));
}
