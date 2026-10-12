/** Shared SVG projection, semantic paint classes and standalone export. */
import { h as dom, classNames } from '../../../core/dom.js';
import { DIAGRAM_TONES, SVG_EXPORT_PROPERTIES } from '../XWFFlowDiagram.model.js';

export const paint = (name) => `var(--xwf-dg-${name})`;
export const LINE = paint('stroke');
export const MUTED = paint('muted');
export const inkFor = (tone) => paint(['violet', 'red'].includes(tone) ? 'white' : 'ink');

/** SVG paint uses classes or inline CSS, never var() in presentation attributes. */
export function diagramElement(tag, props = {}, ...children) {
  const attrs = { ...props };
  const style = { ...attrs.style };
  const classes = [classNames(attrs.class)];
  for (const key of ['fill', 'stroke', 'stop-color']) {
    const value = attrs[key];
    if (typeof value !== 'string' || !value.includes('var(')) continue;
    const token = /^var\(--xwf-dg-([\w-]+)\)$/.exec(value);
    if (token) {
      classes.push(`xwf-dg__${key}`);
      style[`--xwf-dg-paint-${key}`] = value;
    }
    else style[key === 'stop-color' ? 'stopColor' : key] = value;
    delete attrs[key];
  }
  if (classes.some(Boolean)) attrs.class = classes;
  if (Object.keys(style).length) attrs.style = style;
  return dom(tag, attrs, ...children);
}
const h = diagramElement;

export function defs(uid) {
  return h('defs', {},
    DIAGRAM_TONES.map((tone) => h('linearGradient', { id: `${uid}-g-${tone}`, x1: '0', y1: '0', x2: '0', y2: '1' },
      h('stop', { offset: '0', 'stop-color': paint(`${tone}-start`) }),
      h('stop', { offset: '1', 'stop-color': paint(`${tone}-end`) }))),
    [['arrow', 'stroke'], ['arrow-red', 'red'], ['arrow-green', 'green'], ['arrow-amber', 'amber'], ['arrow-muted', 'secondary'], ['arrow-lime', 'lime']].map(([id, color]) => h('marker', {
      id: `${uid}-${id}`, viewBox: '0 0 10 10', refX: '9', refY: '5', markerWidth: '7', markerHeight: '7', orient: 'auto-start-reverse',
    }, h('path', { d: 'M0 0L10 5L0 10z', fill: paint(color) }))),
    h('filter', { id: `${uid}-glow`, x: '-50%', y: '-50%', width: '200%', height: '200%' },
      h('feGaussianBlur', { stdDeviation: '3', result: 'b' }),
      h('feMerge', {}, h('feMergeNode', { in: 'b' }), h('feMergeNode', { in: 'SourceGraphic' }))));
}
export const fill = (uid, tone) => `url(#${uid}-g-${tone ?? 'violet'})`;
export const marker = (uid, kind = 'arrow') => `url(#${uid}-${kind})`;

export function label(x, y, lines, { color = paint('ink'), size = 16, sub = 12, anchor = 'middle' } = {}) {
  const [main, second] = Array.isArray(lines) ? lines : [lines];
  return h('g', {},
    h('text', { x, y: second ? y - 4 : y + 5, fill: color, 'font-size': size, 'text-anchor': anchor }, main),
    second && h('text', { x, y: y + 14, fill: color, 'font-size': sub, 'text-anchor': anchor, opacity: '.85' }, second));
}
export function shadowed(shapeFn, props) {
  return h('g', {}, shapeFn({ ...props, dx: 6, dy: 6, fill: paint('shadow'), opacity: '.5' }), shapeFn({ ...props, dx: 0, dy: 0 }));
}
export function svgRoot({ width, height, ariaLabel, className }, ...children) {
  return h('svg', { viewBox: `0 0 ${width} ${height}`, width: '100%', role: 'img', 'aria-label': ariaLabel,
    class: ['xwf-diagram__svg', className], preserveAspectRatio: 'xMidYMid meet' },
  h('g', { style: { fontFamily: 'var(--xw-font-body)', fontWeight: '800' } }, children));
}

/** Freeze computed paint and typography so the export has no theme dependency. */
export function serializeSvg(svg) {
  const copy = svg.cloneNode(true);
  copy.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  const originals = [svg, ...svg.querySelectorAll('*')];
  const clones = [copy, ...copy.querySelectorAll('*')];
  originals.forEach((element, index) => {
    const css = getComputedStyle(element);
    for (const property of SVG_EXPORT_PROPERTIES) {
      const value = css.getPropertyValue(property);
      if (value) clones[index].style.setProperty(property, value.replace(/url\(["']?[^)]*#([^"')]+)["']?\)/g, 'url(#$1)'));
    }
    for (const key of Array.from(clones[index].style)) if (key.startsWith('--')) clones[index].style.removeProperty(key);
  });
  return `<?xml version="1.0" encoding="UTF-8"?>\n${copy.outerHTML}`;
}
