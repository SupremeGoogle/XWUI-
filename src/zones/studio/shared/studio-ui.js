/**
 * Studio view helpers shared by several pages: status markers, KPI tiles, step chains,
 * owner chips, project tabs and the "not in this prototype" notice.
 */
import { XWUIDisplayStatistic, XWUINavTabs, XWUISelect, XWUIInputText } from '@exonware/xwui/basic';
import { h } from '../../../core/dom.js';
import { template } from '../../../core/format.js';
import { XWFStatus } from '../../../components/XWFStatus/XWFStatus.js';
import { STUDIO_COPY } from '../studio.copy.js';

export function statusEl(scope, label, kind, conf = {}) {
  const host = h('span', { class: 'xw-host' });
  scope.mount(XWFStatus, host, { label }, { kind, ...conf });
  return host;
}

/** Prototype .kpi tile wrapping an XWUIDisplayStatistic. tone: a --xw-* colour name. */
export function kpiEl(scope, { title, value, tone = 'violet', valueTone = null, footnote = null }) {
  const host = h('div');
  const tile = h('div', { class: ['kpi', 'studio-kpi', valueTone && `studio-kpi--${valueTone}`], style: { '--kc': `var(--xw-${tone})` } }, host);
  scope.mount(XWUIDisplayStatistic, host, { title, value, footnote: footnote ?? undefined }, { valueType: 'integer', countUp: true, countUpDuration: 600 });
  return tile;
}

export function chainEl(tones) {
  const parts = [];
  tones.forEach((tone, i) => {
    if (i) parts.push(h('b'));
    parts.push(h('i', { style: { '--c': `var(--xw-${tone})` } }));
  });
  return h('span', { class: 'chain', role: 'img', 'aria-label': template(STUDIO_COPY.chainLabel, { n: tones.length }) }, parts);
}

export function ownerEl(owner) {
  return h('span', { class: 'studio-owner' }, h('span', { class: 'avatar', style: { background: owner.gradient }, 'aria-hidden': 'true' }), owner.name);
}

/**
 * Project tabs (XWUINavTabs, button variant). Tabs without a route explain that the
 * section is outside the prototype instead of doing nothing.
 */
export function projectTabsEl(scope, ctx, tabs, activeId) {
  const host = h('div', { class: 'studio-tabs' });
  const nav = scope.mount(XWUINavTabs, host, {
    tabs: tabs.map((t) => ({ id: t.id, label: t.label })),
    activeTab: activeId,
  }, { variant: 'button', size: 'sm', ariaLabel: STUDIO_COPY.projectTabsLabel, hideContent: true });
  nav.onChange?.((id) => {
    const tab = tabs.find((t) => t.id === (id?.id ?? id));
    if (!tab || tab.id === activeId) return;
    if (tab.route) ctx.navigate(tab.route);
    else {
      ctx.notify.info(template(STUDIO_COPY.notInPrototype, { name: tab.label }));
      nav.setActiveTab?.(activeId);
    }
  });
  return host;
}

export function searchEl(scope, { placeholder, value = '', onChange, debounceMs = 220 }) {
  const host = h('div', { class: 'studio-filters__search' });
  const input = scope.mount(XWUIInputText, host, { placeholder, value }, { leadingIcon: 'search', fullWidth: true, clearable: true, ariaLabel: placeholder, size: 'md' });
  let timer = null;
  input.onChange?.((v) => {
    clearTimeout(timer);
    timer = setTimeout(() => onChange(v), debounceMs);
  });
  scope.onDispose(() => clearTimeout(timer));
  return host;
}

export function selectEl(scope, { label, options, value, onChange }) {
  const host = h('div', { class: 'studio-filters__select' });
  const select = scope.mount(XWUISelect, host, { options, value, placeholder: label }, { size: 'medium', fullWidth: true });
  select.onChange?.((v) => onChange(Array.isArray(v) ? v[0] : v));
  host.setAttribute('aria-label', label);
  return host;
}

/** Trigger a browser download for text content produced by the API. */
export function downloadText({ fileName, mimeType, content }) {
  const url = URL.createObjectURL(new Blob([content], { type: mimeType }));
  const a = h('a', { href: url, download: fileName });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
