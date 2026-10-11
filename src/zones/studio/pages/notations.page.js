/** One demo flow, five render modes and a lazily mounted notation gallery. */
import { XWUICard, XWUINavTabs, XWUICodeBlock } from '@exonware/xwui/basic';
import { h, ensureStylesheet } from '../../../core/dom.js';
import { createKit } from '../../../core/ui.js';
import { template, formatDuration } from '../../../core/format.js';
import { XWFFlowDiagram } from '../../../components/XWFFlowDiagram/XWFFlowDiagram.js';
import {
  flowToMermaid,
  flowToList,
} from '../../../components/XWFFlowDiagram/XWFFlowDiagram.logic.js';
import { XWFFlowCanvas } from '../../../components/XWFFlowCanvas/XWFFlowCanvas.js';
import { XWFRunTimeline } from '../../../components/XWFRunTimeline/XWFRunTimeline.js';
import { timelineRows } from './run.page.js';

ensureStylesheet(
  'xwf-css-notations',
  new URL('./notations.css', import.meta.url),
);

export default {
  id: 'notations',
  path: '/notations',
  layout: 'website',
  async mount(el, ctx) {
    const page = createKit();
    let heroKit = createKit();
    let cardsKit = createKit();
    const gallery = await ctx.api.studioApi.getNotationGallery();
    const [flow, catalog, connections] = await Promise.all([
      ctx.api.studioApi.getFlow(ctx.query.flow ?? gallery.demoFlowId),
      ctx.api.studioApi.getCatalog(),
      ctx.api.studioApi.listConnections(),
    ]);
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

    function preview(host, notation, kit, thumbnail = true) {
      host.inert = thumbnail;
      if (notation === 'editor') {
        kit.scope.mount(
          XWFFlowCanvas,
          host,
          {
            graph: flow.graph,
            nodeTypes: typeIndex,
            nodeStates: {},
            portLabels: STUDIO_COPY.editor.ports,
            labels: STUDIO_COPY.editor.tools,
          },
          { readOnly: true, showTools: false, showMinimap: false },
        );
      } else if (notation === 'code') {
        kit.scope.mount(
          XWUICodeBlock,
          host,
          { code: flowToMermaid(flow.graph, typeIndex) },
          {
            language: 'text',
            copyable: false,
            upgradeToEditor: false,
          },
        );
      } else if (notation === 'list') {
        host.append(
          h(
            'ol',
            { class: 'listv' },
            flowToList(flow.graph, typeIndex).map((row) =>
              h(
                'li',
                { class: { ind: row.indent > 0 } },
                h('span', { class: 'mono sec' }, row.port ?? row.n),
                h('b', {}, row.name),
                h(
                  'span',
                  { class: 'xs sec' },
                  row.goTo
                    ? template(gallery.listCopy.goTo, { n: row.goTo })
                    : row.detail,
                ),
              ),
            ),
          ),
        );
      } else if (notation === 'timeline' && flow.lastRun) {
        const run = flow.lastRun;
        const total =
          run.durationMs ??
          Math.max(
            1,
            ...run.ledger.map(
              (row) => (row.offsetMs ?? 0) + (row.durationMs ?? 0),
            ),
          );
        kit.scope.mount(XWFRunTimeline, host, {
          rows: timelineRows(run, STUDIO_COPY.run),
          totalMs: total,
          startLabel: formatDuration(0),
          endLabel: formatDuration(total),
        });
      } else {
        kit.scope.mount(
          XWFFlowDiagram,
          host,
          {
            flow,
            nodeTypes: typeIndex,
            run: flow.lastRun,
            connections,
            lanes: catalog.lanes,
            labels: STUDIO_COPY.views.diagram,
          },
          { notation, thumbnail, animate: false },
        );
      }
    }

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
        ? `/studio/flows/${flow.id}`
        : view === 'receipt'
          ? `/studio/runs/${flow.lastRun?.id}`
          : `/studio/flows/${flow.id}/view/${view}`;
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
    const title = (copy) =>
      h(
        'div',
        { class: 'stack gap8' },
        h('span', { class: 'eyebrow' }, copy.eyebrow),
        h(
          'h2',
          { class: 'h2' },
          copy.title,
          ' ',
          h('span', { class: 'grad-text' }, copy.accent),
          copy.after && ` ${copy.after}`,
        ),
      );
    const modes = h(
      'div',
      { class: 'notations-modes' },
      gallery.modes.map((mode) => {
        const host = h('div', { class: 'mode' });
        scope.mount(
          XWUICard,
          host,
          {
            body: h(
              'div',
              { class: 'stack gap12' },
              ui.icon(mode.icon, { size: 'lg' }),
              ui.button(mode.label, {
                variant: 'ghost',
                onClick: () => { tabs.setActiveTab(mode.id); showMode(mode.id); },
              }),
              h('p', { class: 'small sec' }, mode.body),
            ),
          },
          { padding: 'none' },
        );
        return host;
      }),
    );
    el.append(
      h(
        'div',
        { class: 'notations-page', dir: 'ltr' },
        h(
          'section',
          { class: 'notations-hero' },
          h(
            'div',
            { class: 'wrap stack gap24 center' },
            h(
              'div',
              { class: 'rowf gap8' },
              ui.tag(gallery.hero.eyebrow, 'primary'),
              ui.tag(
                template(gallery.hero.countTag, { n: gallery.items.length }),
                'default',
                { className: 'xw-tone-violet' },
              ),
              ui.tag(gallery.hero.conceptTag, 'default', {
                className: 'xw-tone-plan',
              }),
            ),
            h(
              'h1',
              { class: 'h-mega' },
              gallery.hero.title,
              h('br'),
              h('span', { class: 'grad-text' }, gallery.hero.accent),
            ),
            h('p', { class: 'lead' }, gallery.hero.body),
            modeTabs,
          ),
          heroVisual,
        ),
        h(
          'section',
          { class: 'band tight' },
          h(
            'div',
            { class: 'wrap stack gap24' },
            title(gallery.modesTitle),
            modes,
          ),
        ),
        h(
          'section',
          { class: 'band' },
          h(
            'div',
            { class: 'wrap stack gap32' },
            h(
              'div',
              { class: 'wrapf gap24 notations-gallery__head' },
              title(gallery.galleryTitle),
              families,
            ),
            cards,
          ),
        ),
        h(
          'section',
          { class: 'band' },
          h(
            'div',
            { class: 'wrap glass pad center stack gap24' },
            h(
              'h2',
              { class: 'h2' },
              gallery.cta.title,
              ' ',
              h('span', { class: 'grad-text' }, gallery.cta.accent),
            ),
            h('p', { class: 'lead' }, gallery.cta.body),
            h(
              'div',
              { class: 'wrapf gap12' },
              ui.button(gallery.cta.primary.label, {
                variant: 'primary',
                size: 'lg',
                onClick: () => ctx.navigate(viewPath(gallery.cta.primary.view)),
              }),
              ui.button(gallery.cta.secondary.label, {
                variant: 'secondary',
                size: 'lg',
                onClick: () =>
                  ctx.navigate(
                    `${gallery.cta.secondary.path}?section=${gallery.cta.secondary.section}`,
                  ),
              }),
            ),
          ),
        ),
      ),
    );
    showMode(gallery.modes[0].id);
    filterFamily('all');
    return { unmount: () => scope.destroy() };
  },
};
