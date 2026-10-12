import { STUDIO_ROUTES } from '../../studio.routes.js';
/**
 * Flow editor - run panel (bottom floating panel): ledger, input, output and problems of
 * the latest run, with a link to the full receipt.
 */
import { XWUINavTabs, XWUITable, XWUICodeBlock } from '@exonware/xwui/basic';
import { h } from '../../../../core/dom.js';
import { createKit } from '../../../../core/ui.js';
import { template, formatDuration } from '../../../../core/format.js';
import { statusEl } from '../../shared/studio-ui.js';
import { runSummary, ledgerItems } from './editor.logic.js';

export function createRunPanel({ ctx, catalog, copy }) {
  const STUDIO_COPY = catalog.copy;
  let kit = createKit();
  let tab = 'ledger';
  const el = h('section', { class: 'fl stack editor-runpanel', 'aria-label': copy.panelLabel });

  function body(state) {
    const { scope, ui } = kit;
    const { run, problems, selectedId } = state;
    if (tab === 'problems') {
      if (!problems.length) return ui.empty({ title: copy.noProblems, icon: 'check' }, { size: 'sm' });
      return h('ul', { class: 'editor-problems' }, problems.map((p) => h('li', { class: `editor-problems__item is-${p.level}` },
        statusEl(scope, p.text, p.level === 'error' ? 'err' : p.level === 'warning' ? 'warn' : 'idle', { size: 'sm' }))));
    }
    if (!run) return h('p', { class: 'small sec editor-runpanel__empty' }, copy.noRunYet);
    if (tab === 'input' || tab === 'output') {
      const rows = run.ledger.filter((r) => (selectedId ? r.nodeId === selectedId : true) && r[tab]);
      const value = rows.at(-1)?.[tab];
      if (!value) return h('p', { class: 'small sec editor-runpanel__empty' }, STUDIO_COPY.run.nothingStored);
      const host = h('div');
      scope.mount(XWUICodeBlock, host, { code: JSON.stringify(value, null, 2) }, { language: 'json', upgradeToEditor: false, className: 'run-code' });
      return host;
    }
    const host = h('div');
    scope.mount(XWUITable, host, {
      columns: [
        { key: 'stepName', title: copy.ledgerCols.step, render: (v) => h('b', {}, v) },
        { key: 'attempt', title: copy.ledgerCols.attempt, render: (v, r) => (v > 0 ? ((r.maxAttempts ?? 1) > 1 ? template(STUDIO_COPY.run.tryOf, { n: v, max: r.maxAttempts }) : String(v)) : STUDIO_COPY.run.tryNone) },
        { key: 'result', title: copy.ledgerCols.result, render: (v, r) => {
          const res = catalog.stepResults[v] ?? catalog.stepResults.not_run;
          const label = v === 'pinned' ? res.editorLabel ?? res.label : v === 'failed' && r.detail ? `${res.label}, ${r.detail.replace(/^the /, '')}` : res.label;
          return statusEl(scope, label, res.st);
        } },
        { key: 'in', title: copy.ledgerCols.in, align: 'end', render: (_v, r) => String(ledgerItems(r).in) },
        { key: 'out', title: copy.ledgerCols.out, align: 'end', render: (_v, r) => String(ledgerItems(r).out) },
        { key: 'durationMs', title: copy.ledgerCols.time, align: 'end', render: (v) => h('span', { class: ['mono', v ? '' : 'ter'] }, v ? formatDuration(v) : STUDIO_COPY.never) },
      ],
      data: run.ledger.filter((r) => r.attempt > 0 || r.result === 'running'),
    }, { size: 'sm', className: 'editor-ledger' });
    requestAnimationFrame(() => {
      host.querySelectorAll('tbody tr').forEach((tr, i) => {
        const row = run.ledger.filter((r) => r.attempt > 0 || r.result === 'running')[i];
        tr.classList.toggle('is-selected', Boolean(selectedId) && row?.nodeId === selectedId && row === run.ledger.filter((r) => r.nodeId === selectedId).at(-1));
      });
    });
    return host;
  }

  function render(state) {
    kit.scope.destroy();
    kit = createKit();
    const { scope, ui } = kit;
    const tabsHost = h('div', { class: 'studio-tabs' });
    const tabs = scope.mount(XWUINavTabs, tabsHost, {
      tabs: Object.entries(copy.panelTabs).map(([id, label]) => ({ id, label: id === 'problems' && state.problems.length ? `${label} (${state.problems.length})` : label })),
      activeTab: tab,
    }, { variant: 'button', size: 'sm', hideContent: true, ariaLabel: copy.panelLabel });
    tabs.onChange?.((id) => { tab = id?.id ?? id; render(state); });

    const summary = runSummary(state.run);
    const chips = [];
    if (summary?.running) chips.push(statusEl(scope, copy.runningNow, 'run'));
    if (summary?.finished) chips.push(statusEl(scope, template(copy.finished, { n: summary.finished }), 'ok'));
    if (summary?.failed) chips.push(statusEl(scope, template(copy.failedCount, { n: summary.failed }), 'err'));
    if (summary?.disabled) chips.push(statusEl(scope, template(copy.disabledCount, { n: summary.disabled }), 'dis'));

    el.replaceChildren(
      h('div', { class: 'rowf gap12 editor-runpanel__head' }, tabsHost, chips,
        state.run && ui.button(copy.openReceipt, { variant: 'secondary', size: 'sm', className: 'sp', onClick: () => ctx.navigate(ctx.href(STUDIO_ROUTES.run, { runId: state.run.id }).slice(1)) })),
      h('div', { class: 'editor-runpanel__body' }, body(state)));
  }

  return {
    el,
    render,
    destroy: () => kit.scope.destroy(),
  };
}
