import { h } from '../../../../core/dom.js';
import { routeAction, titleBlock } from '../../../../components/xwf-ui.js';

export function createResourcesSection({ data, ctx, session, ui, scope }) {
    const notations = h(
      'section',
      { class: 'band xwf-landing__notations' },
      h(
        'div',
        { class: 'wrap' },
        ui.card(
          h(
            'div',
            { class: 'wrapf gap48 xwf-landing__split' },
            h(
              'div',
              { class: 'stack gap24 xwf-landing__half' },
              titleBlock(data.notations),
              h(
                'div',
                { class: 'wrapf gap12' },
                data.notations.actions.map((action) => routeAction(ui, action)),
              ),
            ),
            h(
              'div',
              { class: 'wrapf gap8 xwf-landing__half' },
              data.notationItems.map((item) =>
                item.path
                  ? routeAction(
                      ui,
                      {
                        label: item.label,
                        path: item.path,
                        variant: 'secondary',
                      },
                      { size: 'sm' },
                    )
                  : ui.tag(item.label, 'default', {
                      className: `xw-tone-${item.tone}`,
                    }),
              ),
            ),
          ),
        ),
      ),
    );
    const migration = h(
      'section',
      { id: 'compat', class: 'band' },
      h(
        'div',
        { class: 'wrap stack gap48' },
        titleBlock(data.migration),
        h(
          'div',
          { class: 'g4' },
          data.dialects.map((dialect) =>
            ui.card(
              h(
                'div',
                { class: 'stack gap12' },
                h(
                  'span',
                  {
                    class: 'xwf-landing__monogram',
                    style: { '--xwf-tone': `var(--xw-${dialect.tone})` },
                  },
                  dialect.initials,
                ),
                h('b', {}, dialect.name),
                h(
                  'span',
                  { class: 'xs sec' },
                  data.migration.depth,
                  ' ',
                  ui.tag(dialect.depth, 'default', {
                    className: 'xw-tone-plan',
                  }),
                ),
              ),
              { padding: 'medium' },
            ),
          ),
        ),
      ),
    );
    const cta = h(
      'section',
      { class: 'band' },
      h(
        'div',
        { class: 'wrap' },
        ui.card(
          h(
            'div',
            { class: 'xwf-landing__cta stack gap24' },
            h('div', {
              class: 'ring xwf-landing__cta-ring',
              'aria-hidden': 'true',
            }),
            titleBlock(data.cta),
            h(
              'div',
              { class: 'wrapf gap12' },
              data.cta.actions.map((action) =>
                routeAction(ui, action, { size: 'lg' }),
              ),
            ),
          ),
          { className: 'gb' },
        ),
      ),
    );
    const r = data.resources;
    const comparisonDetail = h('div', { class: 'stack gap16' });
    const renderComparison = (id) =>
      comparisonDetail.replaceChildren(
        h('h3', { class: 'h3' }, `${data.comparisonPrefix} ${id}`),
        h('p', { class: 'small sec' }, r.comparison.text),
        ui.list(r.comparison.features),
      );
    const selected = r.comparison.names.includes(ctx.query.compare)
      ? ctx.query.compare
      : r.comparison.names[0];
    renderComparison(selected);
    const resources = h(
      'section',
      { class: 'band tight' },
      h(
        'div',
        { class: 'wrap stack gap32' },
        h(
          'section',
          { id: 'c', class: 'stack gap16' },
          h('h2', { class: 'h3' }, r.comparison.title),
          ui.tabs(
            r.comparison.names.map((name) => ({ id: name, label: name })),
            selected,
            renderComparison,
          ),
          comparisonDetail,
          routeAction(ui, {
            label: r.comparison.action,
            path: r.comparison.path,
          }),
        ),
        h(
          'div',
          { class: 'g2' },
          h(
            'section',
            { id: 't' },
            ui.card(
              h(
                'div',
                { class: 'stack gap12' },
                h('h2', { class: 'h3' }, r.templates.title),
                r.templates.items.map((item) => routeAction(ui, item)),
              ),
            ),
          ),
          h(
            'section',
            { id: 's' },
            ui.card(
              h(
                'div',
                { class: 'stack gap12' },
                h('h2', { class: 'h3' }, r.capabilities.title),
                r.capabilities.items.map((item) =>
                  h(
                    'div',
                    { class: 'rowf gap12' },
                    h('span', { class: 'grow' }, item.label),
                    ui.status(item.status, item.variant),
                  ),
                ),
              ),
            ),
          ),
        ),
        h(
          'div',
          { class: 'g2' },
          [r.docs, r.security].map((item, index) =>
            h(
              'section',
              { id: index ? 'sec' : 'docs' },
              ui.card(
                h(
                  'div',
                  { class: 'stack gap16' },
                  h('h2', { class: 'h3' }, item.title),
                  h('p', { class: 'small sec' }, item.text),
                  routeAction(ui, { label: item.action, path: item.path }),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  return [notations, migration, cta, resources];
}
