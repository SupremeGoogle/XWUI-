

/** One demo flow, five render modes and a lazily mounted notation gallery. */
import { XWUICard } from '@exonware/xwui/basic';
import { h } from '../../../../core/dom.js';

import { template } from '../../../../core/format.js';







export function renderNotationContent({ el, gallery, ui, scope, heroVisual, modeTabs, families, cards, ctx, tabs, showMode, filterFamily, viewPath }) {
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
    el.replaceChildren(
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
}
