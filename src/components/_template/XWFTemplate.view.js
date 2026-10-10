/**
 * XWFTemplate - view.
 * Projects state to DOM. Receives everything it needs (state, handlers, the ui kit for
 * XWUI children); never fetches, never mutates state directly.
 */
import { h } from '../../core/dom.js';

/**
 * @param {{ title: string, items: ReturnType<import('./XWFTemplate.logic.js').deriveXWFTemplateItems>, config: object }} state
 * @param {{ onActivate: (id: string) => void }} handlers
 * @param {ReturnType<import('../../core/ui.js').createUi>} ui
 */
export function projectXWFTemplateView(state, handlers, ui) {
  const { title, items, config } = state;
  return h('section', { class: ['xwf-template', `xwf-template--${config.variant}`, config.className] },
    title && h('h3', { class: 'xwf-template__title h4' }, title),
    h('ul', { class: 'xwf-template__list', role: config.selectable ? 'listbox' : 'list' },
      items.map((item) => h('li', {
        class: ['xwf-template__item', { 'is-selected': item.selected }],
        style: { '--xwf-tone': `var(--xw-${item.tone})` },
        role: config.selectable ? 'option' : 'listitem',
        'aria-selected': config.selectable ? String(item.selected) : null,
        tabindex: config.selectable ? '0' : null,
        onClick: config.selectable ? () => handlers.onActivate(item.id) : null,
        onKeydown: config.selectable ? (e) => {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handlers.onActivate(item.id); }
        } : null,
      },
      h('span', { class: 'xwf-template__dot', 'aria-hidden': 'true' }),
      h('span', { class: 'xwf-template__label' }, item.label),
      item.hint && ui.tag(item.hint, item.selected ? 'primary' : 'default')))));
}
