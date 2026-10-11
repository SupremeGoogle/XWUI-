/**
 * Studio: one flow in one notation (#/studio/flows/:flowId/view/:notation).
 * Header with notation tabs and a 2D/3D switch, the generated diagram, and a footer that
 * depends on the notation (lane KPIs, legends, simulation controls, 3D camera).
 */
import {
  XWUINavTabs, XWUIDisplayChip, XWUIInputSlider, XWUIInputSwitch, XWUIDisplayStatistic,
} from '@exonware/xwui/basic';
import { h } from '../../../core/dom.js';
import { createKit } from '../../../core/ui.js';
import { template, formatNumber } from '../../../core/format.js';
import { CANVAS_LAYOUT_ID, STUDIO_ROUTES } from '../studio.routes.js';
import { kpiEl, downloadText, selectEl } from '../shared/studio-ui.js';
import { XWFFlowDiagram } from '../../../components/XWFFlowDiagram/XWFFlowDiagram.js';
import { XWF_DIAGRAM_LANE_BY } from '../../../components/XWFFlowDiagram/XWFFlowDiagram.model.js';
import { XWFBarSpark } from '../../../components/XWFBarSpark/XWFBarSpark.js';
import {
  retriesInRun, formatSimClock, queueBuckets, deriveSystems, validateBpmn, flowToBpmnXml, sequenceToPlantUml, sequenceToMermaid,
} from '../../../components/XWFFlowDiagram/XWFFlowDiagram.logic.js';
import { projectXWFDiagramSymbol } from '../../../components/XWFFlowDiagram/XWFFlowDiagram.view.js';

const DEFAULT_CAMERA = { tilt: 56, spin: -24, height: 1 };
const TILT_RANGE = { min: 10, max: 80 };
const ORBIT_STEP = 15;
/** Notations drawn as a static 2D picture get zoom tools on the stage. */
const ZOOMABLE = new Set(['flowchart', 'swimlane', 'bpmn', 'sequence']);
const ZOOM_STEP = 1.25;

