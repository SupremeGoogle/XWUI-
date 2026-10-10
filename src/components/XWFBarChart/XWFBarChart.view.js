/** Pure DOM projection; all controls are XWUI basic. */
import { h } from '../../core/dom.js';
import { BAR_GEOMETRY } from './XWFBarChart.model.js';
export function projectXWFBarChartView({ chart, uid }, handlers, ui) {
 const g = BAR_GEOMETRY;
 const max = Math.max(1, ...chart.hours.map((hour) => hour.succeeded + hour.failed));
 const step = g.width / chart.hours.length;
 return h('div', { class: 'xwf-bar-chart stack gap12' },
   h('div', { class: 'rowf gap16 wrapf' }, h('h2', { class: 'h3' }, chart.title), ui.status(chart.succeeded, 'info'), ui.status(chart.failed, 'error'), h('span', { class: 'xs ter sp' }, chart.period)),
   h('svg', { viewBox: `0 0 ${g.width} ${g.height}`, role: 'img', 'aria-label': chart.ariaLabel },
     h('defs', {}, h('linearGradient', { id: `${uid}-bars`, x1: '0', x2: '0', y1: '0', y2: '1' }, h('stop', { offset: '0', 'stop-color': 'var(--xw-cyan)' }), h('stop', { offset: '1', 'stop-color': 'var(--xw-violet)', 'stop-opacity': '.4' }))),
     chart.hours.map((hour, index) => { const successHeight = hour.succeeded / max * g.plotHeight; const failedHeight = Math.max(g.minimumFailureHeight, hour.failed / max * g.plotHeight); return h('g', { opacity: hour.partial ? g.partialOpacity : 1 },
       h('title', {}, `${hour.hour}: ${chart.succeeded} ${hour.succeeded}, ${chart.failed} ${hour.failed}`),
       h('rect', { x: index * step + g.gap / 2, y: g.plotHeight - successHeight, width: step - g.gap, height: successHeight, rx: g.radius, fill: `url(#${uid}-bars)` }),
       h('rect', { x: index * step + g.gap / 2, y: g.plotHeight - successHeight - failedHeight - g.stackGap, width: step - g.gap, height: failedHeight, rx: g.radius, fill: 'var(--xw-red)' })); })),
   h('div', { class: 'rowf xs ter' }, chart.start, h('span', { class: 'sp' }, chart.end)));
}
