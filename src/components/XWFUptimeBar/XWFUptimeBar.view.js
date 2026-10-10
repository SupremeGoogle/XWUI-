/** Pure DOM projection; all controls are XWUI basic. */
import { h } from '../../core/dom.js';
export function projectXWFUptimeBarView({ rows, legend }, handlers, ui) {
  return h(
    'div',
    { class: 'xwf-uptime-bar stack gap12' },
    rows.map((row) =>
      h(
        'div',
        { class: 'rowf gap12' },
        h('span', { class: 'small b xwf-uptime-bar__label' }, row.label),
        h(
          'div',
          {
            class: 'xwf-uptime-bar__days',
            role: 'img',
            'aria-label': `${row.label}: ${row.days.map((day, index) => `${index + 1} ${legend.find((item) => item.variant === day)?.label ?? day}`).join(', ')}`,
          },
          row.days.map((day, index) =>
            h('i', {
              class: `xwf-uptime-bar__day--${day}`,
              title: `${index + 1}: ${legend.find((item) => item.variant === day)?.label ?? day}`,
            }),
          ),
        ),
      ),
    ),
    h(
      'div',
      { class: 'rowf gap16 wrapf' },
      legend.map((item) => ui.status(item.label, item.variant)),
    ),
  );
}
