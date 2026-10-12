import { ADMIN_ROUTES } from '../../../core/routes.js';
import { XWUICodeBlock } from '@exonware/xwui/basic';
import { h } from '../../../core/dom.js';
import {
  pageSession,
  createXwfKit,
  assetImage,
} from '../../../components/xwf-ui.js';
import { XWFIsoTiles } from '../../../components/XWFIsoTiles/XWFIsoTiles.js';
import { XWFUptimeBar } from '../../../components/XWFUptimeBar/XWFUptimeBar.js';
import { XWFHealthCheck } from '../../../components/XWFHealthCheck/XWFHealthCheck.js';

export default {
  id: 'system-health',
  path: ADMIN_ROUTES.health,
  layout: 'admin',
  title: 'Health',
  async mount(el, ctx) {
    const session = pageSession(el);
    const { ui, scope } = session;
    const data = await ctx.api.adminApi.getHealth();
    if (!session.active) return session.handle;
    const c = data.content;
    let state = data.state;
    let busy = false;
    let renderKit;
    ctx.setTitle(c.title);
    scope.onDispose(() => renderKit?.scope.destroy());
    const content = h('div', { class: 'stack gap24' });
    async function operate(action) {
      if (busy) return;
      if (action !== 'check') {
        const confirmed = await ui.modal({
          title:
            action === 'pause' ? c.actions.pauseTitle : c.actions.drainTitle,
          content:
            action === 'pause' ? c.actions.pauseBody : c.actions.drainBody,
          actions: [
            { id: 'cancel', label: data.labels.cancel },
            { id: 'confirm', label: data.labels.confirm, variant: 'primary' },
          ],
        });
        if (confirmed !== 'confirm' || !session.active) return;
      }
      busy = true;
      render();
      try {
        state =
          action === 'check'
            ? await ctx.api.adminApi.checkHealth()
            : action === 'pause'
              ? await ctx.api.adminApi.pauseSchedules()
              : await ctx.api.adminApi.drainWorker(c.actions.worker);
        if (session.active)
          ctx.notify.success(
            action === 'check'
              ? c.checked
              : action === 'pause'
                ? c.actions.pauseSuccess
                : c.actions.drainSuccess,
          );
      } catch (error) {
        if (session.active) ctx.notify.error(error.message);
      } finally {
        busy = false;
        if (session.active) render();
      }
    }
    function render() {
      if (!session.active) return;
      renderKit?.scope.destroy();
      renderKit = createXwfKit();
      const kit = renderKit.ui;
      const attention = state.checks.filter((check) =>
        ['error', 'warning'].includes(check.variant),
      ).length;
      const headline = (attention ? c.headline : c.healthy)
        .replace('{attention}', attention)
        .replace('{total}', state.checks.length);
      const tiles = c.topology.tiles.map((tile) =>
        tile.label === c.topology.storageLabel && state.checkCount
          ? { ...tile, tone: 'green', attention: false }
          : tile.label === c.topology.schedulerLabel && state.schedulesPaused
            ? { ...tile, tone: 'violet' }
            : tile,
      );
      content.replaceChildren(
        h(
          'div',
          { class: 'rowf gap16' },
          h('h1', { class: 'h2 xwf-page-title' }, c.title),
          h(
            'div',
            { class: 'sp' },
            kit.button(c.check, {
              variant: 'outline',
              icon: 'refresh',
              loading: busy,
              onClick: () => operate('check'),
            }),
          ),
        ),
        h(
          'section',
          {
            class: 'xwf-health-summary',
            style: {
              '--xwf-summary-tone': attention
                ? 'var(--xw-red)'
                : 'var(--xw-green)',
            },
          },
          assetImage(
            data.assets,
            attention ? data.assetRefs.alert : data.assetRefs.healthy,
            '',
            true,
          ),
          h(
            'div',
            { class: 'stack gap8' },
            h('h2', { class: 'h2 xwf-page-title' }, headline),
            h(
              'p',
              { class: 'sec' },
              state.checkCount ? c.recovered : c.description,
            ),
          ),
        ),
        h(
          'div',
          { class: 'wrapf gap16' },
          h(
            'section',
            { class: 'xwf-health-topology' },
            kit.card(
              h(
                'div',
                { class: 'stack gap8' },
                h(
                  'div',
                  { class: 'rowf gap8' },
                  h('h2', { class: 'h3' }, c.topology.title),
                  h('span', { class: 'xs ter sp' }, c.topology.hint),
                ),
                kit.mount(XWFIsoTiles, { tiles, topology: true }),
              ),
              { padding: 'medium' },
            ),
          ),
          h(
            'section',
            { class: 'xwf-health-history' },
            kit.card(
              h(
                'div',
                { class: 'stack gap12' },
                h('h2', { class: 'h3' }, c.uptimeTitle),
                kit.mount(XWFUptimeBar, {
                  rows: state.uptime,
                  legend: c.legend,
                }),
                kit.mount(
                  XWUICodeBlock,
                  { code: state.checkCount ? c.recoveredLog : c.log },
                  { language: 'text', upgradeToEditor: false },
                ),
              ),
              { padding: 'medium' },
            ),
          ),
        ),
        h(
          'div',
          { class: 'g3 xwf-health-checks' },
          state.checks.map((check) =>
            kit.mount(XWFHealthCheck, { check, busy }),
          ),
        ),
        h(
          'div',
          { class: 'rowf gap8 wrapf' },
          kit.button(
            state.schedulesPaused ? c.actions.paused : c.actions.pause,
            {
              variant: 'secondary',
              disabled: state.schedulesPaused || busy,
              onClick: () => operate('pause'),
            },
          ),
          kit.button(
            state.drainedWorkers.includes(c.actions.worker)
              ? c.actions.drained
              : c.actions.drain,
            {
              variant: 'secondary',
              disabled: state.drainedWorkers.includes(c.actions.worker) || busy,
              onClick: () => operate('drain'),
            },
          ),
          h('span', { class: 'xs ter' }, c.actions.hint),
        ),
      );
    }
    el.replaceChildren(content);
    render();
    return session.handle;
  },
};
