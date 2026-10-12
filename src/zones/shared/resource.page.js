/** Management-page composition using XWUI basic. Definitions, labels and records come through API. */
import { XWUITable } from '@exonware/xwui/basic';
import { h, ensureStylesheet } from '../../core/dom.js';
import { template, formatRelative } from '../../core/format.js';
import { pageSession, createXwfKit } from '../../components/xwf-ui.js';
import { kpiEl, projectTabsEl, searchEl, selectEl, downloadText } from '../studio/shared/studio-ui.js';
import { STUDIO_ROUTES } from '../../core/routes.js';
import { editResource } from './resource.form.js';

ensureStylesheet('xwf-resource-css', new URL('./resource.css', import.meta.url));
export function createResourcePage({ id, path, layout, resource, domain }) {
  return { id, path, layout, async mount(el, ctx) {
    const session = pageSession(el, ctx);
    const { ui, scope } = session;
    const api = ctx.api[domain];
    const definition = await api.getResourceDefinition(resource);
    if (!session.active) return session.handle;
    const C = { ...definition.copy, enabled: definition.enabledLabel ?? definition.copy.enabled, disabled: definition.disabledLabel ?? definition.copy.disabled, status: definition.statusLabel ?? definition.copy.status, active: definition.activeLabel ?? definition.copy.active };
    ctx.setTitle(definition.title);
    const filters = { q: '', status: 'all', page: 1, pageSize: definition.pageSize };
    const list = h('div', { class: 'resource-list studio-table' });
    const kpis = h('div', { class: 'wrapf gap16' });
    const footer = h('div', { class: 'resource-footer wrapf gap16' });
    let listKit = createXwfKit();
    let request = 0;
    let busy = false;
    scope.onDispose(() => listKit.scope.destroy());
    async function reload() {
      const current = ++request;
      listKit.scope.destroy(); listKit = createXwfKit();
      list.replaceChildren(listKit.ui.skeleton({ height: '200px' }));
      try {
        const result = await api.listResources(resource, filters);
        if (!session.active || current !== request) return;
        render(result);
      } catch (error) {
        if (!session.active || current !== request) return;
        list.replaceChildren(listKit.ui.alert({ title: C.error, description: error.message }, { variant: 'error' }),
          listKit.ui.button(C.retry, { variant: 'secondary', onClick: reload }));
      }
    }
    async function act(action, record) {
      if (busy) return;
      busy = true;
      try {
        if (action === 'create' || action === 'edit') {
          const values = await editResource({ definition, record, ui });
          if (!session.active || !values) return;
          if (record) await api.updateResource(resource, record.id, values);
          else await api.createResource(resource, values);
          ctx.notify.success(record ? C.saved : C.created);
        } else if (action === 'archive' || action === 'disable') {
          const choice = await ui.dialog({ title: template(action === 'archive' ? C.archiveTitle : C.disableTitle, record),
            content: action === 'archive' ? C.archiveBody : C.disableBody,
            actions: [{ id: 'cancel', label: C.cancel, variant: 'ghost' }, { id: 'confirm', label: C[action], variant: action === 'archive' ? 'danger' : 'secondary' }] });
          if (!session.active || choice !== 'confirm') return;
          if (action === 'archive') await api.archiveResource(resource, record.id, true);
          else await api.toggleResource(resource, record.id, false);
          ctx.notify.success(action === 'archive' ? C.archivedNotice : C.saved);
        } else if (action === 'enable' || action === 'restore') {
          if (action === 'enable') await api.toggleResource(resource, record.id, true);
          else await api.archiveResource(resource, record.id, false);
          ctx.notify.success(action === 'enable' ? C.saved : C.restored);
        } else if (action === 'export') {
          downloadText(await api.exportResource(resource, record.id));
          return;
        } else if (action === 'primary') {
          const result = await api.actOnResource(resource, record.id);
          if (!session.active) return;
          ctx.notify.success(C.actionDone);
          if (result?.id && definition.primaryAction === 'template') ctx.navigate(ctx.href(STUDIO_ROUTES.editor, { flowId: result.id }).slice(1));
          if (result?.id && definition.primaryAction === 'retry') ctx.navigate(ctx.href(STUDIO_ROUTES.run, { runId: result.id }).slice(1));
        }
        if (session.active) await reload();
      } catch (error) { ctx.notify.fromError(error); }
      finally { busy = false; }
    }
    function render(result) {
      listKit.scope.destroy(); listKit = createXwfKit();
      const kit = listKit;
      kpis.replaceChildren(kpiEl(kit.scope, { title: C.total, value: result.kpis.total }),
        kpiEl(kit.scope, { title: C.active, value: result.kpis.enabled, tone: 'green' }));
      if (!result.items.length) list.replaceChildren(kit.ui.empty({ title: C.empty, description: C.emptyBody }));
      else {
        const host = h('div'); list.replaceChildren(host);
        kit.scope.mount(XWUITable, host, {
          columns: [...definition.fields.map(field => ({ key: field.key, title: field.label, render: (value, row) =>
            field.key === 'name' && row.path ? h('a', { class: 'studio-flow-link', href: `#${row.path}` }, value) :
              h('span', { class: 'resource-value', title: String(value ?? '') }, String(value ?? '')) })),
            { key: 'enabled', title: C.status, render: (_v, row) => kit.ui.tag(row.archived ? C.archived : row.enabled ? C.enabled : C.disabled, row.archived ? 'default' : row.enabled ? 'success' : 'warning') },
            { key: 'updatedAt', title: C.updated, render: value => value ? formatRelative(value) : '' }],
          data: result.items,
        }, { hoverable: true, rowActionsLabel: C.actions,
          rowActions: [
            ...(definition.primaryAction ? [{ id: 'primary', label: definition.primaryAction === 'template' ? C.run : C.retryRun }] : []),
            ...(definition.fields.some(field => !field.readOnly) ? [{ id: 'edit', label: C.edit }] : []),
            ...(definition.allowToggle ? [{ id: 'enable', label: C.enable, isVisible: row => !row.enabled && !row.archived }, { id: 'disable', label: C.disable, isVisible: row => row.enabled && !row.archived }] : []),
            ...(definition.allowArchive ? [{ id: 'archive', label: C.archive, variant: 'danger', isVisible: row => !row.archived }, { id: 'restore', label: C.restore, isVisible: row => row.archived }] : []),
            { id: 'export', label: C.export },
          ].map(item => ({ ...item, onClick: row => act(item.id, row) })),
        });
      }
      footer.replaceChildren(h('span', { class: 'small sec' }, result.total === 1 ? C.rowsOne : template(C.rows, { n: result.total })),
        ...result.pages > 1 ? [kit.ui.pager(result, page => { filters.page = page; reload(); })] : []);
    }
    const header = h('div', { class: 'stack gap12' },
      h('div', { class: 'wrapf gap16' }, h('h1', { class: 'h2 resource-title' }, definition.title),
        definition.allowCreate ? ui.button(C.create, { variant: 'primary', icon: 'plus', onClick: () => act('create') }) : null),
      h('p', { class: 'sec' }, definition.description), ui.tag(C.notice, 'default', { className: 'xw-tone-plan' }));
    const body = h('main', { class: layout === 'studio' ? 'pg stack gap24 resource-page' : 'stack gap24 resource-page' }, header, kpis);
    if (layout === 'studio') {
      const [shell, catalog] = await Promise.all([api.getShell(), api.getCatalog()]);
      if (!session.active) return session.handle;
      ctx.layout.setTopbar({ crumbs: [{ label: shell.project.name, route: STUDIO_ROUTES.flows }, { label: definition.title }] });
      body.append(projectTabsEl(scope, ctx, shell.tabs, resource, catalog.copy));
    }
    body.append(h('div', { class: 'studio-filters' },
      searchEl(scope, { placeholder: C.search, onChange: q => { filters.q = q; filters.page = 1; reload(); } }),
      selectEl(scope, { label: C.filter, value: 'all', options: [
        { value: 'all', label: C.all }, { value: 'enabled', label: C.enabled }, { value: 'disabled', label: C.disabled },
        ...(definition.allowArchive ? [{ value: 'archived', label: C.archivedOnly }] : []),
      ], onChange: status => { filters.status = status; filters.page = 1; reload(); } })), list, footer);
    el.replaceChildren(body);
    await reload();
    return session.handle;
  } };
}
