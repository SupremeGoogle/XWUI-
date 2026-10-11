import { XWUITimeline, XWUIDisplayAvatar } from '@exonware/xwui/basic';
import { h } from '../../../core/dom.js';
import {
  pageSession,
  createXwfKit,
  titleBlock,
  routeAction,
  saveDownload,
} from '../../../components/xwf-ui.js';

export default {
  id: 'admin-audit',
  path: '/admin/audit',
  layout: 'admin',
  title: 'Audit',
  async mount(el, ctx) {
    const session = pageSession(el);
    const { ui, scope } = session;
    const data = await ctx.api.adminApi.getAudit();
    if (!session.active) return session.handle;
    ctx.setTitle(data.title);
    const filters = {
      q: '',
      actor: '',
      actorClass: '',
      action: '',
      object: '',
      days: '7',
      page: 1,
    };
    let seq = 0;
    let tableKit;
    let timer;
    scope.onDispose(() => {
      clearTimeout(timer);
      tableKit?.scope.destroy();
    });
    const results = h('div', { class: 'stack gap16 xwf-audit-events' });
    const filterFields = data.filters.map((filter) =>
      ui.select(
        {
          label: filter.label,
          value: '',
          options: [{ value: '', label: filter.any }, ...filter.options],
        },
        (value) => {
          filters[filter.key] = value;
          filters.page = 1;
          refresh();
        },
      ),
    );
    const date = ui.select(
      { label: data.dateLabel, value: filters.days, options: data.ranges },
      (value) => {
        filters.days = value;
        filters.page = 1;
        refresh();
      },
    );
    const search = ui.text(
      { label: data.search, placeholder: data.search },
      (value) => {
        filters.q = value;
        filters.page = 1;
        clearTimeout(timer);
        timer = setTimeout(refresh, data.searchDelay);
      },
      { type: 'search', clearable: true },
    );
    let exporting = false;
    const download = ui.button(data.download, {
      variant: 'outline',
      size: 'sm',
      icon: 'download',
      onClick: async () => {
        if (exporting) return;
        exporting = true;
        download.xw.updateConfig({ loading: true });
        try {
          const result = await ctx.api.adminApi.exportAudit({ ...filters });
          if (session.active) {
            saveDownload(result.csv, result.filename);
            ctx.notify.success(data.downloaded);
          }
        } catch (error) {
          if (session.active) ctx.notify.error(error.message);
        } finally {
          exporting = false;
          if (session.active) download.xw.updateConfig({ loading: false });
        }
      },
    });
    let streamingConfig = data.streamingConfig;
    const streamingStatus = ui.tag(
      streamingConfig.enabled
        ? data.streaming.statusOn
        : data.streaming.statusOff,
    );
    let configuring = false;
    async function configure() {
      if (configuring) return;
      configuring = true;
      const dialogKit = createXwfKit();
      const endpoint = dialogKit.ui.text(
        {
          label: data.streaming.endpoint,
          placeholder: data.streaming.endpointPlaceholder,
          value: streamingConfig.endpoint,
        },
        null,
        { type: 'url', required: true },
      );
      let enabled = streamingConfig.enabled;
      const content = h(
        'div',
        { class: 'stack gap16' },
        h('p', { class: 'xs sec' }, data.labels.demoNote),
        endpoint,
        dialogKit.ui.switch(
          { label: data.streaming.enabled, checked: enabled },
          (value) => {
            enabled = value;
          },
        ),
      );
      try {
        const action = await ui.modal({
          title: data.streaming.action,
          content,
          actions: [
            { id: 'cancel', label: data.labels.cancel },
            { id: 'save', label: data.labels.save, variant: 'primary' },
          ],
        });
        if (action === 'save' && session.active) {
          streamingConfig = await ctx.api.adminApi.configureStreaming({
            endpoint: endpoint.xw.getValue(),
            enabled,
          });
          if (session.active) {
            streamingStatus.xw.updateData({
              label: enabled
                ? data.streaming.statusOn
                : data.streaming.statusOff,
            });
            ctx.notify.success(data.streaming.saved);
          }
        }
      } catch (error) {
        if (session.active) ctx.notify.error(error.message);
      } finally {
        configuring = false;
        dialogKit.scope.destroy();
      }
    }
    async function refresh() {
      const current = ++seq;
      tableKit?.scope.destroy();
      tableKit = createXwfKit();
      results.replaceChildren(tableKit.ui.skeleton({ height: '280px' }));
      try {
        const result = await ctx.api.adminApi.listAuditEvents({ ...filters });
        if (!session.active || current !== seq) return;
        tableKit.scope.destroy();
        tableKit = createXwfKit();
        const kit = tableKit;
        const meta = (row) => {
          const tag = data.actorClassTags[row.actorClass] ?? {};
          return h(
            'span',
            { class: 'rowf gap8 xwf-audit-event__meta' },
            kit.ui.mount(
              XWUIDisplayAvatar,
              { name: row.actor, alt: row.actor },
              { size: 'xs' },
              { tag: 'span', className: 'xw-host' },
            ),
            h('b', { class: 'small' }, row.actor),
            kit.ui.tag(row.actorClass, tag.variant, {
              className: tag.className,
            }),
            h(
              'time',
              { class: 'xs ter', datetime: row.timestamp, title: row.timestamp },
              row.timeLabel,
            ),
          );
        };
        const list = result.items.length
          ? kit.ui.mount(
              XWUITimeline,
              {
                items: result.items.map((row) => ({
                  id: row.id,
                  title: row.action,
                  description: row.object,
                  date: meta(row),
                  media: row.icon,
                  color: `var(--xw-${row.tone})`,
                  className: 'xwf-audit-event',
                })),
              },
              {
                position: 'left',
                dotSize: 'lg',
                ariaLabel: data.eventsLabel,
                className: 'xwf-audit-timeline',
              },
            )
          : kit.ui.empty({ title: data.empty });
        results.replaceChildren(
          list,
          kit.ui.pager(result, (page) => {
            filters.page = page;
            refresh();
          }),
        );
      } catch (error) {
        if (session.active && current === seq)
          results.replaceChildren(
            tableKit.ui.alert({ message: error.message }, { variant: 'error' }),
            tableKit.ui.button(data.labels.retry, { onClick: refresh }),
          );
      }
    }
    el.replaceChildren(
      h(
        'div',
        { class: 'rowf gap16' },
        titleBlock(data),
        h('div', { class: 'sp' }, download),
      ),
      ui.alert({ message: data.notice }, { variant: 'info' }),
      routeAction(
        ui,
        {
          label: data.identityAction,
          path: data.identityPath,
          variant: 'link',
        },
        { size: 'sm' },
      ),
      h(
        'div',
        { class: 'rowf gap12 xwf-audit-filters' },
        filterFields,
        date,
        search,
      ),
      h(
        'div',
        { class: 'wrapf gap24' },
        results,
        h(
          'aside',
          { class: 'xwf-audit-stream' },
          ui.card(
            h(
              'div',
              { class: 'stack gap16' },
              ui.icon('activity', { color: 'var(--xw-cyan)', size: 'xl' }),
              h('h2', { class: 'h3' }, data.streaming.title),
              ui.tag(data.streaming.tag),
              h('p', { class: 'small sec' }, data.streaming.description),
              streamingStatus,
              ui.button(data.streaming.action, {
                variant: 'outline',
                onClick: configure,
              }),
              h('p', { class: 'xs sec' }, data.labels.demoNote),
            ),
          ),
        ),
      ),
    );
    await refresh();
    return session.handle;
  },
};
