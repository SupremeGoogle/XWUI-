/**
 * Studio: connections. The vault banner, filters (search, status, grouping), credential
 * cards with masked secrets, and the actions the prototype shows: Reconnect, Test, Add.
 */
import { XWUIInputText, XWUIInputSelect, XWUICard } from '@exonware/xwui/basic';
import { h } from '../../../core/dom.js';
import { createKit } from '../../../core/ui.js';
import { template, formatRelative, formatDateTime, pluralize } from '../../../core/format.js';
import { STUDIO_LAYOUT_ID, STUDIO_ROUTES } from '../studio.routes.js';
import { statusEl, projectTabsEl, searchEl, selectEl } from '../shared/studio-ui.js';

const toneVar = (tone) => `var(--xw-${tone})`;
const CARD_STATE = { broken: 'bad', expiring: 'warnc', healthy: '' };

export default {
  id: 'studio-connections',
  path: STUDIO_ROUTES.connections,
  layout: STUDIO_LAYOUT_ID,
  async mount(el, ctx) {
    const { studioApi } = ctx.api;
    const page = createKit();
    let listKit = createKit();
    const filters = { q: '', status: 'all', group: 'connection' };
    const busy = new Set();
    const [shell, catalog, first] = await Promise.all([studioApi.getShell(), studioApi.getCatalog(), studioApi.listConnections(filters)]);
    if (ctx.isActive && !ctx.isActive()) { page.scope.destroy(); return { unmount() {} }; }
    const STUDIO_COPY = catalog.copy;
    const C = STUDIO_COPY.connections;
    ctx.setTitle(C.title);
    let items = first;

    ctx.layout?.setTopbar?.({
      crumbs: [{ label: shell.project.name, route: STUDIO_ROUTES.flows }, { label: C.title }],
      meta: [page.ui.tag(C.sampleData, 'default', { className: 'xw-tone-plan' })],
    });

    const grid = h('div', { class: 'connections' });
    const reload = async () => {
      try { items = await studioApi.listConnections(filters); render(); } catch (error) { ctx.notify.fromError(error); }
    };

    function statusLabel(c) {
      return template(catalog.connectionStatuses[c.status].label, { days: c.daysLeft });
    }

    function usageLine(c) {
      if (c.status === 'broken') {
        return h('p', { class: 'small' }, template(C.expiredOn, { date: formatDateTime(c.expiredAt, { day: '2-digit', month: 'short' }) }), ' ',
          c.usedBy.length ? [h('b', {}, c.usedBy.map((f) => f.name).join(', ')), ` ${C.failsUntil}`] : null);
      }
      const used = pluralize(c.usedBy.length, C.flowOne, C.flowMany);
      return h('p', { class: 'small sec' }, template(C.usedBy, { flows: used }), c.lastUsedAt ? ` ${template(C.lastUsed, { when: formatRelative(c.lastUsedAt) })}` : ` ${C.neverUsed}`);
    }

    async function act(c, action) {
      busy.add(c.id);
      render();
      try {
        if (action === 'test') {
          const res = await studioApi.testConnection(c.id);
          ctx.notify.success(template(C.testOk, { name: c.name, ms: res.latencyMs }));
        } else {
          await studioApi.reconnectConnection(c.id);
          ctx.notify.success(template(C.reconnected, { name: c.name }));
        }
      } catch (error) {
        ctx.notify.fromError(error);
      } finally {
        busy.delete(c.id);
        reload();
      }
    }

    function card(c) {
      const { ui, scope } = listKit;
      const primaryAction = c.status === 'healthy' ? 'test' : 'reconnect';
      const body = h('div', { class: 'stack gap16' },
        h('div', { class: 'rowf gap12' },
          h('span', { class: 'ico', style: { '--gc': toneVar(c.tone) } }, ui.icon(c.icon, { size: 'md' })),
          h('div', { class: 'grow' }, h('b', {}, c.name), h('div', { class: 'xs sec' }, template(C.kindOwner, { kind: c.kind, owner: c.ownerName }))),
          statusEl(scope, statusLabel(c), catalog.connectionStatuses[c.status].st)),
        h('div', { class: 'mask', 'aria-label': C.maskLabel }, C.mask),
        usageLine(c),
        h('div', { class: 'rowf gap8 wrapf' }, ui.tag(c.scopes), ui.tag(c.team),
          ui.button(primaryAction === 'test' ? C.test : C.reconnect, {
            variant: c.status === 'broken' ? 'primary' : 'secondary', size: 'sm', className: 'sp', loading: busy.has(c.id),
            icon: primaryAction === 'test' ? 'plug' : 'refresh', onClick: () => act(c, primaryAction),
          })));
      const host = ui.mount(XWUICard, { body }, { padding: 'none' }, { className: `kc studio-card ${CARD_STATE[c.status]}` });
      host.style.setProperty('--hc', toneVar(c.status === 'broken' ? 'red' : c.tone));
      return host;
    }

    function render() {
      listKit.scope.destroy();
      listKit = createKit();
      if (!items.length) {
        grid.replaceChildren(listKit.ui.empty({ title: C.emptyTitle, description: C.emptyBody, icon: 'key' }));
        return;
      }
      if (filters.group === 'app') {
        const groups = [...new Set(items.map((c) => c.kind))];
        grid.replaceChildren(...groups.map((kind) => h('section', { class: 'stack gap12' },
          h('h2', { class: 'h4' }, kind),
          h('div', { class: 'g2 connections__grid' }, items.filter((c) => c.kind === kind).map(card)))));
      } else {
        grid.replaceChildren(h('div', { class: 'g2 connections__grid' }, items.map(card)));
      }
    }

    async function addConnection() {
      const { scope } = createKit();
      const form = await studioApi.getConnectionForm();
      if (ctx.isActive && !ctx.isActive()) { scope.destroy(); return; }
      const fields = {};
      const field = (key, Component, data, conf) => {
        const host = h('div');
        fields[key] = scope.mountField(Component, host, data, { fullWidth: true, ...conf });
        return host;
      };
      const body = h('div', { class: 'stack gap12' },
        h('p', { class: 'small sec' }, C.addIntro),
        field('name', XWUIInputText, { label: C.fields.name, placeholder: C.fields.namePlaceholder }),
        field('kind', XWUIInputSelect, { label: C.fields.kind, options: form.kinds.map((v) => ({ value: v, label: v })), value: form.kinds[0] }),
        field('team', XWUIInputSelect, { label: C.fields.team, options: form.teams.map((v) => ({ value: v, label: v })), value: form.teams[0] }),
        field('scopes', XWUIInputSelect, { label: C.fields.scopes, options: form.scopes.map((v) => ({ value: v, label: v })), value: form.scopes[0] }),
        field('secret', XWUIInputText, { label: C.fields.secret, placeholder: C.fields.secretPlaceholder, helperText: C.fields.secretHint }, { type: 'password', showPasswordToggle: false, autocomplete: 'off' }));
      const choice = await page.ui.dialog({ title: C.addTitle, content: body, actions: [{ id: 'cancel', label: C.cancel, variant: 'ghost' }, { id: 'add', label: C.add, variant: 'primary' }] });
      const pick = (v) => (Array.isArray(v) ? v[0] : v);
      const values = {
        name: fields.name.getValue?.() ?? '', kind: pick(fields.kind.getValue?.()), team: pick(fields.team.getValue?.()),
        scopes: pick(fields.scopes.getValue?.()), secret: fields.secret.getValue?.() ?? '',
      };
      scope.destroy();
      if (choice !== 'add') return;
      try {
        const created = await studioApi.createConnection(values);
        ctx.notify.success(template(C.added, { name: created.name }));
        reload();
      } catch (error) { ctx.notify.fromError(error); }
    }

    const statusOptions = [{ value: 'all', label: C.statusAll }, ...Object.entries(catalog.connectionStatuses).map(([value, s]) => ({ value, label: s.filterLabel }))];
    const groupOptions = Object.entries(C.groups).map(([value, label]) => ({ value, label }));
    const { ui, scope } = page;

    el.append(h('div', { class: 'pg' },
      h('div', { class: 'rowf gap16 wrapf' }, h('h1', { class: 'h2 studio-page-title' }, C.title), h('div', { class: 'sp' }, projectTabsEl(scope, ctx, shell.tabs, 'connections', STUDIO_COPY))),
      h('section', { class: 'glass wrapf gap24 connections__vault' },
        h('div', { class: 'connections__vault-orb', 'aria-hidden': 'true' },
          h('div', { class: 'orb', style: { '--oc': 'var(--xw-lime)', width: '96px', height: '96px', left: '0', top: '0' } }),
          h('span', { class: 'connections__vault-icon' }, ui.icon('lock', { size: 'lg', color: '#0a0a0a' }))),
        h('div', { class: 'stack gap4 connections__vault-text' }, h('h2', { class: 'h3' }, C.vaultTitle), h('p', { class: 'sec' }, C.vaultBody)),
        ui.button(C.addConnection, { variant: 'primary', icon: 'plus', onClick: addConnection })),
      h('div', { class: 'studio-filters' },
        searchEl(scope, { placeholder: C.searchPlaceholder, onChange: (q) => { filters.q = q; reload(); } }),
        selectEl(scope, { label: C.statusAll, options: statusOptions, value: 'all', onChange: (v) => { filters.status = v || 'all'; reload(); } }),
        selectEl(scope, { label: C.groups.connection, options: groupOptions, value: 'connection', onChange: (v) => { filters.group = v || 'connection'; render(); } })),
      grid));
    render();

    return { unmount() { listKit.scope.destroy(); page.scope.destroy(); } };
  },
};
