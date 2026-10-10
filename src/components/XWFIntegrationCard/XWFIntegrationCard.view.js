/** Pure DOM projection; all controls are XWUI basic. */
import { h } from '../../core/dom.js';
import { assetImage } from '../xwf-ui.js';
export function projectXWFIntegrationCardView(
  { item, assets, labels, featured },
  handlers,
  ui,
) {
  const content = h(
    'div',
    { class: featured ? 'rowf gap24 wrapf' : 'stack gap12' },
    assetImage(assets, item.assetId, 'xwf-integration-card__icon', true) ??
      ui.icon(item.icon, { size: 'lg' }),
    h(
      'div',
      { class: 'stack gap8 grow' },
      featured &&
        h(
          'div',
          { class: 'rowf gap8' },
          ui.tag(labels.featured, 'default', { className: 'xw-tone-pink' }),
          ui.tag(item.categoryLabel),
        ),
      h(featured ? 'h2' : 'h3', { class: featured ? 'h3' : 'h4' }, item.name),
      !featured &&
        h(
          'div',
          { class: 'xs', style: { color: `var(--xw-${item.tone})` } },
          item.categoryLabel,
        ),
      h('p', { class: featured ? 'sec' : 'small sec' }, item.description),
    ),
    featured &&
      ui.button(labels.view, {
        variant: 'outline',
        onClick: () => handlers.onAction({ id: item.id }),
      }),
  );
  return h(
    'div',
    {
      class: `xwf-integration-card ${featured ? 'xwf-integration-card--featured' : ''}`,
      style: { '--xwf-tone': `var(--xw-${item.tone})` },
    },
    ui.card(content, {
      padding: featured ? 'large' : 'medium',
      clickable: true,
      hoverable: true,
      ariaLabel: item.name,
      onClick: () => handlers.onAction({ id: item.id }),
    }),
  );
}
