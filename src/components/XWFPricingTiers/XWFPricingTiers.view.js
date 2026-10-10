/** Pure DOM projection; all controls are XWUI basic. */
import { h } from '../../core/dom.js';
import { routeAction } from '../xwf-ui.js';
export function projectXWFPricingTiersView({ tiers }, handlers, ui) {
  return h(
    'div',
    { class: 'xwf-pricing-tiers g3' },
    tiers.map((tier) =>
      h(
        'div',
        {
          class: `xwf-pricing-tiers__tier ${tier.highlight ? 'xwf-pricing-tiers__tier--highlight' : ''}`,
          style: { '--xwf-tone': `var(--xw-${tier.tone})` },
        },
        ui.card(
          h(
            'div',
            { class: 'stack gap24' },
            h(
              'div',
              { class: 'stack gap8' },
              ui.tag(tier.tag, 'default', {
                className: `xw-tone-${tier.tone}`,
              }),
              h('h2', { class: 'h3' }, tier.name),
              h('p', { class: 'small sec' }, tier.description),
            ),
            h(
              'div',
              { class: 'rowf gap8' },
              h(
                'strong',
                {
                  class: `xwf-pricing-tiers__price ${tier.placeholder ? 'xwf-pricing-tiers__price--placeholder' : ''}`,
                },
                tier.price,
              ),
              tier.unit && h('span', { class: 'small sec' }, tier.unit),
            ),
            routeAction(
              ui,
              {
                label: tier.action,
                path: tier.path,
                variant: tier.highlight ? 'primary' : 'outline',
              },
              { size: 'lg', fullWidth: true },
            ),
            ui.list(
              tier.features.map((label, index) => ({
                id: String(index),
                label,
                icon: 'check',
              })),
            ),
            tier.note &&
              ui.tag(tier.note, 'default', { className: 'xw-tone-plan' }),
          ),
          { padding: 'large' },
        ),
      ),
    ),
  );
}
