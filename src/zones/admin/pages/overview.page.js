import { ADMIN_ROUTES } from '../../../core/routes.js';
import { XWUITable, XWUIProgressBar } from '@exonware/xwui/basic';
import { h } from '../../../core/dom.js';
import { pageSession, createXwfKit, titleBlock, routeAction } from '../../../components/xwf-ui.js';
import { XWFBarChart } from '../../../components/XWFBarChart/XWFBarChart.js';
import { XWFIsoTiles } from '../../../components/XWFIsoTiles/XWFIsoTiles.js';

export default {
  id: 'admin-overview',
  path: ADMIN_ROUTES.overview,
  layout: 'admin',
  title: 'Overview',
  async mount(el, ctx) {
    const session = pageSession(el, ctx);
    const { ui, scope } = session;
    const meta = await ctx.api.adminApi.getOverview();
    if (!session.active) return session.handle;
    ctx.setTitle(meta.title);
    const kpis = h('div');
    const chart = h('section', { class: 'xwf-admin__chart' });
    const reachability = h('section', { class: 'xwf-admin__reachability' });
    const failures = h('section', { class: 'stack gap12' });
    el.replaceChildren(
      titleBlock(meta),
      kpis,
      h('div', { class: 'xwf-admin__panels' }, chart, reachability),
      failures,
    );
    const panelKits = new Map();
    scope.onDispose(() => panelKits.forEach((kit) => kit.scope.destroy()));
    const failOnce = {
      kpis: ctx.query.failPanel === 'kpis',
      chart: ctx.query.failPanel === 'chart',
    };
    const loadMetric = (name, loader) => {
      const fail = failOnce[name];
      failOnce[name] = false;
      return loader({ fail });
    };
    async function panel(host, load, render) {
      panelKits.get(host)?.scope.destroy();
      const kit = createXwfKit();
      panelKits.set(host, kit);
      host.replaceChildren(kit.ui.skeleton({ height: '180px' }));
      try {
        const data = await load();
        if (session.active) host.replaceChildren(render(data, kit.ui));
      } catch (error) {
        if (session.active)
          host.replaceChildren(
            kit.ui.alert({ message: error.message }, { variant: 'error' }),
            kit.ui.button(meta.labels.retry, {
              size: 'sm',
              onClick: () => panel(host, load, render),
            }),
          );
      }
    }
    await Promise.allSettled([
      panel(
        kpis,
        () => loadMetric('kpis', ctx.api.adminApi.getKpis),
        (data, kit) =>
          h(
            'div',
            { class: 'g4 xwf-admin__kpis xwf-admin__kpi-grid' },
            data.map((item) =>
              h(
                'div',
                {
                  class: `xwf-admin__kpi ${item.textValue ? 'xwf-admin__kpi--text' : ''}`,
                  style: { '--xwf-tone': `var(--xw-${item.tone})` },
                },
                kit.card(kit.statistic(item), { padding: 'medium' }),
              ),
            ),
          ),
      ),
      panel(
        chart,
        () => loadMetric('chart', ctx.api.adminApi.getRunsByHour),
        (data, kit) =>
          kit.card(kit.mount(XWFBarChart, { chart: data }), {
            padding: 'medium',
          }),
      ),
      panel(
        reachability,
        () => ctx.api.adminApi.getReachability(),
        (data, kit) =>
          kit.card(
            h(
              'div',
              { class: 'stack gap8' },
              h(
                'div',
                { class: 'rowf gap8' },
                h('h2', { class: 'h3' }, data.title),
                h('span', { class: 'xs ter sp' }, data.hint),
              ),
              kit.mount(XWFIsoTiles, { tiles: data.tiles }),
              kit.alert(
                { title: data.noticeTitle, message: data.notice },
                {
                  variant: data.tiles.some((tile) => tile.attention)
                    ? 'error'
                    : 'success',
                },
              ),
              routeAction(kit, {
                label: data.action,
                path: data.path,
                variant: 'link',
              }),
            ),
            { padding: 'medium' },
          ),
      ),
      panel(
        failures,
        () => ctx.api.adminApi.getFailedRuns(),
        (data, kit) =>
          h(
            'div',
            { class: 'stack gap12' },
            h(
              'div',
              { class: 'rowf gap8' },
              h('h2', { class: 'h3' }, data.title),
              h('span', { class: 'xs ter sp' }, data.hint),
            ),
            kit.mount(
              XWUITable,
              {
                columns: data.columns.map((column) => ({
                  ...column,
                  render:
                    column.key === 'flow'
                      ? (value, row) =>
                          kit.button(value, {
                            variant: 'link',
                            size: 'sm',
                            href: `#${row.path}`,
                          })
                      : column.key === 'share'
                        ? (value, row) =>
                            kit.mount(
                              XWUIProgressBar,
                              { value, label: `${value}%` },
                              {
                                size: 'sm',
                                accentColor: `var(--xw-${row.tone})`,
                              },
                            )
                        : undefined,
                })),
                data: data.rows,
              },
              { hoverable: true, rowClickable: true, size: 'md' },
            ),
          ),
      ),
    ]);
    // Rows have native links as well as keyboard row activation.
    const table = failures.querySelector('.xw-host')?.xw;
    table?.onRowClick((row) => ctx.navigate(row.path));
    return session.handle;
  },
};
