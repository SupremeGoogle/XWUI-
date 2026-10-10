/**
 * #/dev/components - a living sample of the custom components and the themed XWUI basics,
 * used while building to check them in isolation.
 */
import { h } from '../../../core/dom.js';
import { createKit } from '../../../core/ui.js';
import { XWFTemplate } from '../../../components/_template/XWFTemplate.js';
import { PLAYGROUND_SAMPLE } from './playground.data.js';

export default {
  id: 'dev-components',
  path: '/dev/components',
  layout: null,
  title: PLAYGROUND_SAMPLE.title,
  async mount(el, ctx) {
    const { scope, ui } = createKit();
    const templateHost = h('div');
    const log = h('p', { class: 'small sec' });
    el.append(h('main', { class: 'pg wrap' },
      h('h1', { class: 'h2' }, PLAYGROUND_SAMPLE.title),
      h('div', { class: 'rowf gap12 wrapf' },
        PLAYGROUND_SAMPLE.buttons.map((b) => ui.button(b.text, { ...b.conf, onClick: () => ctx.notify.success(b.text) }))),
      h('div', { class: 'rowf gap8 wrapf' }, PLAYGROUND_SAMPLE.tags.map((t) => ui.tag(t.label, t.variant))),
      h('div', { style: { maxWidth: '360px' } }, templateHost),
      log));
    const template = scope.mount(XWFTemplate, templateHost, PLAYGROUND_SAMPLE.template, { variant: 'glass' });
    scope.listen(templateHost, 'xwf-select', (e) => { log.textContent = JSON.stringify(e.detail.item); });
    void template;
    return { unmount: () => scope.destroy() };
  },
};
