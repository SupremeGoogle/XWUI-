/**
 * Studio: runs. KPIs, runs-per-hour bars, filters (search, status, mode, 7-day window chip),
 * selectable table with bulk retry / delete.
 */
import { XWUITable, XWUIDisplayChip } from '@exonware/xwui/basic';
import { h } from '../../../core/dom.js';
import { createKit } from '../../../core/ui.js';
import { template, formatRelative, formatDateTime, formatDuration } from '../../../core/format.js';
import { STUDIO_COPY } from '../studio.copy.js';
import { STUDIO_LAYOUT_ID, STUDIO_ROUTES } from '../studio.routes.js';
import { statusEl, kpiEl, projectTabsEl, searchEl, selectEl } from '../shared/studio-ui.js';
import { XWFBarSpark } from '../../../components/XWFBarSpark/XWFBarSpark.js';

const C = STUDIO_COPY.runs;
const WINDOW_DAYS = 7;

export default {
  id: 'studio-runs',
  path: STUDIO_ROUTES.runs,
  layout: STUDIO_LAYOUT_ID,
  title: C.title,
  async mount(el, ctx) {
    const { studioApi } = ctx.api;
    const page = createKit();
    let listKit = createKit();
    const filters = { q: '', status: 'all', mode: 'all', days: WINDOW_DAYS, flowId: ctx.query.flow ?? null };
    let current = null;
    let selection = [];

    const [shell, catalog, first] = await Promise.all([studioApi.getShell(), studioApi.getCatalog(), studioApi.listRuns(filters)]);

    ctx.layout?.setTopbar?.({
      crumbs: [{ label: shell.project.name, route: STUDIO_ROUTES.flows }, { label: C.title }],
      meta: [page.ui.tag(shell.project.sampleNotice, 'default', { className: 'xw-tone-plan' })],
    });

    const kpiRow = h('div', { class: 'wrapf gap16 studio-runs__kpis' });
    const selectionBar = h('div', { class: 'studio-runs__selection', hidden: true });
    const tableHost = h('div', { class: 'studio-table' });
    const tail = h('p', { class: 'small ter' });
    const chipHost = h('span', { class: 'studio-runs__chip' });

    const reload = async () => {
      try {
        render(await studioApi.listRuns(filters));
      } catch (error) { ctx.notify.fromError(error); }
    };

    function renderWindowChip() {
      chipHost.replaceChildren();
      if (!filters.days) return;
      const host = h('span');
      chipHost.append(host);
      const chip = page.scope.mount(XWUIDisplayChip, host, { label: C.windowChip }, { closable: true, size: 'sm', className: 'xw-tone-violet studio-chip' });
      const clear = () => { filters.days = null; renderWindowChip(); reload(); };
      chip.onClose?.(clear);
      host.addEventListener('close', clear);
      host.addEventListener('click', (e) => { if (e.target.closest('[class*="close"]')) clear(); });
    }

    const statusOptions = [{ value: 'all', label: C.statusAll }, ...['running', 'succeeded', 'failed'].map((v) => ({ value: v, label: catalog.runStatuses[v].label }))];
    const modeOptions = [{ value: 'all', label: C.modeAll }, ...Object.entries(catalog.runModes).map(([value, m]) => ({ value, label: m.label }))];

    const filtersRow = h('div', { class: 'studio-filters' },
      searchEl(page.scope, { placeholder: C.searchPlaceholder, onChange: (q) => { filters.q = q; reload(); } }),
      selectEl(page.scope, { label: catalog.runStatuses.running.label, options: statusOptions, value: 'all', onChange: (v) => { filters.status = v || 'all'; reload(); } }),
      selectEl(page.scope, { label: C.modeAll, options: modeOptions, value: 'all', onChange: (v) => { filters.mode = v || 'all'; reload(); } }),
      chipHost);

    async function bulk(action) {
      const ids = selection.map((i) => current.items[i].id);
      if (!ids.length) return;
      try {
        if (action === 'retry') {
          await studioApi.retryRuns(ids);
          ctx.notify.success(template(C.retried, { n: ids.length }));
        } else {
          const choice = await page.ui.dialog({
            title: template(C.deleteTitle, { n: ids.length }),
            content: C.deleteBody,
            actions: [{ id: 'cancel', label: C.cancel, variant: 'ghost' }, { id: 'delete', label: C.deleteConfirm, variant: 'danger' }],
            size: 'sm',
          });
          if (choice !== 'delete') return;
          await studioApi.deleteRuns(ids);
          ctx.notify.success(template(C.deleted, { n: ids.length }));
        }
        selection = [];
        reload();
      } catch (error) { ctx.notify.fromError(error); }
    }

    function renderSelectionBar() {
      selectionBar.hidden = selection.length === 0;
      if (!selection.length) { selectionBar.replaceChildren(); return; }
      const n = selection.length;
      selectionBar.replaceChildren(h('div', { class: 'alert lime studio-runs__selection-inner' },
        h('b', {}, n === 1 ? C.selectedOne : template(C.selected, { n })),
        h('div', { class: 'rowf gap8 sp wrapf' },
          listKit.ui.button(template(C.retrySelected, { n }), { variant: 'primary', size: 'sm', icon: 'refresh', onClick: () => bulk('retry') }),
          listKit.ui.button(template(C.deleteSelected, { n }), { variant: 'secondary', size: 'sm', icon: 'trash', onClick: () => bulk('delete') }),
          listKit.ui.button(C.clear, { variant: 'ghost', size: 'sm', onClick: () => { selection = []; render(current); } }))));
    }

    function render(result) {
      current = result;
      listKit.scope.destroy();
      listKit = createKit();
      const { kpis, perHour } = result;
      const sparkHost = h('div');
      kpiRow.replaceChildren(
        kpiEl(listKit.scope, { title: C.kpiRunning, value: kpis.runningNow, tone: 'cyan', valueTone: 'run', footnote: template(C.asOf, { when: formatRelative(kpis.asOf) }) }),
        kpiEl(listKit.scope, { title: C.kpiSucceeded, value: kpis.succeeded7d, tone: 'green' }),
        kpiEl(listKit.scope, { title: C.kpiFailed, value: kpis.failed7d, tone: 'red', valueTone: 'err' }),
        h('div', { class: 'glass pad-s stack gap8 studio-runs__spark' },
          h('div', { class: 'rowf' }, h('span', { class: 'xs b sec studio-runs__spark-title' }, C.perHourTitle), h('span', { class: 'xs ter sp' }, C.perHourPartial)),
          sparkHost));
      listKit.scope.mount(XWFBarSpark, sparkHost, {
        buckets: perHour.map((b) => ({ label: `${b.hour}:00`, value: b.runs, flagged: b.failed, partial: b.partial })),
        ariaLabel: template(C.perHourLabel, { n: perHour.filter((b) => b.failed).length }),
      });

      tableHost.replaceChildren();
      if (!result.items.length) {
        tableHost.append(listKit.ui.empty({ title: C.emptyTitle, description: C.emptyBody, image: catalog.assets[catalog.assetRefs.emptyRuns].path }));
      } else {
        const host = h('div');
        tableHost.append(host);
        const table = listKit.scope.mount(XWUITable, host, {
          columns: [
            { key: 'flowName', title: C.columns.flow, render: (v, r) => h('a', { class: 'studio-flow-link', href: `#/studio/runs/${r.id}` }, v) },
            { key: 'status', title: C.columns.status, render: (v) => statusEl(listKit.scope, catalog.runStatuses[v].label, catalog.runStatuses[v].st) },
            { key: 'startedAt', title: C.columns.started, render: (v) => formatDateTime(v) },
            { key: 'durationMs', title: C.columns.runTime, align: 'end', render: (v) => h('span', { class: ['mono', v ? '' : 'ter'] }, v ? formatDuration(v) : STUDIO_COPY.never) },
            { key: 'shortId', title: C.columns.shortId, render: (v) => h('span', { class: 'mono sec' }, v) },
            { key: 'mode', title: C.columns.mode, render: (v) => {
              const mode = catalog.runModes[v];
              const isBase = ['primary', 'success', 'warning', 'error'].includes(mode.tone);
              return listKit.ui.tag(mode.label, isBase ? mode.tone : 'default', isBase ? {} : { className: `xw-tone-${mode.tone}` });
            } },
          ],
          data: result.items,
        }, { selectable: true, hoverable: true });
        table.onSelect?.((rows) => { selection = rows; renderSelectionBar(); });
      }
      tail.textContent = result.page >= result.pages ? C.noMore : '';
      renderSelectionBar();
    }

    el.append(h('div', { class: 'pg' },
      h('div', { class: 'rowf gap16 wrapf' }, h('h1', { class: 'h2 studio-page-title' }, C.title), h('div', { class: 'sp' }, projectTabsEl(page.scope, ctx, shell.tabs, 'runs'))),
      kpiRow, filtersRow, selectionBar, tableHost, tail));
    renderWindowChip();
    render(first);

    // a live run finishes in the background: refresh while something is running
    const poll = setInterval(() => { if (current?.kpis.liveNow && !selection.length) reload(); }, 2500);

    return {
      unmount() {
        clearInterval(poll);
        listKit.scope.destroy();
        page.scope.destroy();
      },
    };
  },
};
