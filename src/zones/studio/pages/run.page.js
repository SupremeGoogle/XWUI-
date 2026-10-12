/**
 * Studio: run receipt. Gauge + status hero, failure alert, timeline waterfall, ledger and
 * attempt detail (input / output / error), compare, export, retry from a step.
 * A live run (just started) refreshes until the engine finishes it.
 */
import {
  XWUITable, XWUIProgressCircle, XWUIFeedbackAlert, XWUINavTabs, XWUICodeBlock,
} from '@exonware/xwui/basic';
import { h } from '../../../core/dom.js';
import { createKit } from '../../../core/ui.js';
import { template, formatDateTime, formatDuration, formatNumber } from '../../../core/format.js';
import { STUDIO_LAYOUT_ID, STUDIO_ROUTES } from '../studio.routes.js';
import { statusEl, downloadText } from '../shared/studio-ui.js';
import { XWFRunTimeline } from '../../../components/XWFRunTimeline/XWFRunTimeline.js';

const LIVE_POLL_MS = 450;
const RETENTION_DAYS = 30;

/** Ledger result -> timeline tone. */
const RESULT_TONE = { pinned: 'pin', failed: 'err', succeeded: 'ok', took_yes: 'muted', took_no: 'muted', running: 'run' };

function attemptLabel(row) {
  return (row.maxAttempts ?? 1) > 1 ? `${row.stepName}, ${row.attempt}` : row.stepName;
}

export function timelineRows(run, copy) {
  return run.ledger.map((row, i) => {
    const tone = RESULT_TONE[row.result] ?? 'muted';
    const hasBar = row.offsetMs !== null && row.offsetMs !== undefined && row.result !== 'disabled' && row.result !== 'not_run';
    let note = copy.timelineSkipped[row.result] ?? '';
    if (hasBar && row.result !== 'pinned' && row.result !== 'running') {
      note = formatDuration(row.durationMs ?? 0) + (row.error?.status ? `, ${row.error.status}` : '');
    }
    return {
      id: String(i), label: attemptLabel(row), offsetMs: hasBar ? row.offsetMs : null,
      durationMs: row.result === 'pinned' ? Math.max(8, (run.durationMs ?? 1000) * 0.012) : (row.durationMs ?? (run.durationMs ?? 1000) * 0.05),
      tone: hasBar ? tone : 'muted', note,
    };
  });
}

