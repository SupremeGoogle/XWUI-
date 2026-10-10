/** Zone-local extensions of the shared XWUI kit. All controls remain XWUI basic. */
import { XWUICard, XWUIInputText, XWUIInputSelect, XWUIInputColor, XWUIInputSwitch, XWUIInputUpload, XWUIDisplayStatusPill, XWUIDisplayStatistic, XWUIList, XWUINavTabs, XWUINavPagination, XWUIOverlayDialog } from '@exonware/xwui/basic';
import { createKit } from '../core/ui.js';
import { h, ensureStylesheet } from '../core/dom.js';

export function createXwfKit(owner) {
  // The concrete pill shares the base stylesheet; its own inferred CDN path is absent.
  ensureStylesheet('xwui-css-xwuidisplaystatuspill', 'https://xwui.dev/styles/components/basic/XWUIDisplayStatus/XWUIDisplayStatus.css');
  const kit = createKit(owner);
  const { ui, scope } = kit;
  ui.card = (body, conf = {}, data = {}) => ui.mount(XWUICard, { body, ...data }, { variant: 'outlined', padding: 'large', glassEffect: true, ...conf }, { className: 'xwf-card-host' });
  ui.status = (label, variant = 'neutral') => ui.mount(XWUIDisplayStatusPill, { label }, { variant, size: 'sm', dot: true }, { tag: 'span', className: 'xwf-status-host' });
  ui.statistic = (data, conf = {}) => ui.mount(XWUIDisplayStatistic, data, { countUp: false, size: 'lg', ...conf });
  ui.text = (data, onChange, conf = {}) => {
    const el = ui.mount(XWUIInputText, data, { fullWidth: true, ...conf });
    if (onChange) el.xw.onChange(onChange);
    return el;
  };
  ui.select = (data, onChange, conf = {}) => {
    const el = ui.mount(XWUIInputSelect, data, { fullWidth: true, placeholder: data.options?.find((item) => item.value === '')?.label, ...conf });
    if (onChange) el.xw.onChange(onChange);
    return el;
  };
  ui.color = (value, onChange, conf = {}) => {
    const { fieldLabel, ...config } = conf;
    const el = ui.mount(XWUIInputColor, { value }, config);
    const labelField = () => { if (!fieldLabel) return; el.querySelector('input')?.setAttribute('aria-label', fieldLabel); el.querySelector('button')?.setAttribute('aria-label', `${fieldLabel} picker`); };
    labelField();
    scope.onDispose(el.xw.getInput()?.logic.subscribe(labelField));
    // The picker forwards a value event; native typing is observed separately.
    if (onChange) {
      el.xw.getPicker?.()?.onChange(onChange);
      scope.listen(el, 'input', () => { onChange(el.xw.getValue?.() ?? el.xw.data.value); labelField(); });
      scope.listen(el, 'change', (event) => onChange(event.detail?.value ?? el.xw.getValue?.() ?? el.xw.data.value));
      const off = el.xw.logic.subscribe(() => { const next = el.xw.data.value; if (next !== value) { value = next; onChange(next); } });
      scope.onDispose(off);
    }
    return el;
  };
  ui.switch = (data, onChange, conf = {}) => {
    const el = ui.mount(XWUIInputSwitch, data, conf);
    if (onChange) el.xw.onChange(onChange);
    return el;
  };
  ui.upload = (label, onUpload, conf = {}) => {
    const el = ui.mount(XWUIInputUpload, { label, files: [] }, { multiple: false, maxCount: 1, dragDrop: true, ...conf });
    el.querySelector('[role="button"]')?.setAttribute('aria-label', label);
    el.xw.onUpload(onUpload);
    return el;
  };
  ui.list = (labels, conf = {}) => ui.mount(XWUIList, { items: labels.map((label, index) => typeof label === 'string' ? { id: String(index), label } : label) }, { size: 'sm', ...conf });
  ui.tabs = (tabs, activeTab, onChange, conf = {}) => {
    const el = ui.mount(XWUINavTabs, { tabs, activeTab }, { variant: 'button', contentMode: 'hidden', ...conf });
    el.xw.onChange(onChange);
    return el;
  };
  ui.pager = (result, onChange) => {
    const el = ui.mount(XWUINavPagination, { current: result.page, total: result.total, pageSize: result.pageSize }, { showTotal: true });
    el.xw.onChange(onChange);
    return el;
  };
  // Explicit open() is required by the current CDN dialog; data.open is not part of its schema.
  ui.modal = ({ title, content, actions = [], size = 'md' }) => new Promise((resolve) => {
    const dialogKit = createXwfKit();
    const host = h('div');
    document.body.append(host);
    let settled = false;
    let dialog;
    let detach = null;
    const finish = (result) => {
      if (settled) return;
      settled = true;
      resolve(result);
      queueMicrotask(() => { dialog?.destroy(); dialogKit.scope.destroy(); host.remove(); detach?.(); });
    };
    const footer = h('div', { class: 'rowf gap12 xwf-dialog-actions' }, actions.map((action) => dialogKit.ui.button(action.label, { variant: action.variant ?? 'secondary', onClick: () => finish(action.id) })));
    dialog = new XWUIOverlayDialog(host, { title, content, footer }, { size });
    dialog.onClose(() => finish(null));
    scope.onDispose(() => finish(null));
    dialog.open();
  });
  return kit;
}

/** Start a page with a visible CDN skeleton; async renders stop when the route changes. */
export function pageSession(el) {
  const kit = createXwfKit();
  const initialHash = location.hash;
  let disposed = false;
  el.replaceChildren(kit.ui.skeleton({ width: '100%', height: '240px' }));
  const session = {
    ...kit,
    get active() { return !disposed && el.isConnected && location.hash === initialHash; },
    handle: { unmount() { disposed = true; kit.scope.destroy(); } },
  };
  return session;
}

export function routeAction(ui, action, conf = {}) {
  return ui.button(action.label, { variant: action.variant ?? 'outline', href: `#${action.path}`, ...conf });
}

export function titleBlock(data, centered = false) {
  return h('div', { class: `stack gap16 ${centered ? 'center' : ''}` },
    data.eyebrow && h('span', { class: 'eyebrow' }, data.eyebrow),
    h(data.eyebrow ? 'h2' : 'h1', { class: data.eyebrow ? 'h2' : 'h2 xwf-page-title' }, data.heading ?? data.title, data.accent && h('br'), data.accent && h('span', { class: 'grad-text' }, data.accent)),
    data.description && h('p', { class: data.eyebrow ? 'lead' : 'sec' }, data.description));
}

export function saveDownload(text, name, type = 'text/csv;charset=utf-8') {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const link = h('a', { href: url, download: name });
  document.body.append(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function assetImage(assets, id, className = '', decorative = false) {
  const asset = assets[id];
  return asset ? h('img', { src: asset.path, alt: decorative ? '' : asset.alt, width: asset.width, height: asset.height, class: className, loading: 'lazy' }) : null;
}
