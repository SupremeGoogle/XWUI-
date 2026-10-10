/** XWFBarSpark - view. */
import { h } from '../../core/dom.js';

export function projectXWFBarSparkView({ bars, ariaLabel, height, gap, className }) {
  return h('div', {
    class: ['xwf-bar-spark', className],
    role: 'img',
    'aria-label': ariaLabel,
    style: { height: `${height}px`, gap: `${gap}px` },
  }, bars.map((b) => h('i', {
    class: ['xwf-bar-spark__bar', { 'is-flagged': b.flagged, 'is-partial': b.partial }],
    style: { height: `${b.percent}%` },
    title: b.label ? `${b.label}: ${b.value}` : String(b.value),
  })));
}