export default {
  id: 'studio-run',
  path: STUDIO_ROUTES.run,
  layout: STUDIO_LAYOUT_ID,
  async mount(el, ctx) {
    const { studioApi } = ctx.api;
    const page = createKit();
    let viewKit = createKit();
    let detailKit = createKit();
    let selectedIndex = null;
    let poll = null;
    let disposed = false;

    const [shell, catalog] = await Promise.all([studioApi.getShell(), studioApi.getCatalog()]);
    if (ctx.isActive && !ctx.isActive()) { page.scope.destroy(); return { unmount() {} }; }
    const STUDIO_COPY = catalog.copy;
    const C = STUDIO_COPY.run;
    let run = await studioApi.getRun(ctx.params.runId);
    ctx.setTitle(`${run.flowName} ${run.shortId}`);

    const detailHost = h('aside', { class: 'glass pad stack gap16 gb run-detail', 'aria-label': C.detailTabs.input });

    function chooseDefaultAttempt() {
      const failed = run.ledger.findIndex((r) => r.result === 'failed');
      if (failed >= 0) return failed;
      const recorded = run.ledger.map((r, i) => (r.attempt > 0 ? i : -1)).filter((i) => i >= 0);
      return recorded.at(-1) ?? 0;
    }

    function renderTopbar() {
      ctx.layout?.setTopbar?.({
        crumbs: [
          { label: shell.project.name, route: STUDIO_ROUTES.flows },
          { label: C.crumbsRuns, route: STUDIO_ROUTES.runs },
          { label: run.flowName },
        ],
        meta: [h('span', { class: 'mono xs ter' }, run.shortId)],
        actions: [
          page.ui.button(C.compare, { variant: 'secondary', size: 'sm', icon: 'git-compare', onClick: compare }),
          page.ui.button(C.export, { variant: 'secondary', size: 'sm', icon: 'download', onClick: exportReceipt }),
          page.ui.button(C.showOnCanvas, { variant: 'outline', size: 'sm', onClick: () => ctx.navigate(ctx.href(STUDIO_ROUTES.editor, { flowId: run.flowId }, { run: run.id }).slice(1)) }),
        ],
      });
    }

    async function compare() {
      if (!run.previousRunId) {
        await page.ui.dialog({ title: C.compareTitle, content: C.compareNone, actions: [{ id: 'close', label: C.close, variant: 'secondary' }], size: 'sm' });
        return;
      }
      try {
        const diff = await studioApi.compareRuns(run.id, run.previousRunId);
        const { scope, ui } = createKit();
        const host = h('div');
        const body = h('div', { class: 'stack gap12' },
          h('div', { class: 'rowf gap8 wrapf' }, ui.tag(`${C.compareCols.a}: ${diff.a.shortId}`, 'primary'), ui.tag(`${C.compareCols.b}: ${diff.b.shortId}`)),
          host);
        scope.mount(XWUITable, host, {
          columns: [
            { key: 'stepName', title: C.compareCols.step },
            { key: 'aMs', title: C.compareCols.a, align: 'end', render: (v) => h('span', { class: 'mono' }, v ? formatDuration(v) : STUDIO_COPY.never) },
            { key: 'bMs', title: C.compareCols.b, align: 'end', render: (v) => h('span', { class: 'mono' }, v ? formatDuration(v) : STUDIO_COPY.never) },
            { key: 'diff', title: C.compareCols.diff, align: 'end', render: (_v, r) => {
              const d = (r.aMs ?? 0) - (r.bMs ?? 0);
              return h('span', { class: ['mono', d > 0 ? 'run-diff--slower' : d < 0 ? 'run-diff--faster' : 'ter'] }, `${d > 0 ? '+' : ''}${formatNumber(d)} ms`);
            } },
          ],
          data: diff.steps,
        }, { size: 'sm' });
        await page.ui.dialog({ title: C.compareTitle, content: body, actions: [{ id: 'close', label: C.close, variant: 'secondary' }], size: 'lg' });
        scope.destroy();
      } catch (error) { ctx.notify.fromError(error); }
    }

    async function exportReceipt() {
      try {
        downloadText(await studioApi.exportReceipt(run.id));
        ctx.notify.success(C.exported);
      } catch (error) { ctx.notify.fromError(error); }
    }

    async function retryFrom(row) {
      try {
        const { id } = await studioApi.retryFromStep(run.id, row.nodeId);
        ctx.notify.success(template(C.retryStarted, { step: row.stepName }));
        ctx.navigate(ctx.href(STUDIO_ROUTES.run, { runId: id }).slice(1));
      } catch (error) { ctx.notify.fromError(error); }
    }

    function renderDetail() {
      detailKit.scope.destroy();
      detailKit = createKit();
      const row = run.ledger[selectedIndex];
      if (!row) { detailHost.replaceChildren(); return; }
      const failed = row.result === 'failed';
      const tryLabel = row.attempt > 0 ? `${STUDIO_COPY.run.columns.attempt} ${template(C.tryOf, { n: row.attempt, max: row.maxAttempts ?? 1 })}` : catalog.stepResults[row.result].label;
      const sections = [
        { id: 'input', label: C.detailTabs.input, value: row.input },
        { id: 'output', label: C.detailTabs.output, value: row.output },
        { id: 'error', label: C.detailTabs.error, value: row.error },
      ];
      const initial = sections.find((s) => s.value)?.id ?? 'input';
      const codeHost = h('div', { class: 'run-detail__code' });
      const showSection = (id) => {
        const section = sections.find((s) => s.id === id);
        codeHost.replaceChildren();
        if (!section?.value) { codeHost.append(h('p', { class: 'small sec' }, C.nothingStored)); return; }
        const host = h('div');
        codeHost.append(host);
        detailKit.scope.mount(XWUICodeBlock, host, { code: JSON.stringify(section.value, null, 2) }, { language: 'json', copyable: true, upgradeToEditor: false, className: 'run-code' });
      };
      const tabsHost = h('div', { class: 'studio-tabs' });
      const tabs = detailKit.scope.mount(XWUINavTabs, tabsHost, { tabs: sections.map(({ id, label }) => ({ id, label })), activeTab: initial }, { variant: 'button', size: 'sm', hideContent: true });
      tabs.onChange?.((id) => showSection(id?.id ?? id));
      const expires = new Date(new Date(run.startedAt).getTime() + RETENTION_DAYS * 864e5).toISOString();

      detailHost.replaceChildren(
        h('div', { class: 'rowf gap8' }, h('h2', { class: 'h3 run-detail__title' }, row.stepName), detailKit.ui.tag(tryLabel, failed ? 'error' : 'default')),
        tabsHost,
        h('div', { class: 'rowf gap8' }, detailKit.ui.tag(catalog.payloadLabels[row.payload] ?? C.stored, row.payload === 'none' ? 'default' : 'primary'),
          h('span', { class: 'xs sec' }, template(C.kept, { date: formatDateTime(expires, { day: '2-digit', month: 'short', year: 'numeric' }) }))),
        codeHost,
        h('p', { class: 'xs sec' }, C.credentialsNote),
        h('div', { class: 'wrapf gap8' },
          detailKit.ui.button(C.retryFromStep, { variant: 'primary', size: 'sm', icon: 'refresh', disabled: run.status === 'running', onClick: () => retryFrom(row) }),
          detailKit.ui.button(C.openStep, { variant: 'secondary', size: 'sm', onClick: () => ctx.navigate(ctx.href(STUDIO_ROUTES.editor, { flowId: run.flowId }, { node: row.nodeId }).slice(1)) })));
      showSection(initial);
    }

    function render() {
      viewKit.scope.destroy();
      viewKit = createKit();
      if (selectedIndex === null || selectedIndex >= run.ledger.length) selectedIndex = chooseDefaultAttempt();
      const status = catalog.runStatuses[run.status];
      const mode = catalog.runModes[run.mode];
      const percent = run.stepsTotal ? Math.round((run.stepsRecorded / run.stepsTotal) * 100) : 0;

      const gaugeHost = h('div', { class: 'run-gauge__ring' });
      const hero = h('section', { class: 'glass wrapf gap32 run-hero' },
        h('div', { class: 'halo', style: { left: '-40px', top: '-60px', width: '260px', height: '260px', background: `var(--xw-${status.st === 'err' ? 'red' : 'green'})`, opacity: '.25' } }),
        h('div', { class: 'run-gauge', role: 'img', 'aria-label': template(C.gaugeLabel, { done: run.stepsRecorded, total: run.stepsTotal }) },
          gaugeHost,
          h('div', { class: 'run-gauge__text' }, h('span', { class: 'disp run-gauge__value' }, `${run.stepsRecorded}/${run.stepsTotal}`), h('span', { class: 'xs sec' }, C.recorded))),
        h('div', { class: 'stack gap8 run-hero__text' },
          statusEl(viewKit.scope, status.label, status.st, { size: 'lg' }),
          h('h1', { class: 'h2 run-hero__title' }, template(C.title, { flow: run.flowName, n: run.sequence ?? 1 })),
          h('div', { class: 'wrapf gap8' },
            viewKit.ui.tag(mode.longLabel ?? mode.label, ['primary', 'success', 'warning', 'error'].includes(mode.tone) ? mode.tone : 'default', { className: `xw-tone-${mode.tone}` }),
            viewKit.ui.tag(formatDateTime(run.startedAt, { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })),
            run.durationMs !== null && viewKit.ui.tag(template(C.msRecorded, { ms: formatDuration(run.durationMs) })),
            run.sampleData && viewKit.ui.tag(C.sampleData, 'default', { className: 'xw-tone-plan' }))));
      viewKit.scope.mount(XWUIProgressCircle, gaugeHost, { value: percent }, { size: 132, strokeWidth: 14, showValue: false, valueColor: `var(--xw-${status.st === 'err' ? 'red' : 'green'})`, trackColor: 'rgba(255,255,255,.08)' });

      const failedRows = run.ledger.filter((r) => r.result === 'failed');
      let alertEl = null;
      if (failedRows.length) {
        const first = failedRows[0];
        const recovered = run.ledger.find((r) => r.nodeId === first.nodeId && r.result === 'succeeded');
        const message = template(C.failureAlert, { step: first.stepName, n: first.attempt, max: first.maxAttempts ?? 1, detail: first.detail ?? catalog.stepResults.failed.label })
          + (recovered ? template(C.failureAlertRecovered, { next: recovered.attempt }) : run.status === 'failed' ? C.failureAlertFinal : '');
        alertEl = h('div');
        viewKit.scope.mount(XWUIFeedbackAlert, alertEl, { message }, { variant: 'error', className: 'run-alert' });
      }

      const timelineHost = h('div');
      const total = run.durationMs ?? Math.max(...run.ledger.map((r) => (r.offsetMs ?? 0) + (r.durationMs ?? 0)), 1);
      const timelineSection = h('section', { class: 'glass pad stack gap16', 'aria-label': C.timeline },
        h('div', { class: 'rowf gap8' }, h('h2', { class: 'h3' }, C.timeline), run.status === 'running' && h('span', { class: 'xs sec' }, C.liveNote)),
        timelineHost);
      const timeline = viewKit.scope.mount(XWFRunTimeline, timelineHost, {
        rows: timelineRows(run, C).map((r) => ({ ...r, selected: r.id === String(selectedIndex) })),
        totalMs: total, startLabel: formatDuration(0), endLabel: formatDuration(total),
      });
      viewKit.scope.listen(timelineHost, 'xwf-select', (e) => { selectedIndex = Number(e.detail.id); renderDetail(); highlightLedger(); });
      void timeline;

      const ledgerHost = h('div', { class: 'studio-table' });
      const ledgerSection = h('section', { class: 'stack gap12 run-ledger', 'aria-label': C.ledger }, h('h2', { class: 'h3' }, C.ledger), ledgerHost);
      const tableHost = h('div');
      ledgerHost.append(tableHost);
      viewKit.scope.mount(XWUITable, tableHost, {
        columns: [
          { key: 'index', title: C.columns.index, render: (v) => h('span', { class: 'mono ter' }, String(v)) },
          { key: 'stepName', title: C.columns.step, render: (v, r) => viewKit.ui.button(v, { className: 'run-ledger__step', variant: 'ghost', size: 'sm', onClick: () => { selectedIndex = r.index - 1; renderDetail(); highlightLedger(); timeline.select(String(selectedIndex), { silent: true }); } }) },
          { key: 'attempt', title: C.columns.attempt, render: (v, r) => (v > 0 ? ((r.maxAttempts ?? 1) > 1 ? template(C.tryOf, { n: v, max: r.maxAttempts }) : String(v)) : C.tryNone) },
          { key: 'result', title: C.columns.result, render: (v, r) => {
            const res = catalog.stepResults[v] ?? catalog.stepResults.not_run;
            const label = v === 'failed' && r.error?.status ? `${res.label}, ${r.error.status}` : res.label;
            return statusEl(viewKit.scope, label, res.st);
          } },
          { key: 'payload', title: C.columns.payload, render: (v) => catalog.payloadLabels[v] ?? v },
          { key: 'durationMs', title: C.columns.time, align: 'end', render: (v) => h('span', { class: ['mono', v ? '' : 'ter'] }, v ? formatDuration(v) : STUDIO_COPY.never) },
        ],
        data: run.ledger,
      }, { hoverable: true });

      function highlightLedger() {
        tableHost.querySelectorAll('tbody tr').forEach((tr, i) => tr.classList.toggle('is-selected', i === selectedIndex));
      }
      requestAnimationFrame(highlightLedger);

      el.replaceChildren(h('div', { class: 'pg' },
        hero, alertEl, timelineSection,
        h('div', { class: 'wrapf gap16 run-split' }, ledgerSection, detailHost)));
      renderDetail();
    }

    renderTopbar();
    render();

    if (run.status === 'running' && run.live) {
      poll = setInterval(async () => {
        try {
          const next = await studioApi.getRun(run.id);
          if (disposed) return;
          const changed = next.status !== run.status || next.ledger.length !== run.ledger.length
            || next.ledger.some((r, i) => r.result !== run.ledger[i]?.result);
          run = next;
          if (changed) render();
          if (run.status !== 'running') clearInterval(poll);
        } catch { clearInterval(poll); }
      }, LIVE_POLL_MS);
    }

    return {
      unmount() {
        disposed = true;
        clearInterval(poll);
        detailKit.scope.destroy();
        viewKit.scope.destroy();
        page.scope.destroy();
      },
    };
  },
};
