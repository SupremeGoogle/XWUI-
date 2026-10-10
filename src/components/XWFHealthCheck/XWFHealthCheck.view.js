/** Pure DOM projection; all controls are XWUI basic. */
import { h } from '../../core/dom.js';
export function projectXWFHealthCheckView({ check, busy }, handlers, ui) {
  return h(
    'div',
    {
      class: `xwf-health-check xwf-health-check--${check.variant}`,
      style: { '--xwf-tone': `var(--xw-${check.tone})` },
      'aria-busy': String(busy),
    },
    ui.card(
      h(
        'div',
        { class: 'stack gap8' },
        h(
          'div',
          { class: 'rowf gap8' },
          h('b', {}, check.title),
          h('span', { class: 'xs ter sp' }, check.age),
        ),
        busy ? ui.spinner(check.title) : ui.status(check.status, check.variant),
        h('p', { class: 'small sec' }, check.description),
      ),
      { padding: 'medium' },
    ),
  );
}
