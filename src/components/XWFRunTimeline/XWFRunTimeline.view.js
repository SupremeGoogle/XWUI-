/** XWFRunTimeline - view. */
import { h } from '../../core/dom.js';

export function projectXWFRunTimelineView({ rows, startLabel, endLabel, labelWidth, minBarPx, selectable }, { onSelect }) {
  return h('div', { class: 'xwf-run-timeline' },
    h('div', { class: 'xwf-run-timeline__axis xs ter', style: { '--xwf-axis-offset': `${labelWidth + 16}px` } },
      h('span', {}, startLabel), h('span', { class: 'sp' }, endLabel)),
    h('div', { class: 'xwf-run-timeline__grid', style: { '--xwf-timeline-columns': `${labelWidth}px 1fr` } },
      rows.map((row) => {
        const clickable = selectable && row.hasBar;
        return [
          h('b', { class: ['xwf-run-timeline__label', { 'is-muted': row.tone === 'muted' && !row.hasBar }] }, row.label),
          h('div', {
            class: ['xwf-run-timeline__track', { 'is-selected': row.selected, 'is-clickable': clickable }],
            role: clickable ? 'button' : null,
            tabindex: clickable ? '0' : null,
            'aria-label': clickable ? `${row.label}: ${row.note ?? ''}` : null,
            onClick: clickable ? () => onSelect(row.id) : null,
            onKeydown: clickable ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(row.id); } } : null,
          },
          row.hasBar && h('i', { class: `xwf-run-timeline__bar xwf-run-timeline__bar--${row.tone}`, style: { left: `${row.left}%`, width: `${row.width}%`, minWidth: `${minBarPx}px` } }),
          row.note && h('span', { class: 'xwf-run-timeline__note', style: { left: `${row.captionLeft}%` } }, row.note)),
        ];
      })));
}
