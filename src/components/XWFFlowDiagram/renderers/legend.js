/**
 * Legend symbols: the notation's shapes at swatch size, so a page legend shows exactly
 * what the diagram draws. Solid tone fills (no gradients), 28 x 18 viewBox.
 */
import { h } from '../../../core/dom.js';

const toneVar = (tone) => `var(--xw-${tone})`;
const W = 28;
const H = 18;

const SYMBOLS = {
  /* ISO 5807 */
  terminal: (c) => h('rect', { x: 1, y: 3, width: 26, height: 12, rx: 6, fill: c }),
  io: (c) => h('polygon', { points: '6,3 27,3 22,15 1,15', fill: c }),
  process: (c) => h('rect', { x: 2, y: 3, width: 24, height: 12, rx: 2, fill: c }),
  decision: (c) => h('polygon', { points: '14,1 25,9 14,17 3,9', fill: c }),
  predefined: (c) => h('g', {}, h('rect', { x: 2, y: 3, width: 24, height: 12, rx: 2, fill: c }),
    h('line', { x1: 6, y1: 3, x2: 6, y2: 15, stroke: '#0a0a0a', 'stroke-width': 1.5 }), h('line', { x1: 22, y1: 3, x2: 22, y2: 15, stroke: '#0a0a0a', 'stroke-width': 1.5 })),
  document: (c) => h('path', { d: 'M2 3 h24 v10 c-8 -4 -16 4 -24 0 z', fill: c }),
  /* BPMN 2.0 */
  start: (c) => h('circle', { cx: 14, cy: 9, r: 7, fill: 'none', stroke: c, 'stroke-width': 2 }),
  boundary: (c) => h('g', {}, h('circle', { cx: 14, cy: 9, r: 7.5, fill: 'none', stroke: c, 'stroke-width': 1.5 }), h('circle', { cx: 14, cy: 9, r: 5, fill: 'none', stroke: c, 'stroke-width': 1.5 })),
  end: (c) => h('circle', { cx: 14, cy: 9, r: 6.5, fill: 'none', stroke: c, 'stroke-width': 3.5 }),
  task: (c) => h('rect', { x: 3, y: 3, width: 22, height: 12, rx: 4, fill: 'none', stroke: c, 'stroke-width': 2 }),
  gateway: (c) => h('polygon', { points: '14,2 21,9 14,16 7,9', fill: 'none', stroke: c, 'stroke-width': 2 }),
  message: (c) => h('line', { x1: 2, y1: 9, x2: 26, y2: 9, stroke: c, 'stroke-width': 2, 'stroke-dasharray': '4 3' }),
  datastore: (c) => h('g', {}, h('path', { d: 'M8 5 v9 c0 2 12 2 12 0 v-9', fill: 'none', stroke: c, 'stroke-width': 1.6 }), h('ellipse', { cx: 14, cy: 5, rx: 6, ry: 2, fill: 'none', stroke: c, 'stroke-width': 1.6 })),
};

/** One symbol as an inline SVG; unknown symbols fall back to a process box. */
export function legendSymbol(symbol, tone = 'violet') {
  const draw = SYMBOLS[symbol] ?? SYMBOLS.process;
  return h('svg', { class: 'xwf-diagram__symbol', width: W, height: H, viewBox: `0 0 ${W} ${H}`, 'aria-hidden': 'true' }, draw(toneVar(tone)));
}
