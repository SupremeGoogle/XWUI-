/**
 * Studio: flows (project overview). Hero, KPIs, project tabs, filters and the flows table
 * with row actions (open, run now, see runs, duplicate, delete).
 */
import { XWUITable } from '@exonware/xwui/basic';
import { h } from '../../../core/dom.js';
import { createKit } from '../../../core/ui.js';
import { template, formatRelative } from '../../../core/format.js';
import { STUDIO_LAYOUT_ID, STUDIO_ROUTES } from '../studio.routes.js';
import {
  statusEl, kpiEl, chainEl, ownerEl, projectTabsEl, searchEl, selectEl,
} from '../shared/studio-ui.js';

export default {
  id: 'studio-flows',
  path: STUDIO_ROUTES.flows,
  layout: STUDIO_LAYOUT_ID,
  async mount(el, ctx) {
    const { studioApi } = ctx.api;
    const page = createKit();
    let tableKit = createKit();
    const filters = { q: ctx.query.q ?? '', status: 'all', folder: 'all' };

    const [shell, catalog, initial] = await Promise.all([
      studioApi.getShell(), studioApi.getCatalog(), studioApi.listFlows(filters),
    ]);
    if (ctx.isActive && !ctx.isActive()) { page.scope.destroy(); return { unmount() {} }; }
    const STUDIO_COPY = catalog.copy;
    const C = STUDIO_COPY.flows;
    ctx.setTitle(C.title);
    const { project, tabs } = shell;

    ctx.layout?.setTopbar?.({
      crumbs: [{ label: C.crumbsRoot, route: STUDIO_ROUTES.assistant }, { label: project.name }],
      meta: [page.ui.tag(project.sampleNotice, 'default', { className: 'xw-tone-plan' })],
    });

    const createFlow = async () => {
      try {
        const { id } = await studioApi.createFlow({});
        ctx.notify.success(C.created);
        ctx.navigate(ctx.href(STUDIO_ROUTES.editor, { flowId: id }).slice(1));
      } catch (error) { ctx.notify.fromError(error); }
    };

    const hero = h('section', { class: 'glass studio-hero' },
      h('div', { class: 'halo', style: { right: '-40px', top: '-80px', width: '360px', height: '260px', background: 'var(--xw-violet)' } }),
      h('div', { class: 'cube', style: { '--s': '54px', '--cc': 'var(--xw-lime)', right: '260px', top: '30px', opacity: '.8' } }, Array.from({ length: 6 }, () => h('i'))),
      h('div', { class: 'wrapf gap24 studio-hero__row' },
        h('span', { class: 'studio-hero__mark', 'aria-hidden': 'true' }),
        h('div', { class: 'stack gap4 studio-hero__text' },
          h('div', { class: 'rowf gap12' }, h('h1', { class: 'h2 studio-hero__title' }, project.name), page.ui.tag(project.visibility)),
          h('p', { class: 'sec' }, project.description)),
        h('div', { class: 'rowf gap8' },
          page.ui.button(C.liveDemo, { variant: 'outline', icon: 'play', disabled: !shell.demoFlowId, onClick: () => ctx.navigate(ctx.href(STUDIO_ROUTES.editor, { flowId: shell.demoFlowId }, { demo: '1' }).slice(1)) }),
          page.ui.button(C.createFlow, { variant: 'primary', icon: 'plus', onClick: createFlow }))));

    const kpis = h('div', { class: 'studio-kpis' });
    const tableHost = h('div', { class: 'studio-table' });
    const footnote = h('p', { class: 'small sec' });

    const statusOptions = [{ value: 'all', label: C.statusAll }, ...Object.entries(catalog.flowStatuses).map(([value, s]) => ({ value, label: s.label }))];
    const folderOptions = [{ value: 'all', label: C.folderAll }, ...initial.folders.map((f) => ({ value: f, label: f }))];

    const reload = async () => {
      try {
        render(await studioApi.listFlows(filters));
      } catch (error) { ctx.notify.fromError(error); }
    };

    const filtersRow = h('div', { class: 'studio-filters' },
      searchEl(page.scope, { placeholder: C.searchPlaceholder, value: filters.q, onChange: (q) => { filters.q = q; reload(); } }),
      selectEl(page.scope, { label: C.statusLabel, options: statusOptions, value: 'all', onChange: (v) => { filters.status = v || 'all'; reload(); } }),
      selectEl(page.scope, { label: C.folderLabel, options: folderOptions, value: 'all', onChange: (v) => { filters.folder = v || 'all'; reload(); } }));

    async function runAction(action, row) {
      try {
        if (action === 'open') ctx.navigate(ctx.href(STUDIO_ROUTES.editor, { flowId: row.id }).slice(1));
        if (action === 'runs') ctx.navigate(ctx.href(STUDIO_ROUTES.runs, {}, { flow: row.id }).slice(1));
        if (action === 'run') {
          const { id } = await studioApi.startRun(row.id, { mode: row.statusKey === 'draft' ? 'test' : 'production' });
          ctx.notify.success(template(C.runStarted, { name: row.name }), { action: { label: STUDIO_COPY.run.crumbsRuns, onClick: () => ctx.navigate(ctx.href(STUDIO_ROUTES.run, { runId: id }).slice(1)) } });
          reload();
        }
        if (action === 'duplicate') {
          await studioApi.duplicateFlow(row.id);
          ctx.notify.success(template(C.duplicated, { name: row.name }));
          reload();
        }
        if (action === 'delete') {
          const choice = await page.ui.dialog({
            title: template(C.deleteTitle, { name: row.name }),
            content: C.deleteBody,
            actions: [{ id: 'cancel', label: C.cancel, variant: 'ghost' }, { id: 'delete', label: C.deleteConfirm, variant: 'danger' }],
            size: 'sm',
          });
          if (choice !== 'delete') return;
          await studioApi.deleteFlow(row.id);
          ctx.notify.success(template(C.deleted, { name: row.name }));
          reload();
        }
      } catch (error) { ctx.notify.fromError(error); }
    }

    function lastRunCell(row) {
      if (!row.lastRun) return h('span', { class: 'ter' }, STUDIO_COPY.never);
      const status = catalog.runStatuses[row.lastRun.status];
      const when = formatRelative(row.lastRun.startedAt);
      const label = row.lastRun.status === 'failed' ? template(C.lastRunFailed, { when }) : row.lastRun.status === 'running' ? status.label : when;
      return h('a', { href: ctx.href(STUDIO_ROUTES.run, { runId: row.lastRun.id }), class: 'studio-cell-link' }, statusEl(tableKit.scope, label, status.st));
    }

    function render(result) {
      tableKit.scope.destroy();
      tableKit = createKit();
      const { kpis: k } = result;
      kpis.replaceChildren(
        kpiEl(tableKit.scope, { title: C.kpiPublished, value: k.published, tone: 'lime' }),
        kpiEl(tableKit.scope, { title: C.kpiRunning, value: k.running, tone: 'cyan' }),
        kpiEl(tableKit.scope, { title: C.kpiFailed, value: k.failed24h, tone: 'red', valueTone: 'err' }),
        kpiEl(tableKit.scope, { title: C.kpiDrafts, value: k.drafts, tone: 'amber' }));

      tableHost.replaceChildren();
      if (!result.items.length) {
        tableHost.append(tableKit.ui.empty({ title: C.emptyTitle, description: C.emptyBody, image: catalog.assets[catalog.assetRefs.emptyFlows].path }));
      } else {
        const host = h('div');
        tableHost.append(host);
        tableKit.scope.mount(XWUITable, host, {
          columns: [
            { key: 'name', title: C.columns.name, render: (_v, r) => h('div', {}, h('a', { class: 'studio-flow-link', href: ctx.href(STUDIO_ROUTES.editor, { flowId: r.id }) }, r.name), h('div', { class: 'xs sec' }, r.folder)) },
            { key: 'chain', title: C.columns.steps, render: (v) => chainEl(v, STUDIO_COPY) },
            { key: 'statusKey', title: C.columns.status, render: (_v, r) => statusEl(tableKit.scope, r.status.label, r.status.st) },
            { key: 'lastRun', title: C.columns.lastRun, render: (_v, r) => lastRunCell(r) },
            { key: 'nextRun', title: C.columns.nextRun, render: (v) => h('span', { class: 'sec' }, v ?? C.draftNextRun) },
            { key: 'owner', title: C.columns.owner, render: (v) => ownerEl(tableKit.scope, v) },
            { key: 'updatedAt', title: C.columns.updated, render: (v) => h('span', { class: 'sec' }, formatRelative(v)) },
          ],
          data: result.items,
        }, {
          selectable: true,
          hoverable: true,
          rowActionsLabel: C.actionsLabel,
          rowActions: Object.entries(C.actions).map(([id, label]) => ({
            id, label, variant: id === 'delete' ? 'danger' : 'default',
            icon: { open: 'external-link', run: 'play', runs: 'history', duplicate: 'copy', delete: 'trash' }[id],
            onClick: (record) => runAction(id, record),
          })),
        });
      }
      footnote.textContent = template(C.footnote, { n: result.total });
    }

    el.append(h('div', { class: 'pg' },
      hero, kpis,
      projectTabsEl(page.scope, ctx, tabs, 'flows', STUDIO_COPY),
      filtersRow, tableHost, footnote));
    render(initial);

    return {
      unmount() {
        tableKit.scope.destroy();
        page.scope.destroy();
      },
    };
  },
};
