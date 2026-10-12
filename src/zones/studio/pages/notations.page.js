import { createNotationPreview } from './notations/preview.js';
import { renderNotationContent } from './notations/content.section.js';
import { pageSession } from '../../../components/xwf-ui.js';
import { STUDIO_ROUTES } from '../studio.routes.js';
/** One demo flow, five render modes and a lazily mounted notation gallery. */
import { XWUICard, XWUINavTabs } from '@exonware/xwui/basic';
import { h, ensureStylesheet } from '../../../core/dom.js';
import { createKit } from '../../../core/ui.js';







ensureStylesheet(
  'xwf-css-notations',
  new URL('./notations.css', import.meta.url),
);

export default {
  id: 'notations',
  path: STUDIO_ROUTES.notations,
  layout: 'website',
  async mount(el, ctx) {
    const page = pageSession(el, ctx);
    let heroKit = createKit();
    let cardsKit = createKit();
    const gallery = await ctx.api.studioApi.getNotationGallery();
    const [flow, catalog, connections] = await Promise.all([
      ctx.api.studioApi.getFlow(ctx.query.flow ?? gallery.demoFlowId),
      ctx.api.studioApi.getCatalog(),
      ctx.api.studioApi.listConnections(),
    ]);
    if (!page.active) return page.handle;
    const STUDIO_COPY = catalog.copy;
    ctx.setTitle(gallery.hero.title);
    const typeIndex = Object.fromEntries(
      catalog.nodeTypes.map((type) => [type.id, type]),
    );
    const { scope, ui } = page;
    const heroVisual = h('div', { class: 'notations-hero__visual' });
    const cards = h('div', { class: 'g3 notations-grid' });
    const pending = new Map();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          observer.unobserve(entry.target);
          pending.get(entry.target)?.();
          pending.delete(entry.target);
        }
      },
      { rootMargin: '240px' },
    );
    scope.onDispose(() => {
      observer.disconnect();
      pending.clear();
      heroKit.scope.destroy();
      cardsKit.scope.destroy();
    });

    const preview = createNotationPreview({ flow, typeIndex, STUDIO_COPY, gallery, connections, catalog });

    function showMode(mode) {
      heroKit.scope.destroy();
      heroKit = createKit();
      heroVisual.replaceChildren();
      heroVisual.dataset.mode = mode;
      if (mode === '3d') {
        const layers = h('div', { class: 'layers' });
        gallery.hero.layers.forEach((notation, index) => {
          const item = gallery.items.find(
            (entry) => entry.preview === notation,
          );
          const layer = h('div', {
            class: 'lay',
            style: {
              '--z': `${(2 - index) * 150}px`,
              '--lc': `var(--xw-${['lime', 'orange', 'cyan'][index]})`,
            },
          });
          const inner = h('div', {
            class: 'lay__preview',
            'aria-hidden': 'true',
          });
          layer.append(inner);
          layers.append(layer);
          preview(inner, notation, heroKit);
          layers.append(
            h(
              'span',
              {
                class: 'laylbl',
                style: {
                  '--lc': `var(--xw-${['lime', 'orange', 'cyan'][index]})`,
                  top: `${100 + index * 130}px`,
                  right: `${12 - index * 3}%`,
                },
              },
              item?.name,
            ),
          );
        });
        heroVisual.append(layers);
      } else {
        const stage = h('div', { class: 'glass notations-hero__stage' });
        heroVisual.append(stage);
        preview(stage, mode === 'canvas' ? 'editor' : mode, heroKit, false);
      }
    }

    const viewPath = (view) =>
      view === 'editor'
        ? ctx.href(STUDIO_ROUTES.editor, { flowId: flow.id }).slice(1)
        : view === 'receipt'
          ? ctx.href(STUDIO_ROUTES.run, { runId: flow.lastRun?.id }).slice(1)
          : ctx.href(STUDIO_ROUTES.view, { flowId: flow.id, notation: view }).slice(1);
    function filterFamily(family) {
      observer.disconnect();
      pending.clear();
      cardsKit.scope.destroy();
      cardsKit = createKit();
      cards.replaceChildren();
      gallery.items
        .filter((item) => family === 'all' || item.family === family)
        .forEach((item) => {
          const host = h('article', {
            class: 'nc',
            dataset: { notationId: item.id },
          });
          const visual = h('div', { class: 'dg', 'aria-hidden': 'true' });
          const body = h(
            'div',
            { class: 'nc__body stack gap12' },
            visual,
            h(
              'div',
              { class: 'rowf gap8' },
              h('h3', {}, item.name),
              cardsKit.ui.tag(item.dims, 'default', { className: 'sp' }),
            ),
            h('span', { class: 'std' }, item.standard),
            h('p', { class: 'small sec' }, item.body),
            h(
              'div',
              { class: 'wrapf gap8 nc__tags' },
              item.tags.map((tag) => cardsKit.ui.tag(tag)),
              item.view && (item.view !== 'receipt' || flow.lastRun)
                ? cardsKit.ui.button(gallery.openView, {
                    variant: 'ghost',
                    size: 'sm',
                    icon: 'arrow-up-right',
                    className: 'sp',
                    onClick: () => ctx.navigate(viewPath(item.view)),
                  })
                : cardsKit.ui.tag(gallery.hero.conceptTag, 'default', {
                    className: 'xw-tone-plan sp',
                  }),
            ),
          );
          cardsKit.scope.mount(XWUICard, host, { body }, { padding: 'none' });
          cards.append(host);
          pending.set(visual, () => preview(visual, item.preview, cardsKit));
          observer.observe(visual);
        });
    }

    const modeTabs = h('div', { class: 'seg notations-tabs' });
    const tabs = scope.mount(
      XWUINavTabs,
      modeTabs,
      {
        tabs: gallery.modes.map(({ id, label }) => ({ id, label })),
        activeTab: gallery.modes[0].id,
      },
      {
        variant: 'button',
        size: 'sm',
        hideContent: true,
        ariaLabel: gallery.modesTitle.eyebrow,
      },
    );
    tabs.onChange((id) => showMode(id?.id ?? id));
    const families = h('div', { class: 'notations-tabs' });
    scope
      .mount(
        XWUINavTabs,
        families,
        { tabs: gallery.families, activeTab: 'all' },
        {
          variant: 'button',
          size: 'sm',
          hideContent: true,
          ariaLabel: gallery.galleryTitle.eyebrow,
        },
      )
      .onChange((id) => filterFamily(id?.id ?? id));
    renderNotationContent({ el, gallery, ui, scope, heroVisual, modeTabs, families, cards, ctx, tabs, showMode, filterFamily, viewPath });
    return { unmount: () => scope.destroy() };
  },
};
