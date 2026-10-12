import { h } from '../../../../core/dom.js';
import { routeAction, titleBlock, assetImage } from '../../../../components/xwf-ui.js';

export function createBrandingSection({ data, ctx, session, ui, scope }) {
    const white = data.whiteLabel;
    const whiteLabel = h(
      'section',
      { class: 'band' },
      h(
        'div',
        { class: 'wrap wrapf gap48 xwf-landing__split' },
        h(
          'div',
          { class: 'stack gap24 xwf-landing__white-copy' },
          titleBlock(white),
          h(
            'div',
            { class: 'stack gap12' },
            white.features.map((label) =>
              h(
                'div',
                { class: 'rowf gap12' },
                ui.icon('check', { color: 'var(--xw-lime)' }),
                h('span', { class: 'grow' }, label),
                ui.tag(data.labels.planned, 'default', {
                  className: 'xw-tone-plan',
                }),
              ),
            ),
          ),
          routeAction(ui, { label: white.action, path: white.path }),
        ),
        h(
          'div',
          { class: 'xwf-landing__fan' },
          white.brands.map((brand, index) =>
            h(
              'div',
              {
                class: 'xwf-landing__brand-card',
                style: {
                  '--xwf-tone': `var(--xw-${brand.tone})`,
                  '--xwf-card-index': index,
                },
              },
              ui.card(
                h(
                  'div',
                  { class: 'stack gap16' },
                  h(
                    'div',
                    { class: 'rowf gap8' },
                    assetImage(
                      data.assets,
                      data.assetRefs.samples[index].logo,
                      'xwf-landing__sample-logo',
                      true,
                    ),
                    h('b', { class: 'disp' }, brand.name),
                  ),
                  h('div', { class: 'xwf-landing__brand-surface' }),
                  h(
                    'div',
                    { class: 'rowf gap8' },
                    ui.button(white.run, {
                      size: 'sm',
                      gradient: `var(--xw-${brand.tone})`,
                      onClick: () => ctx.navigate(data.brandingPath),
                    }),
                    ui.tag(white.published, 'default', {
                      className: `xw-tone-${brand.tone}`,
                    }),
                  ),
                  index === 1 && h('p', { class: 'xs sec' }, white.note),
                ),
                { padding: 'medium' },
              ),
            ),
          ),
        ),
      ),
    );
  return whiteLabel;
}
