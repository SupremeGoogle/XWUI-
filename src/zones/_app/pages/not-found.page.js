import { APP_ROUTES } from '../../../core/routes.js';
import { WEBSITE_ROUTES } from '../../../core/routes.js';
import { h } from '../../../core/dom.js';
import { createKit } from '../../../core/ui.js';
import { UI_CONFIG } from '../../../core/ui.config.js';

export default {
  id: 'not-found',
  path: APP_ROUTES.notFound,
  layout: null,
  title: UI_CONFIG.messages.notFoundTitle,
  async mount(el, ctx) {
    const { scope, ui } = createKit();
    el.append(h('main', { class: 'pg xw-not-found' },
      ui.empty({
        title: UI_CONFIG.messages.notFoundTitle,
        description: UI_CONFIG.messages.notFoundBody,
        icon: 'compass',
        action: { label: UI_CONFIG.messages.notFoundAction, onClick: () => ctx.navigate(WEBSITE_ROUTES.home) },
      })));
    return { unmount: () => scope.destroy() };
  },
};
