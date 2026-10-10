/**
 * Minimal hyperscript used by view projections.
 * XWUI does not export its internal view engine, so xwflow views build plain DOM
 * through this helper and mount XWUI components into the nodes it returns.
 *
 *   h('div', { class: 'glass pad', style: { gap: '8px' }, onClick }, 'text', child)
 *
 * Props: class (string | array | object map), style (object or string), dataset (object),
 * on<Event> (listener), ref (callback receiving the element), any other key -> attribute
 * (boolean true -> empty attribute, false/null/undefined -> omitted).
 */
const SVG_NS = 'http://www.w3.org/2000/svg';
const SVG_TAGS = new Set([
  'svg', 'g', 'path', 'rect', 'circle', 'ellipse', 'line', 'polyline', 'polygon', 'text', 'tspan',
  'defs', 'marker', 'linearGradient', 'radialGradient', 'stop', 'clipPath', 'mask', 'pattern', 'use', 'title',
  'foreignObject', 'filter', 'feGaussianBlur', 'feMerge', 'feMergeNode',
  'animateMotion', 'mpath', 'set',
]);

export function classNames(value) {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.map(classNames).filter(Boolean).join(' ');
  return Object.keys(value).filter((k) => value[k]).join(' ');
}

function applyProps(el, props, isSvg) {
  for (const [key, value] of Object.entries(props)) {
    if (value === undefined || value === null || value === false) continue;
    if (key === 'class' || key === 'className') {
      const cls = classNames(value);
      if (cls) el.setAttribute('class', cls);
    } else if (key === 'style') {
      if (typeof value === 'string') el.setAttribute('style', value);
      else for (const [prop, v] of Object.entries(value)) {
        if (v === undefined || v === null) continue;
        if (prop.startsWith('--')) el.style.setProperty(prop, String(v));
        else el.style[prop] = v;
      }
    } else if (key === 'dataset') {
      for (const [k, v] of Object.entries(value)) if (v !== undefined && v !== null) el.dataset[k] = String(v);
    } else if (key === 'ref') {
      value(el);
    } else if (key.startsWith('on') && typeof value === 'function') {
      el.addEventListener(key.slice(2).toLowerCase(), value);
    } else if (key === 'html') {
      el.innerHTML = value;
    } else if (key === 'text') {
      el.textContent = value;
    } else if (!isSvg && key in el && typeof value !== 'string' && key !== 'list') {
      el[key] = value;
    } else {
      el.setAttribute(key, value === true ? '' : String(value));
    }
  }
}

export function append(parent, children) {
  for (const child of children.flat(Infinity)) {
    if (child === undefined || child === null || child === false || child === true) continue;
    parent.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return parent;
}

export function h(tag, props, ...children) {
  if (props instanceof Node || typeof props !== 'object' || props === null || Array.isArray(props)) {
    if (props !== undefined && props !== null) children.unshift(props);
    props = {};
  }
  const isSvg = SVG_TAGS.has(tag);
  const el = isSvg ? document.createElementNS(SVG_NS, tag) : document.createElement(tag);
  applyProps(el, props, isSvg);
  return append(el, children);
}

export const fragment = (...children) => append(document.createDocumentFragment(), children);

/** Remove every child of a node. */
export function clear(node) {
  node.replaceChildren();
  return node;
}

/** Inline SVG markup from trusted local data (icons, diagram glyphs). */
export function svgFromString(markup) {
  const tpl = document.createElement('template');
  tpl.innerHTML = markup.trim();
  return tpl.content.firstElementChild;
}

/** Load a stylesheet once; the id-based guard also satisfies XWUI's own CSS loader. */
export function ensureStylesheet(id, href) {
  if (document.getElementById(id)) return;
  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  link.href = String(href);
  document.head.append(link);
}