export default {
  id: 'studio-view',
  path: STUDIO_ROUTES.view,
  layout: CANVAS_LAYOUT_ID,
  async mount(el, ctx) {
    const { studioApi } = ctx.api;
    const notation = ctx.params.notation;
    const page = createKit();
    const [shell, catalog, flow, connections, gallery] = await Promise.all([
      studioApi.getShell(), studioApi.getCatalog(), studioApi.getFlow(ctx.params.flowId), studioApi.listConnections(),
      studioApi.getNotationGallery?.().catch(() => null) ?? null,
    ]);
    const STUDIO_COPY = catalog.copy;
    const C = STUDIO_COPY.views;
    const notationInfo = catalog.notations.find((n) => n.id === notation);
    if (!notationInfo || notation === 'editor') { ctx.navigate(`/studio/flows/${flow.id}`, { replace: true }); return { unmount() {} }; }
    ctx.setTitle(`${flow.name}: ${notationInfo.label}`);
    const typeIndex = Object.fromEntries(catalog.nodeTypes.map((t) => [t.id, t]));
    const run = flow.lastRun;

    /* ------------------------------ header */
    const { ui, scope } = page;
    const tabsHost = h('div', { class: 'studio-tabs' });
    const tabs = [...catalog.notations.map((n) => ({ id: n.id, label: n.id === 'editor' ? n.label : n.short })),
      { id: 'all', label: template(C.all, { n: gallery?.items?.length ?? catalog.notations.length }) }];
    scope.mount(XWUINavTabs, tabsHost, { tabs, activeTab: notation }, { variant: 'button', size: 'sm', ariaLabel: C.viewAs, hideContent: true })
      .onChange?.((id) => {
        const key = id?.id ?? id;
        if (key === notation) return;
        if (key === 'all') ctx.navigate(ctx.href(STUDIO_ROUTES.notations, {}, { flow: flow.id }).slice(1));
        else if (key === 'editor') ctx.navigate(`/studio/flows/${flow.id}`);
        else ctx.navigate(`/studio/flows/${flow.id}/view/${key}`);
      });
    const dimHost = h('div', { class: 'studio-tabs view-dim' });
    scope.mount(XWUINavTabs, dimHost, { tabs: [{ id: '2d', label: C.d2 }, { id: '3d', label: C.d3 }], activeTab: notation === '3d' ? '3d' : '2d' }, { variant: 'button', size: 'sm', ariaLabel: C.dimension, hideContent: true })
      .onChange?.((id) => {
        const key = id?.id ?? id;
        if (key === '3d' && notation !== '3d') ctx.navigate(`/studio/flows/${flow.id}/view/3d`);
        if (key === '2d' && notation === '3d') ctx.navigate(`/studio/flows/${flow.id}/view/flowchart`);
      });

    const crumbs = h('div', { class: 'crumb' }, h('a', { href: ctx.href(STUDIO_ROUTES.flows) }, shell.project.name), h('span', {}, '/'), h('a', { href: ctx.href(STUDIO_ROUTES.editor, { flowId: flow.id }) }, h('b', {}, flow.name)));
    const status = flow.publishedVersion ? ui.tag(catalog.flowStatuses.published.label, 'primary') : ui.tag(catalog.flowStatuses.draft.label, 'default', { className: 'xw-tone-plan' });

    const diagramHost = h('div', { class: 'view-diagram' });
    const header = h('header', { class: 'glass rowf gap12 view-header' },
      ui.button('', { variant: 'ghost', icon: 'arrow-left', ariaLabel: C.back, title: C.back, onClick: () => ctx.navigate('/studio/flows') }),
      h('span', { class: 'mark view-header__mark', 'aria-hidden': 'true' }),
      crumbs, status, tabsHost,
      h('div', { class: 'rowf gap8 sp' }, dimHost, ui.button(C.export, { variant: 'secondary', size: 'sm', icon: 'download', onClick: exportDiagram })));

    const stage = h('div', { class: ['stage', 'view-stage', `view-stage--${notation}`] },
      notation !== '3d' && h('div', { class: 'halo', style: { left: '30%', top: '20%', width: '500px', height: '300px', background: `var(--xw-${notation === 'bpmn' ? 'orange' : 'violet'})`, opacity: '.18' } }),
      diagramHost);
    const footer = h('div', { class: 'wrapf gap16 view-footer' });
    el.append(h('div', { class: 'xw view-page' }, header, stage, footer));

    const diagram = scope.mount(XWFFlowDiagram, diagramHost, {
      flow, nodeTypes: typeIndex, run, connections, lanes: catalog.lanes, labels: C.diagram,
    }, { notation, ...(notation === '3d' ? DEFAULT_CAMERA : {}) });

    function exportDiagram() {
      const svg = diagram.toSvgString();
      if (svg) downloadText({ fileName: `${flow.id}-${notation}.svg`, mimeType: 'image/svg+xml', content: svg });
      else downloadText({ fileName: `${flow.id}-${notation}.json`, mimeType: 'application/json', content: JSON.stringify({ flow: flow.name, notation, graph: flow.graph }, null, 2) });
      ctx.notify.success(C.exported);
    }

    /* ------------------------------ stage tools */
    if (ZOOMABLE.has(notation)) {
      stage.append(h('div', { class: 'cvtools view-zoom', role: 'toolbar', 'aria-label': C.zoomLabel },
        ui.button('', { variant: 'ghost', size: 'sm', icon: 'plus', ariaLabel: C.zoomIn, title: C.zoomIn, onClick: () => diagram.zoomBy(ZOOM_STEP) }),
        ui.button('', { variant: 'ghost', size: 'sm', icon: 'minus', ariaLabel: C.zoomOut, title: C.zoomOut, onClick: () => diagram.zoomBy(1 / ZOOM_STEP) }),
        ui.button('', { variant: 'ghost', size: 'sm', icon: 'maximize', ariaLabel: C.zoomFit, title: C.zoomFit, onClick: () => diagram.resetZoom() })));
    }

    /** Symbol + label pairs drawn with the diagram's own shapes. */
    const legendEl = (title, symbols) => h('div', { class: 'wrapf gap16 view-legend__items' },
      title && h('b', { class: 'small' }, title),
      symbols.map((item) => h('span', { class: 'rowf gap8 small sec' }, projectXWFDiagramSymbol(item.symbol, item.tone), item.label)));

    /* ------------------------------ footers */
    const footers = {
      flowchart: () => [h('div', { class: 'glass pad-s stack gap12 view-legend' },
        legendEl(C.flowchartLegendTitle, C.flowchartSymbols),
        h('p', { class: 'xs ter view-legend__note' }, C.sameFlowNote))],
      bpmn: () => {
        const systemsModel = deriveSystems(flow, typeIndex, connections, catalog.lanes);
        const problems = validateBpmn(flow, typeIndex);
        const stepName = (id) => flow.graph.nodes.find((n) => n.id === id)?.name ?? id;
        const problemLines = problems.map((p) => template(C.bpmnProblemText[p.code], { step: stepName(p.nodeId) })).join(' ');
        let version = C.bpmnVersions[0].value;
        const legacyNote = h('p', { class: 'xs ter view-legend__note', hidden: true });
        const versionSelect = selectEl(scope, {
          label: C.bpmnVersion,
          options: C.bpmnVersions,
          value: version,
          onChange: (value) => {
            version = value ?? C.bpmnVersions[0].value;
            const legacy = version.startsWith('1.');
            legacyNote.hidden = !legacy;
            legacyNote.textContent = legacy ? template(C.bpmnLegacyNote, { version }) : '';
          },
        });
        const validity = problems.length
          ? ui.tag(template(C.bpmnProblems, { n: problems.length }), 'warning', { title: problemLines })
          : ui.tag(C.bpmnValid, 'success');
        const exportXml = () => {
          downloadText({
            fileName: `${flow.id}.bpmn`,
            mimeType: 'application/xml',
            content: flowToBpmnXml(flow, typeIndex, systemsModel, { version, exporter: shell.nav.brand }),
          });
          ctx.notify.success(C.bpmnExported);
        };
        return [h('div', { class: 'glass pad-s stack gap12 view-legend' },
          h('div', { class: 'wrapf gap16 view-bpmn__bar' },
            h('label', { class: 'rowf gap8 small b view-bpmn__version' }, C.bpmnVersion, versionSelect),
            legendEl('', C.bpmnSymbols),
            h('div', { class: 'rowf gap8 sp' }, validity,
              ui.button(C.exportBpmn, { variant: 'secondary', size: 'sm', icon: 'file-code', onClick: exportXml }))),
          problems.length ? h('p', { class: 'xs ter view-legend__note' }, problemLines) : null,
          legacyNote)];
      },
      swimlane: () => {
        const kpiHost = h('div', { class: 'view-lane-kpis' });
        const renderKpis = () => kpiHost.replaceChildren(
          kpiEl(scope, { title: C.lanes, value: diagram.getSystems().length, tone: 'violet' }),
          kpiEl(scope, { title: C.handoffs, value: diagram.getHandoffs(), tone: 'cyan' }),
          kpiEl(scope, { title: C.retries, value: retriesInRun(run), tone: 'red', valueTone: 'err' }));
        let laneBy = 'system';
        const chipRow = h('div', { class: 'wrapf gap8' });
        const renderChips = () => chipRow.replaceChildren(...Object.entries(C.laneOptions).map(([id, label]) => {
          const host = h('span');
          scope.mount(XWUIDisplayChip, host, { label }, { clickable: true, size: 'sm', variant: id === laneBy ? 'primary' : 'default', type: 'filter' });
          host.addEventListener('click', () => {
            if (id === laneBy) return;
            // Only groupings the model can derive are offered as live lanes.
            if (!XWF_DIAGRAM_LANE_BY.includes(id)) { ctx.notify.info(template(C.notInPrototype, { name: `${C.laneBy}: ${label}` })); return; }
            laneBy = id;
            diagram.setLayout({ laneBy });
            renderChips();
            renderKpis();
          });
          return host;
        }));
        renderChips();
        renderKpis();
        return [kpiHost, h('div', { class: 'glass pad-s stack gap8 view-laneby' }, h('b', { class: 'small' }, C.laneBy), chipRow)];
      },
      sequence: () => {
        const systemsModel = deriveSystems(flow, typeIndex, connections, catalog.lanes);
        let shown = run;
        const runHost = h('span', { class: 'rowf gap8 small b view-seq__run' });
        const exportText = (format, fileName, mimeType, toText) => {
          downloadText({ fileName, mimeType, content: toText(flow, typeIndex, shown, systemsModel, C.diagram) });
          ctx.notify.success(template(C.textExported, { format }));
        };
        // A dot is a ledger row: open that attempt in the receipt of the run on screen.
        scope.listen(diagramHost, 'xwf-ledger', (e) => {
          if (shown) ctx.navigate(ctx.href(STUDIO_ROUTES.run, { runId: shown.id }, { row: e.detail.index }).slice(1));
        });
        studioApi.listRuns({ flowId: flow.id, days: 0, pageSize: 50 }).then((list) => {
          if (!list.items.length) { runHost.replaceChildren(h('span', { class: 'ter' }, C.sequenceNoRun)); return; }
          runHost.replaceChildren(C.sequenceRun, selectEl(scope, {
            label: C.sequenceRun,
            value: shown?.id ?? list.items[0].id,
            options: list.items.map((r) => ({ value: r.id, label: template(C.sequenceRunOption, { id: r.shortId, mode: (catalog.runModes[r.mode]?.label ?? r.mode).toLowerCase() }) })),
            onChange: async (id) => {
              if (!id || id === shown?.id) return;
              try {
                shown = await studioApi.getRun(id);
                diagram.setRun(shown);
              } catch (error) { ctx.notify.fromError(error); }
            },
          }));
        }).catch((error) => ctx.notify.fromError(error));
        return [h('div', { class: 'view-note wrapf gap16' },
          ui.tag(C.sequenceTag, 'default', { className: 'xw-tone-violet' }),
          h('span', { class: 'small sec' }, C.sequenceBody),
          h('div', { class: 'rowf gap8 wrapf sp' },
            runHost,
            ui.button(C.exportPlantUml, { variant: 'secondary', size: 'sm', onClick: () => exportText('PlantUML', `${flow.id}-sequence.puml`, 'text/plain', sequenceToPlantUml) }),
            ui.button(C.exportMermaid, { variant: 'secondary', size: 'sm', onClick: () => exportText('Mermaid', `${flow.id}-sequence.mmd`, 'text/plain', sequenceToMermaid) }),
            ui.button(C.openReceipt, { variant: 'outline', size: 'sm', onClick: () => shown && ctx.navigate(`/studio/runs/${shown.id}`) })))];
      },
      sim: () => {
        const scenarios = catalog.simScenarios;
        const clock = h('span', { class: 'mono small view-sim__clock' });
        const playHost = h('span');
        /** KPI tile whose value follows the model (XWUIDisplayStatistic, updated in place). */
        const liveKpi = (title, tone) => {
          const host = h('div');
          const stat = scope.mount(XWUIDisplayStatistic, host, { title, value: '0' }, { valueType: 'text' });
          return { el: h('div', { class: 'kpi studio-kpi view-sim__kpi', style: { '--kc': `var(--xw-${tone})` } }, host), set: (value) => stat.updateData({ value: String(value) }) };
        };
        const first = diagram.getSimSummary();
        const focusName = first?.focus?.name;
        const kpis = {
          done: liveKpi(C.simDone, 'lime'),
          wait: liveKpi(focusName ? template(C.simAvgWait, { step: focusName }) : C.simWaitingNow, 'cyan'),
          use: liveKpi(C.simWorkerUse, 'violet'),
          counted: liveKpi(flow.sim?.countLabel ?? first?.counted?.name ?? C.simDone, 'pink'),
        };
        const queueHost = h('div');
        const queue = scope.mount(XWFBarSpark, queueHost, { buckets: [], ariaLabel: template(C.simQueueTitle, { step: focusName ?? '' }) }, { height: 80, className: 'view-sim__queue' });
        const renderStats = () => {
          const s = diagram.data.simState;
          const sum = diagram.getSimSummary();
          if (!s || !sum) return;
          clock.textContent = template(C.simClock, { now: formatSimClock(s.clockMin), total: formatSimClock(s.totalMin) });
          kpis.done.set(formatNumber(sum.done));
          const wait = sum.avgWaitMin >= 10 ? Math.round(sum.avgWaitMin) : Math.round(sum.avgWaitMin * 10) / 10;
          kpis.wait.set(focusName ? template(C.simMinutes, { n: formatNumber(wait) }) : formatNumber(sum.waitingNow));
          kpis.use.set(`${Math.round(sum.utilization * 100)}%`);
          kpis.counted.set(formatNumber(sum.countedValue ?? sum.arrived));
          queue.setBuckets(queueBuckets(sum.queueTrace, { windowMin: s.totalMin, count: C.simQueueBars }));
        };
        const renderPlay = () => {
          const playing = diagram.isSimPlaying();
          playHost.replaceChildren(ui.button('', { variant: 'primary', icon: playing ? 'pause' : 'play', ariaLabel: playing ? C.pause : C.play, title: playing ? C.pause : C.play, onClick: () => { if (diagram.isSimPlaying()) diagram.pauseSim(); else diagram.playSim(); renderPlay(); } }));
        };
        const speedHost = h('div', { class: 'studio-tabs' });
        scope.mount(XWUINavTabs, speedHost, { tabs: C.speeds.map((n) => ({ id: String(n), label: `${n}x` })), activeTab: String(C.speeds[0]) }, { variant: 'button', size: 'sm', ariaLabel: C.speed, hideContent: true })
          .onChange?.((id) => diagram.setSimSpeed(Number(id?.id ?? id)));
        const scenarioSelect = (label, options, key) => h('label', { class: 'stack gap4 small b' }, label, selectEl(scope, {
          label, options, value: options[0].value,
          onChange: (value) => {
            const option = options.find((o) => o.value === value) ?? options[0];
            diagram.setScenario({ [key]: option.factor });
            renderStats();
          },
        }));
        const workersValue = h('b', { class: 'mono view-sim__workers-value' }, String(flow.sim?.workers ?? scenarios.workers.min));
        const workersHost = h('div', { class: 'view-sim__slider' });
        scope.mount(XWUIInputSlider, workersHost, { value: flow.sim?.workers ?? scenarios.workers.min, ariaLabel: C.simWorkers }, { ...scenarios.workers, size: 'sm' })
          .onChange?.((value) => {
            const workers = Math.round(Number(Array.isArray(value) ? value[0] : value));
            workersValue.textContent = String(workers);
            diagram.setScenario({ workers });
            renderStats();
          });
        scope.listen(diagramHost, 'xwf-step', (e) => { renderStats(); if (!e.detail.state?.running) renderPlay(); });
        renderPlay();
        renderStats();
        stage.prepend(h('div', { class: 'rowf gap12 view-sim__tags' }, ui.tag(C.simTag, 'warning'), ui.tag(C.simModel, 'default', { className: 'xw-tone-plan' })), h('div', { class: 'view-sim__clockwrap' }, clock));
        return [
          h('section', { class: 'glass pad stack gap16 view-sim__controls', 'aria-label': C.simControls },
            h('div', { class: 'rowf gap8' }, playHost,
              ui.button('', { variant: 'secondary', icon: 'player-skip-forward', ariaLabel: C.stepOnce, title: C.stepOnce, onClick: () => diagram.stepSimOnce() }),
              ui.button('', { variant: 'secondary', icon: 'refresh', ariaLabel: C.reset, title: C.reset, onClick: () => { diagram.pauseSim(); diagram.resetSim(); renderStats(); renderPlay(); } }),
              h('span', { class: 'sp' }), speedHost),
            scenarioSelect(C.simArrival, scenarios.arrivals, 'arrivalFactor'),
            scenarioSelect(focusName ? template(C.simService, { step: focusName }) : C.simServiceAny, scenarios.service, 'serviceFactor'),
            h('div', { class: 'stack gap4' }, h('span', { class: 'small b' }, C.simWorkers), h('div', { class: 'rowf gap12' }, workersHost, workersValue))),
          h('section', { class: 'stack gap16 view-sim__results' },
            h('div', { class: 'view-sim__kpis' }, Object.values(kpis).map((k) => k.el)),
            h('div', { class: 'glass pad stack gap12 view-sim__chart' },
              h('div', { class: 'rowf gap8' }, h('b', { class: 'small' }, template(C.simQueueTitle, { step: focusName ?? '' })), h('span', { class: 'xs ter sp' }, C.simQueueWindow)),
              queueHost)),
        ];
      },
      '3d': () => {
        const camera = () => diagram.getView();
        const tiltValue = h('span', { class: 'mono xs view-3d__tilt-value' }, template(C.tiltValue, { n: camera().tilt }));
        const tiltHost = h('div', { class: 'view-3d__slider' });
        const tilt = scope.mount(XWUIInputSlider, tiltHost, { value: camera().tilt, ariaLabel: C.tilt }, { min: TILT_RANGE.min, max: TILT_RANGE.max, step: 1, size: 'sm' });
        tilt.onChange?.((value) => {
          const n = Math.round(Number(Array.isArray(value) ? value[0] : value));
          tiltValue.textContent = template(C.tiltValue, { n });
          diagram.setView({ tilt: n });
        });
        // Orbiting by drag changes the tilt too; keep the slider and label in step.
        const syncTilt = () => {
          const n = Math.round(camera().tilt);
          tiltValue.textContent = template(C.tiltValue, { n });
          tilt.updateData?.({ value: n });
        };
        scope.listen(window, 'pointerup', () => requestAnimationFrame(syncTilt));
        const cameraButton = (icon, label, onClick) => ui.button('', { variant: 'secondary', size: 'sm', icon, ariaLabel: label, title: label, onClick });
        const layoutSwitch = (label, key, checked) => {
          const host = h('div');
          scope.mount(XWUIInputSwitch, host, { checked, label }, { size: 'sm' }).onChange?.((value) => diagram.setLayout({ [key]: Boolean(value?.checked ?? value) }));
          return host;
        };
        const laneBy = selectEl(scope, {
          label: C.laneBy,
          value: 'system',
          options: XWF_DIAGRAM_LANE_BY.map((id) => ({ value: id, label: C.laneOptions[id] })),
          onChange: (value) => diagram.setLayout({ laneBy: value ?? 'system' }),
        });
        const replayHost = h('div');
        const renderReplay = () => {
          const playing = diagram.isReplaying();
          replayHost.replaceChildren(ui.button(playing ? C.stopReplay : C.replay, {
            variant: 'primary', icon: playing ? 'player-stop' : 'play', fullWidth: true,
            onClick: () => {
              if (!run) { ctx.notify.info(C.noRunToReplay); return; }
              if (diagram.isReplaying()) { diagram.stopReplay(); diagram.setRun(run); } else diagram.replay();
              renderReplay();
            },
          }));
        };
        scope.listen(diagramHost, 'xwf-replay', (e) => { if (e.detail.done) renderReplay(); });
        renderReplay();
        stage.append(
          h('aside', { class: 'glass stack gap12 view-3d__panel', 'aria-label': C.cameraLabel },
            h('b', { class: 'small' }, C.camera),
            h('div', { class: 'rowf gap8 wrapf' },
              cameraButton('rotate-2', C.orbitLeft, () => diagram.setView({ spin: camera().spin - ORBIT_STEP })),
              cameraButton('rotate-clockwise-2', C.orbitRight, () => diagram.setView({ spin: camera().spin + ORBIT_STEP })),
              cameraButton('plus', C.zoomIn, () => diagram.zoomBy(ZOOM_STEP)),
              cameraButton('minus', C.zoomOut, () => diagram.zoomBy(1 / ZOOM_STEP)),
              cameraButton('maximize', C.resetCamera, () => { diagram.setView({ ...DEFAULT_CAMERA, zoom: 1 }); syncTilt(); })),
            h('div', { class: 'rowf gap12' }, h('span', { class: 'small b' }, C.tilt), tiltHost, tiltValue),
            h('hr', { class: 'sep' }),
            h('b', { class: 'small' }, C.layout),
            layoutSwitch(C.floors, 'floors', true),
            layoutSwitch(C.heightByDuration, 'heightByDuration', true),
            layoutSwitch(C.failedOnly, 'failedOnly', false),
            h('label', { class: 'stack gap4 small b' }, C.laneBy, laneBy),
            replayHost),
          h('div', { class: 'glass rowf gap16 wrapf view-3d__legend' },
            h('span', { class: 'xs b sec' }, C.heightLegend.title.toUpperCase()),
            h('span', { class: 'small' }, C.heightLegend.body),
            h('span', { class: 'st ok' }, h('i'), C.heightLegend.done),
            h('span', { class: 'st err' }, h('i'), C.heightLegend.failed),
            h('span', { class: 'st run' }, h('i'), C.heightLegend.selected)));
        return [];
      },
    };
    footer.append(...(footers[notation]?.() ?? []));

    return { unmount: () => scope.destroy() };
  },
};
