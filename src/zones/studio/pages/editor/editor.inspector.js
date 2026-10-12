/**
 * Flow editor - step inspector (right floating panel).
 * The form is generated from the step type's `fields` (catalog data) with XWUI inputs:
 * XWUIInputSelect, XWUIInputText, XWUITextarea, XWUIInputNumber, XWUIInputSwitch.
 */
import {
  XWUINavTabs, XWUIInputSelect, XWUIInputText, XWUITextarea, XWUIInputNumber, XWUIInputSwitch, XWUIDisplayKbd,
} from '@exonware/xwui/basic';
import { h } from '../../../../core/dom.js';
import { createKit } from '../../../../core/ui.js';
import { template } from '../../../../core/format.js';
import { statusEl } from '../../shared/studio-ui.js';

export function createInspector({ catalog, copy, handlers }) {
  let kit = createKit();
  let section = 'params';
  const el = h('aside', { class: 'fl stack gap16 editor-inspector', 'aria-label': copy.inspectorLabel });
  const typeIndex = Object.fromEntries(catalog.nodeTypes.map((t) => [t.id, t]));

  function field(control, hint) {
    return h('div', { class: 'editor-field' }, control, hint && h('p', { class: 'hint' }, hint));
  }

  function paramControl(node, f, ctx) {
    const { scope } = kit;
    const host = h('div');
    const value = node.params?.[f.key] ?? f.default;
    const set = (v) => handlers.onParams(node.id, { [f.key]: v });
    if (f.kind === 'flow') {
      const options = ctx.flows.map(flow => ({ value: flow.id, label: flow.name }));
      const select = scope.mountField(XWUIInputSelect, host, { options, value: value || undefined, label: f.label }, { fullWidth: true, size: 'sm', clearable: true });
      select.onChange?.(v => set((Array.isArray(v) ? v[0] : v) ?? ''));
      return field(host);
    }
    if (f.kind === 'select') {
      const s = scope.mountField(XWUIInputSelect, host, { options: f.options.map((o) => ({ value: o, label: o })), value, label: f.label }, { fullWidth: true, size: 'sm' });
      s.onChange?.((v) => set(Array.isArray(v) ? v[0] : v));
      return field(host);
    }
    if (f.kind === 'number') {
      const n = scope.mountField(XWUIInputNumber, host, { value, label: f.label }, { size: 'sm', min: 0 });
      n.onChange?.((v) => set(Number(v)));
      return field(host);
    }
    if (f.kind === 'textarea') {
      const t = scope.mountField(XWUITextarea, host, { value, label: f.label, rows: '3' }, { fullWidth: true, size: 'sm', autoResize: true, className: f.mono ? 'editor-mono' : '' });
      t.onChange?.((v) => set(v));
      return field(host);
    }
    if (f.kind === 'switch') {
      const retry = typeIndex[node.type]?.retry ?? {};
      const sw = scope.mountField(XWUIInputSwitch, host, { checked: Boolean(value), label: f.label }, { size: 'sm' });
      sw.onChange?.((v) => set(Boolean(v?.checked ?? v)));
      return h('div', { class: 'rowf gap12 editor-switch' }, host,
        h('div', { class: 'grow' }, h('div', { class: 'xs sec' }, template(copy.retryHint, retry))));
    }
    if (f.kind === 'connection') {
      const options = ctx.connections.map((c) => ({ value: c.id, label: c.name }));
      const s = scope.mountField(XWUIInputSelect, host, { options, value: value || undefined, label: f.label, placeholder: copy.connectionMissing }, { fullWidth: true, size: 'sm', clearable: true });
      s.onChange?.((v) => set((Array.isArray(v) ? v[0] : v) ?? ''));
      const conn = ctx.connections.find((c) => c.id === value);
      const status = conn ? catalog.connectionStatuses[conn.status] : null;
      const hint = h('p', { class: 'hint rowf gap8' }, status ? statusEl(kit.scope, template(status.label, { days: conn.daysLeft }), status.st, { size: 'sm' }) : h('span', { class: 'ter' }, copy.noConnection), copy.credentialNote);
      return h('div', { class: 'editor-field' }, host, hint);
    }
    if (f.kind === 'expression') {
      if (!value) return null;
      return h('div', { class: 'rowf gap8 wrapf editor-expression' }, kit.ui.tag(copy.expression, 'default', { className: 'xw-tone-violet' }), h('span', { class: 'mono small editor-expression__text' }, value));
    }
    const t = scope.mountField(XWUIInputText, host, { value, label: f.label }, { fullWidth: true, size: 'sm', className: f.mono ? 'editor-mono' : '' });
    t.onChange?.((v) => set(v));
    return field(host);
  }

  function renderNode(node, ctx) {
    const { scope, ui } = kit;
    const type = typeIndex[node.type];
    const lastOutput = ctx.lastRun?.ledger.filter((r) => r.nodeId === node.id && r.output).at(-1)?.output;
    const lastValue = lastOutput ? Object.values(lastOutput)[0] : null;
    const kbd = h('span');
    scope.mount(XWUIDisplayKbd, kbd, { keys: copy.renameKey }, { size: 'sm' });

    const tabsHost = h('div', { class: 'studio-tabs' });
    const tabs = scope.mount(XWUINavTabs, tabsHost, {
      tabs: Object.entries(copy.sections).map(([id, label]) => ({ id, label })), activeTab: section,
    }, { variant: 'button', size: 'sm', hideContent: true });
    tabs.onChange?.((id) => { section = id?.id ?? id; render(ctx); });

    let body;
    if (section === 'params') {
      body = (type?.fields ?? []).map((f) => {
        const control = paramControl(node, f, ctx);
        if (f.key === 'url' && lastValue && control) control.append(h('p', { class: 'hint' }, `${copy.lastResult} `, h('span', { class: 'mono lime-text' }, String(lastValue))));
        return control;
      });
    } else if (section === 'settings') {
      const disabledHost = h('div');
      const pinnedHost = h('div');
      scope.mountField(XWUIInputSwitch, disabledHost, { checked: Boolean(node.disabled), label: copy.disabledLabel }, { size: 'sm' }).onChange?.((v) => handlers.onNode(node.id, { disabled: Boolean(v?.checked ?? v) }));
      scope.mountField(XWUIInputSwitch, pinnedHost, { checked: Boolean(node.pinned), label: copy.pinnedLabel }, { size: 'sm' }).onChange?.((v) => handlers.onNode(node.id, { pinned: Boolean(v?.checked ?? v) }));
      body = [
        h('div', { class: 'rowf gap12 editor-switch' }, disabledHost, h('div', { class: 'grow' }, h('div', { class: 'xs sec' }, copy.disabledHint))),
        h('div', { class: 'rowf gap12 editor-switch' }, pinnedHost, h('div', { class: 'grow' }, h('div', { class: 'xs sec' }, copy.pinnedHint))),
      ];
    } else {
      const notesHost = h('div');
      scope.mountField(XWUITextarea, notesHost, { value: node.notes ?? '', label: copy.sections.notes, placeholder: copy.notesPlaceholder, rows: '6' }, { fullWidth: true, size: 'sm' })
        .onChange?.((v) => handlers.onNode(node.id, { notes: v }));
      body = [notesHost];
    }

    el.replaceChildren(
      h('div', { class: 'rowf gap12' },
        h('span', { class: 'ico', style: { '--gc': `var(--xw-${type?.tone ?? 'violet'})` } }, ui.icon(type?.icon ?? 'box', { size: 'md' })),
        h('div', { class: 'grow' },
          h('h2', { class: 'h3 editor-inspector__title' }, node.name),
          h('span', { class: 'xs sec' }, `${template(copy.renameHint, { type: type?.label ?? node.type })} `, kbd))),
      tabsHost,
      h('div', { class: 'stack gap16 editor-inspector__body' }, body),
      h('hr', { class: 'sep' }),
      h('div', { class: 'wrapf gap8' },
        ui.button(node.pinned ? copy.unpinOutput : copy.pinOutput, { variant: 'secondary', size: 'sm', icon: 'pin', onClick: () => handlers.onNode(node.id, { pinned: !node.pinned }) }),
        ui.button(copy.executeToHere, { variant: 'secondary', size: 'sm', icon: 'player-play', onClick: () => handlers.onExecuteTo(node.id) }),
        ui.button(copy.deleteStep, { variant: 'ghost', size: 'sm', icon: 'trash', onClick: () => handlers.onDelete(node.id) })));
  }

  function render(ctx) {
    kit.scope.destroy();
    kit = createKit();
    const node = ctx.graph.nodes.find((n) => n.id === ctx.selectedId);
    if (node) { renderNode(node, ctx); return; }
    const edge = ctx.graph.edges.find((e) => e.id === ctx.selectedId);
    if (edge) {
      el.replaceChildren(
        h('h2', { class: 'h3 editor-inspector__title' }, copy.edgeSelected),
        h('p', { class: 'small sec' }, copy.edgeSelectedBody),
        kit.ui.button(copy.removeEdge, { variant: 'danger', size: 'sm', icon: 'trash', onClick: () => handlers.onDelete(edge.id) }));
      return;
    }
    el.replaceChildren(kit.ui.empty({ title: copy.nothingSelected, description: copy.nothingSelectedBody, icon: 'pointer' }, { size: 'sm' }));
  }

  return {
    el,
    render,
    destroy: () => kit.scope.destroy(),
  };
}
