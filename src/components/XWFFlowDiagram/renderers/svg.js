/**
 * Shared SVG pieces for the notation renderers: gradients per palette tone, arrow markers,
 * multi-line labels.
 */
import { h } from '../../../core/dom.js';

/** Two-stop vertical gradients matching the prototype's diagram fills. */
export const TONE_GRADIENTS = Object.freeze({
  lime: ['#e2ff8a', '#9fdc12'],
  cyan: ['#8af3ff', '#14b8d6'],
  violet: ['#c2a6ff', '#7444f0'],
  orange: ['#ffc08f', '#f46a12'],
  pink: ['#ff9bcb', '#e5207f'],
  amber: ['#ffe08a', '#e8a10c'],
  green: ['#9dffd0', '#16c27a'],
  red: ['#ff9aa5', '#e23347'],
});

/** Text colour that reads on each tone's fill. */
export const TONE_INK = Object.freeze({ violet: '#fff', red: '#fff' });
export const inkFor = (tone) => TONE_INK[tone] ?? '#0a0a0a';

export const LINE = '#c9c9dd';
export const MUTED = '#8a8aa6';

export function defs(uid) {
  return h('defs', {},
    Object.entries(TONE_GRADIENTS).map(([tone, [a, b]]) => h('linearGradient', { id: `${uid}-g-${tone}`, x1: '0', y1: '0', x2: '0', y2: '1' },
      h('stop', { offset: '0', 'stop-color': a }), h('stop', { offset: '1', 'stop-color': b }))),
    [['arrow', LINE], ['arrow-red', '#ff5c6c'], ['arrow-green', '#3dffa2'], ['arrow-amber', '#ffc53d'], ['arrow-muted', '#a9a9c2'], ['arrow-lime', '#c8ff3d']].map(([id, color]) => h('marker', {
      id: `${uid}-${id}`, viewBox: '0 0 10 10', refX: '9', refY: '5', markerWidth: '7', markerHeight: '7', orient: 'auto-start-reverse',
    }, h('path', { d: 'M0 0L10 5L0 10z', fill: color }))),
    h('filter', { id: `${uid}-glow`, x: '-50%', y: '-50%', width: '200%', height: '200%' },
      h('feGaussianBlur', { stdDeviation: '3', result: 'b' }),
      h('feMerge', {}, h('feMergeNode', { in: 'b' }), h('feMergeNode', { in: 'SourceGraphic' }))));
}

export const fill = (uid, tone) => `url(#${uid}-g-${tone ?? 'violet'})`;
export const marker = (uid, kind = 'arrow') => `url(#${uid}-${kind})`;

/** Centered label: first line bold, second smaller. */
export function label(x, y, lines, { color = '#0a0a0a', size = 16, sub = 12, anchor = 'middle' } = {}) {
  const [main, second] = Array.isArray(lines) ? lines : [lines];
  return h('g', {},
    h('text', { x, y: second ? y - 4 : y + 5, fill: color, 'font-size': size, 'text-anchor': anchor }, main),
    second && h('text', { x, y: y + 14, fill: color, 'font-size': sub, 'text-anchor': anchor, opacity: '.85' }, second));
}

/** Drop shadow + shape helper (the prototype offsets a black copy by 6px). */
export function shadowed(shapeFn, props) {
  return h('g', {}, shapeFn({ ...props, dx: 6, dy: 6, fill: '#000', opacity: '.5' }), shapeFn({ ...props, dx: 0, dy: 0 }));
}

export function svgRoot({ width, height, ariaLabel, className }, ...children) {
  return h('svg', {
    viewBox: `0 0 ${width} ${height}`, width: '100%', role: 'img', 'aria-label': ariaLabel,
    class: ['xwf-diagram__svg', className], preserveAspectRatio: 'xMidYMid meet',
  }, h('g', { 'font-family': 'Manrope, sans-serif', 'font-weight': '800' }, children));
}
