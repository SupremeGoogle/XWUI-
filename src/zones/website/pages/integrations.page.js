import { WEBSITE_ROUTES } from '../../../core/routes.js';
import { h } from '../../../core/dom.js';
import { pageSession, createXwfKit, assetImage, routeAction } from '../../../components/xwf-ui.js';
import { XWFIntegrationCard } from '../../../components/XWFIntegrationCard/XWFIntegrationCard.js';

export default {
  id: 'integrations',
  path: WEBSITE_ROUTES.integrations,
  layout: 'website',
  title: 'Integrations',
  async mount(el, ctx) {
    const session = pageSession(el, ctx);
    const { ui, scope } = session;
    const data = await ctx.api.websiteApi.getDirectory();
    if (!session.active) return session.handle;
    ctx.setTitle(data.title);
    let filter = { q: '', category: 'all', page: 1 };
    let sequence = 0;
    let resultKit;
    let timer;
    const results = h('div', { class: 'stack gap24' });
    const search = ui.text(
      { placeholder: data.search, value: '', label: data.searchLabel },
      (value) => {
        filter.q = value;
        filter.page = 1;
        clearTimeout(timer);
        timer = setTimeout(refresh, data.searchDelay);
      },
      { type: 'search', clearable: true, leadingIcon: 'search', shortcut: WEBSITE_ROUTES.home },
    );
    search.classList.add('xwf-search');
    scope.onDispose(() => {
      clearTimeout(timer);
      resultKit?.scope.destroy();
    });
    scope.listen(window, 'keydown', (event) => {
      if (
        event.key === WEBSITE_ROUTES.home &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.altKey &&
        !event.target.closest('input,textarea,[contenteditable]')
      ) {
        event.preventDefault();
        search.xw.focus();
      }
    });
    const groups = ui.tabs(
      data.categories.map((category) => ({
        id: category.id,
        label: category.label,
      })),
      'all',
      (id) => {
        filter.category = id;
        filter.page = 1;
        refresh();
      },
      { ariaLabel: data.groupsLabel },
    );
    const clear = () => {
      filter = { q: '', category: 'all', page: 1 };
      search.xw.setValue('');
      groups.xw.updateData({ activeTab: 'all' });
      refresh();
    };
    async function detail(id) {
      try {
        const item = await ctx.api.websiteApi.getIntegration(id);
        if (!session.active) return;
        const content = h(
          'div',
          { class: 'stack gap16 xwf-step-details' },
          h('p', { class: 'sec' }, item.description),
          ui.tag(item.categoryLabel),
          routeAction(ui, {
            label: data.labels.studio,
            path: item.path,
            variant: 'primary',
          }),
        );
        await ui.modal({
          title: item.name,
          content,
          actions: [{ id: 'close', label: data.labels.close }],
        });
      } catch (error) {
        if (session.active) ctx.notify.error(error.message);
      }
    }
    async function refresh() {
      const current = ++sequence;
      resultKit?.scope.destroy();
      resultKit = createXwfKit();
      results.replaceChildren(resultKit.ui.spinner(data.labels.loading));
      try {
        const result = await ctx.api.websiteApi.listIntegrations(filter);
        if (!session.active || current !== sequence) return;
        resultKit.scope.destroy();
        resultKit = createXwfKit();
        const kit = resultKit;
        const featured = result.items.find((item) => item.featured);
        const card = (item, feature = false) => {
          const host = kit.ui.mount(XWFIntegrationCard, {
            item,
            featured: feature,
            assets: data.assets,
            labels: data.labels,
          });
          kit.scope.listen(host, 'xwf-action', () => detail(item.id));
          return host;
        };
        const children = [];
        if (featured) children.push(card(featured, true));
        if (result.items.length)
          children.push(
            h(
              'div',
              { class: 'g4 xwf-directory__grid' },
              result.items
                .filter((item) => !item.featured)
                .map((item) => card(item)),
              !filter.q &&
                filter.category === 'all' &&
                kit.ui.card(
                  h(
                    'div',
                    { class: 'stack gap12 center' },
                    kit.ui.icon('plus', { size: 'lg' }),
                    h('b', {}, data.extra.title),
                    h('p', { class: 'small sec' }, data.extra.description),
                  ),
                  { padding: 'medium' },
                ),
            ),
          );
        else
          children.push(
            kit.ui.empty({
              title: data.empty,
              illustration: assetImage(data.assets, data.assetRefs.search),
              action: { label: data.labels.clear, onClick: clear },
            }),
            h('p', { class: 'small sec center' }, data.emptyDescription),
          );
        if (result.pages > 1)
          children.push(
            kit.ui.pager(result, (page) => {
              filter.page = page;
              refresh();
            }),
          );
        results.replaceChildren(...children);
      } catch (error) {
        if (session.active && current === sequence) {
          results.replaceChildren(
            resultKit.ui.alert(
              { message: error.message },
              { variant: 'error' },
            ),
            resultKit.ui.button(data.labels.retry, { onClick: refresh }),
          );
        }
      }
    }
    el.replaceChildren(
      h(
        'section',
        { class: 'xwf-public-hero' },
        h('div', { class: 'xwf-public-hero__glow', 'aria-hidden': 'true' }),
        assetImage(
          data.assets,
          data.assetRefs.cube,
          'xwf-public-hero__art',
          true,
        ),
        h(
          'div',
          { class: 'wrap stack gap24 center xwf-public-hero__content' },
          h('span', { class: 'eyebrow' }, data.eyebrow),
          h(
            'h1',
            { class: 'h1' },
            data.heading,
            h('br'),
            h('span', { class: 'grad-text' }, data.accent),
          ),
          h('p', { class: 'lead' }, data.description),
          search,
          h('div', { class: 'xwf-directory__filters' }, groups),
        ),
      ),
      h(
        'div',
        { class: 'wrap stack gap24 xwf-public-main' },
        ui.alert({ message: data.notice }, { variant: 'info' }),
        results,
      ),
    );
    await refresh();
    return session.handle;
  },
};
