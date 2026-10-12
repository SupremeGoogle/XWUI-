/**
 * Studio: one flow in one notation (#/studio/flows/:flowId/view/:notation).
 * Header with notation tabs and a 2D/3D switch, the generated diagram, and a footer that
 * depends on the notation (lane KPIs, legends, simulation controls, 3D camera).
 */
import { XWUINavTabs, XWUIDisplayChip, XWUIInputNumber } from '@exonware/xwui/basic';
import { h } from '../../../core/dom.js';
import { createKit } from '../../../core/ui.js';
import { template, formatNumber } from '../../../core/format.js';
import { CANVAS_LAYOUT_ID, STUDIO_ROUTES } from '../studio.routes.js';
import { kpiEl, downloadText } from '../shared/studio-ui.js';
import { XWFFlowDiagram } from '../../../components/XWFFlowDiagram/XWFFlowDiagram.js';
import { retriesInRun, formatSimClock } from '../../../components/XWFFlowDiagram/XWFFlowDiagram.logic.js';

const DEFAULT_CAMERA = { tilt: 56, spin: -24, height: 1 };

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
    if (ctx.isActive && !ctx.isActive()) { page.scope.destroy(); return { unmount() {} }; }
    const STUDIO_COPY = catalog.copy;
    const C = STUDIO_COPY.views;
    const notationInfo = catalog.notations.find((n) => n.id === notation);
    if (!notationInfo || notation === 'editor') { ctx.navigate(ctx.href(STUDIO_ROUTES.editor, { flowId: flow.id }).slice(1), { replace: true }); return { unmount() {} }; }
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
        else if (key === 'editor') ctx.navigate(ctx.href(STUDIO_ROUTES.editor, { flowId: flow.id }).slice(1));
        else ctx.navigate(ctx.href(STUDIO_ROUTES.view, { flowId: flow.id, notation: key }).slice(1));
      });
    const dimHost = h('div', { class: 'studio-tabs view-dim' });
    scope.mount(XWUINavTabs, dimHost, { tabs: [{ id: '2d', label: C.d2 }, { id: '3d', label: C.d3 }], activeTab: notation === '3d' ? '3d' : '2d' }, { variant: 'button', size: 'sm', ariaLabel: C.dimension, hideContent: true })
      .onChange?.((id) => {
        const key = id?.id ?? id;
        if (key === '3d' && notation !== '3d') ctx.navigate(ctx.href(STUDIO_ROUTES.view, { flowId: flow.id, notation: '3d' }).slice(1));
        if (key === '2d' && notation === '3d') ctx.navigate(ctx.href(STUDIO_ROUTES.view, { flowId: flow.id, notation: 'flowchart' }).slice(1));
      });

    const crumbs = h('div', { class: 'crumb' }, h('a', { href: ctx.href(STUDIO_ROUTES.flows) }, shell.project.name), h('span', {}, '/'), h('a', { href: ctx.href(STUDIO_ROUTES.editor, { flowId: flow.id }) }, h('b', {}, flow.name)));
    const status = flow.publishedVersion ? ui.tag(catalog.flowStatuses.published.label, 'primary') : ui.tag(catalog.flowStatuses.draft.label, 'default', { className: 'xw-tone-plan' });

    const diagramHost = h('div', { class: 'view-diagram' });
    const header = h('header', { class: 'glass rowf gap12 view-header' },
      ui.button('', { variant: 'ghost', icon: 'arrow-left', ariaLabel: C.back, title: C.back, onClick: () => ctx.navigate(STUDIO_ROUTES.flows) }),
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

    /* ------------------------------ footers */
    const footers = {
      flowchart: () => [h('div', { class: 'glass pad-s view-legend small sec' }, C.flowchartLegend)],
      bpmn: () => [h('div', { class: 'glass pad-s view-legend small sec' }, C.bpmnLegend)],
      swimlane: () => {
        const chipRow = h('div', { class: 'wrapf gap8' });
        Object.entries(C.laneOptions).forEach(([id, label]) => {
          const host = h('span');
          chipRow.append(host);
          const chip = scope.mount(XWUIDisplayChip, host, { label }, { clickable: true, size: 'sm', variant: id === 'system' ? 'primary' : 'default', type: 'filter' });
          host.addEventListener('click', () => { if (id !== 'system') ctx.notify.info(template(C.notInPrototype, { name: `${C.laneBy}: ${label}` })); });
          void chip;
        });
        return [
          kpiEl(scope, { title: C.lanes, value: diagram.getSystems().length, tone: 'violet' }),
          kpiEl(scope, { title: C.handoffs, value: diagram.getHandoffs(), tone: 'cyan' }),
          kpiEl(scope, { title: C.retries, value: retriesInRun(run), tone: 'red', valueTone: 'err' }),
          h('div', { class: 'glass pad-s stack gap8 view-laneby' }, h('b', { class: 'small' }, C.laneBy), chipRow),
        ];
      },
      sequence: () => [h('div', { class: 'view-note wrapf gap16' },
        ui.tag(C.sequenceTag, 'default', { className: 'xw-tone-violet' }),
        h('span', { class: 'small sec' }, C.sequenceBody),
        run && ui.button(C.openReceipt, { variant: 'secondary', size: 'sm', className: 'sp', onClick: () => ctx.navigate(ctx.href(STUDIO_ROUTES.run, { runId: run.id }).slice(1)) }))],
      sim: () => {
        const clock = h('span', { class: 'mono small view-sim__clock' });
        const stats = h('div', { class: 'wrapf gap16 view-sim__stats' });
        const playHost = h('span');
        const renderStats = (s) => {
          if (!s) return;
          clock.textContent = template(C.simClock, { now: formatSimClock(s.clockMin), total: formatSimClock(s.totalMin) });
          const waiting = Object.values(s.stations).reduce((a, x) => a + x.queue, 0);
          const hours = Math.max(s.clockMin / 60, 1 / 60);
          stats.replaceChildren(...[[C.simStats.arrived, s.arrived], [C.simStats.done, s.done], [C.simStats.waiting, waiting], [C.simStats.throughput, Math.round(s.done / hours)]]
            .map(([k, v]) => h('div', { class: 'stack view-sim__stat' }, h('span', { class: 'xs b sec' }, k), h('span', { class: 'disp view-sim__value' }, formatNumber(v)))));
        };
        const renderPlay = () => {
          const playing = diagram.isSimPlaying();
          playHost.replaceChildren(ui.button('', { variant: 'primary', icon: playing ? 'pause' : 'play', ariaLabel: playing ? C.pause : C.play, title: playing ? C.pause : C.play, onClick: () => { if (diagram.isSimPlaying()) diagram.pauseSim(); else diagram.playSim(); renderPlay(); } }));
        };
        const speedHost = h('div', { class: 'studio-tabs' });
        scope.mount(XWUINavTabs, speedHost, { tabs: C.speeds.map((s) => ({ id: String(s), label: `${s}x` })), activeTab: '1' }, { variant: 'button', size: 'sm', ariaLabel: C.speed, hideContent: true })
          .onChange?.((id) => diagram.setSimSpeed(Number(id?.id ?? id)));
        scope.listen(diagramHost, 'xwf-step', (e) => { renderStats(e.detail.state); if (!e.detail.state.running) renderPlay(); });
        renderPlay();
        renderStats(diagram.data.simState);
        stage.prepend(h('div', { class: 'rowf gap12 view-sim__tags' }, ui.tag(C.simTag, 'warning'), ui.tag(C.simModel, 'default', { className: 'xw-tone-plan' })), h('div', { class: 'view-sim__clockwrap' }, clock));
        return [
          h('section', { class: 'glass pad stack gap12 view-sim__controls', 'aria-label': C.simControls },
            h('div', { class: 'rowf gap8' }, playHost,
              ui.button('', { variant: 'secondary', icon: 'player-skip-forward', ariaLabel: C.stepOnce, title: C.stepOnce, onClick: () => diagram.stepSimOnce() }),
              ui.button('', { variant: 'secondary', icon: 'refresh', ariaLabel: C.reset, title: C.reset, onClick: () => { diagram.pauseSim(); diagram.resetSim(); renderStats(diagram.data.simState); renderPlay(); } }),
              h('span', { class: 'xs b sec sp' }, C.speed), speedHost)),
          h('section', { class: 'glass pad view-sim__statsbox' }, stats),
        ];
      },
      '3d': () => {
        const camera = { ...DEFAULT_CAMERA };
        const numberField = (label, key, opts) => {
          const host = h('div');
          const input = scope.mountField(XWUIInputNumber, host, { value: camera[key], label }, { size: 'sm', ...opts });
          input.onChange?.((v) => { camera[key] = Number(v); diagram.setView(camera); });
          return h('div', { class: 'view-3d__field' }, host);
        };
        return [h('section', { class: 'glass pad wrapf gap16 view-3d__controls' },
          h('p', { class: 'small sec view-3d__hint' }, C.threeDHint),
          numberField(C.tilt, 'tilt', { min: 10, max: 80, step: 5 }),
          numberField(C.spin, 'spin', { min: -180, max: 180, step: 10 }),
          numberField(C.height, 'height', { min: 0.5, max: 2, step: 0.25, precision: 2 }),
          ui.button(C.resetView, { variant: 'secondary', size: 'sm', icon: 'refresh', onClick: () => diagram.setView(DEFAULT_CAMERA) }))];
      },
    };
    footer.append(...(footers[notation]?.() ?? []));

    return { unmount: () => scope.destroy() };
  },
};
