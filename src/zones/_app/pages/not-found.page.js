import { h } from '../../../core/dom.js';
import { createKit } from '../../../core/ui.js';
import { UI_CONFIG } from '../../../core/ui.config.js';

export default {
  id: 'not-found',
  path: '/__not-found__',
  layout: null,
  title: UI_CONFIG.messages.notFoundTitle,
  async mount(el, ctx) {
    const { scope, ui } = createKit();
    el.append(h('main', { class: 'pg xw-not-found' },
      ui.empty({
        title: UI_CONFIG.messages.notFoundTitle,
        description: UI_CONFIG.messages.notFoundBody,
        icon: 'explore',
        action: { label: UI_CONFIG.messages.notFoundAction, onClick: () => ctx.navigate('/') },
      })));
    return { unmount: () => scope.destroy() };
  },
};
