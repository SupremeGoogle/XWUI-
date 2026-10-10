/** XWFStatus - view. */
import { h } from '../../core/dom.js';
import { XWF_STATUS_SR } from './XWFStatus.model.js';

export function projectXWFStatusView({ label, kind, size, className }) {
  return h('span', { class: ['xwf-status', `xwf-status--${kind}`, `xwf-status--${size}`, className], role: 'status' },
    h('i', { class: 'xwf-status__mark', 'aria-hidden': 'true' }),
    h('span', { class: 'visually-hidden' }, `${XWF_STATUS_SR[kind]}: `),
    h('span', { class: 'xwf-status__label' }, label));
}
