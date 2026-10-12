/**
 * XWUI mounting helpers.
 *
 * A Scope owns every XWUI instance and DOM listener created for one page, layout or
 * custom component and destroys them together. The factory helpers create a host element,
 * construct the XWUI component inside it and return the host so views can place it with h().
 *
 *   const scope = createScope();
 *   const ui = createUi(scope);
 *   h('div', {}, ui.button('Save', { variant: 'primary', onClick: save }), ui.tag('Live', 'success'));
 *   scope.destroy();
 */
import {
  XWUIButton,
  XWUIIcon,
  XWUIDisplayTag,
  XWUIProgressSpinner,
  XWUIProgressSkeleton,
  XWUIFeedbackEmpty,
  XWUIFeedbackAlert,
  XWUIOverlayDialog,
  linkLabelToField,
  linkLabelToWidget,
} from '@exonware/xwui/basic';
import { h } from './dom.js';

let fieldSequence = 0;

/** Link labels in legacy CDN controls after their scheduled render. */
function connectFieldLabel(scope, host, text) {
  if (!text) return;
  const id = `xwf-field-${++fieldSequence}`;
  const link = () => {
    const field = host.querySelector('input:not([type="hidden"]), textarea, select, [role="combobox"], [role="switch"]');
    if (!field) return;
    field.id ||= id;
    const label = host.querySelector('label');
    if (!label) { field.setAttribute('aria-label', text); return; }
    if (field.matches('input, textarea, select')) linkLabelToField(label, field.id);
    linkLabelToWidget(label, field, field.id);
  };
  const observer = new MutationObserver(link);
  observer.observe(host, { childList: true, subtree: true });
  link();
  scope.onDispose(() => observer.disconnect());
}

export function createScope(owner = null) {
  const instances = new Set();
  const disposers = new Set();
  return {
    /** Track an XWUI instance; registers it as a child when the owner is an XWUIComponent. */
    track(instance) {
      instances.add(instance);
      owner?.registerChildComponent?.(instance);
      return instance;
    },
    mount(Component, host, data, conf) {
      return this.track(new Component(host, data, conf));
    },
    mountField(Component, host, data, conf) {
      const component = this.mount(Component, host, data, conf);
      connectFieldLabel(this, host, data?.label);
      return component;
    },
    /** Listen and remember to unlisten. */
    listen(target, event, handler, options) {
      target.addEventListener(event, handler, options);
      disposers.add(() => target.removeEventListener(event, handler, options));
    },
    onDispose(fn) {
      disposers.add(fn);
    },
    destroy() {
      for (const instance of instances) {
        try {
          if (owner?.unregisterChildComponent) owner.unregisterChildComponent(instance);
          instance.destroy?.();
        } catch (error) {
          console.warn('[ui] destroy failed', error);
        }
      }
      instances.clear();
      disposers.forEach((fn) => fn());
      disposers.clear();
    },
  };
}

function host(tag = 'span', className = 'xw-host') {
  return h(tag, { class: className });
}

/**
 * @param {ReturnType<typeof createScope>} scope
 */
export function createUi(scope) {
  const ui = {
    /** Generic: mount any XWUI component in a fresh host and return the host. */
    mount(Component, data, conf, { tag = 'div', className = 'xw-host xw-host--block' } = {}) {
      const el = host(tag, className);
      el.xw = scope.mount(Component, el, data, conf);
      return el;
    },

    /**
     * XWUIButton. `options` carries conf_comp keys (variant, size, icon, iconPosition, disabled,
     * loading, shape, fullWidth, href, title, ariaLabel) plus `onClick` and `className`.
     */
    button(text, options = {}) {
      const { onClick, className, ...conf } = options;
      const el = host('span', ['xw-host', className].filter(Boolean).join(' '));
      const button = scope.mount(XWUIButton, el, { text }, conf);
      if (onClick) button.onClick(onClick);
      el.xw = button;
      return el;
    },

    icon(name, conf = {}) {
      const el = host('span', 'xw-host xw-host--icon');
      el.xw = scope.mount(XWUIIcon, el, { name }, { decorative: !conf.ariaLabel, size: 'sm', lazy: false, ...conf });
      return el;
    },

    /** XWUIDisplayTag, variant: default | primary | success | warning | error */
    tag(label, variant = 'default', conf = {}) {
      const el = host('span', 'xw-host');
      el.xw = scope.mount(XWUIDisplayTag, el, { label }, { variant, size: 'sm', ...conf });
      return el;
    },

    spinner(label, conf = {}) {
      const el = host('div', 'xw-host xw-host--center');
      el.xw = scope.mount(XWUIProgressSpinner, el, { label }, { size: 'md', ...conf });
      return el;
    },

    skeleton(conf = {}) {
      const el = host('div', 'xw-host xw-host--block');
      el.xw = scope.mount(XWUIProgressSkeleton, el, {}, { animation: 'wave', ...conf });
      return el;
    },

    empty(data, conf = {}) {
      const el = host('div', 'xw-host xw-host--block');
      el.xw = scope.mount(XWUIFeedbackEmpty, el, data, conf);
      return el;
    },

    alert(data, conf = {}) {
      const el = host('div', 'xw-host xw-host--block');
      el.xw = scope.mount(XWUIFeedbackAlert, el, data, conf);
      return el;
    },

    /**
     * Open a modal XWUIOverlayDialog. Resolves with the id of the footer action pressed
     * (or null when dismissed).
     * @param {{ title: string, content: HTMLElement|string, actions?: Array<{ id: string, label: string, variant?: string }>, size?: string }} options
     */
    dialog({ title, content, actions = [], size = 'md' }) {
      return new Promise((resolve) => {
        const el = host('div', 'xw-host');
        document.body.append(el);
        let settled = false;
        let dialog = null;
        const finish = (result) => {
          if (settled) return;
          settled = true;
          resolve(result);
          queueMicrotask(() => {
            try { dialog?.close(); } catch { /* already closed */ }
            try { dialog?.destroy?.(); } catch { /* ignore */ }
            el.remove();
          });
        };
        scope.onDispose(() => finish(null));
        const footerScope = createScope();
        const footerUi = createUi(footerScope);
        const footer = h('div', { class: 'xw-dialog-actions' },
          actions.map((a) => footerUi.button(a.label, { variant: a.variant ?? 'secondary', onClick: () => finish(a.id) })));
        dialog = new XWUIOverlayDialog(el, { title, content, footer }, { size });
        dialog.open();
        dialog.onClose(() => finish(null));
        const observer = new MutationObserver(() => {
          if (!el.isConnected) { observer.disconnect(); footerScope.destroy(); finish(null); }
        });
        observer.observe(document.body, { childList: true });
      });
    },
  };
  return ui;
}

/** Convenience: a scope and its ui kit in one call. */
export function createKit(owner) {
  const scope = createScope(owner);
  return { scope, ui: createUi(scope) };
}
