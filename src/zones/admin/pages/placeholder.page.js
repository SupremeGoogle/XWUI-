import { ADMIN_ROUTES } from '../../../core/routes.js';
import { h } from '../../../core/dom.js';
import { pageSession, assetImage } from '../../../components/xwf-ui.js';

export default {
  id: 'admin-placeholder',
  path: ADMIN_ROUTES.section,
  layout: 'admin',
  title: 'Admin',
  async mount(el, ctx) {
    const session = pageSession(el, ctx);
    const data = await ctx.api.adminApi.getNavigation();
    if (!session.active) return session.handle;
    const item = data.groups
      .flatMap((group) => group.items)
      .find((entry) => entry.path === ctx.route.path);
    const content = data.placeholder;
    ctx.setTitle(item?.label ?? data.admin);
    el.replaceChildren(
      h(
        'div',
        { class: 'stack gap24 xwf-admin__placeholder' },
        h('h1', { class: 'h2 xwf-page-title' }, item?.label ?? data.admin),
        session.ui.empty({
          title: content.title,
          illustration: assetImage(data.assets, data.assetRefs.generic),
          action: {
            label: content.action,
            onClick: () => ctx.navigate(content.path),
          },
        }),
        h('p', { class: 'sec center' }, content.description),
      ),
    );
    return session.handle;
  },
};
