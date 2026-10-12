import { WEBSITE_ROUTES } from '../../../core/routes.js';
import { XWUINavSidebar } from '@exonware/xwui/basic';
import { h, ensureStylesheet } from '../../../core/dom.js';
import {
  createXwfKit,
  assetImage,
  routeAction,
} from '../../../components/xwf-ui.js';

export class AdminLayout {
  constructor(root, ctx) {
    ensureStylesheet(
      'xwf-admin-css',
      new URL('../pages/admin.css', import.meta.url),
    );
    this.ctx = ctx;
    this.kit = createXwfKit();
    this.disposed = false;
    this.rail = h('div', { class: 'xwf-admin__rail' });
    this.topbar = h('div', { class: 'topb' });
    this.content = h('main', { class: 'pg xwf-admin__outlet' });
    this.shell = h(
      'div',
      { class: 'xwf-admin' },
      this.rail,
      h('div', { class: 'xwf-admin__main' }, this.topbar, this.content),
    );
    root.replaceChildren(this.shell);
    this.ctx.api.adminApi
      .getNavigation()
      .then((data) => {
        if (this.disposed) return;
        this.data = data;
        this.renderRail();
        this.setActive(this.route ?? ctx.route);
      })
      .catch((error) => {
        if (!this.disposed) ctx.notify.error(error.message);
      });
  }
  get outlet() {
    return this.content;
  }
  renderRail() {
    const { ui } = this.kit;
    const data = this.data;
    const header = h(
      'div',
      { class: 'rowf gap8' },
      h(
        'a',
        { class: 'brand xwf-admin__brand', href: `#${data.home}` },
        assetImage(data.assets, data.assetRefs.mark, 'xwf-brand-mark', true),
        data.brand,
      ),
      ui.tag(data.admin, 'default', { className: 'xw-tone-violet' }),
    );
    // Navigation is built by the basic sidebar/menu, including grouping and native links.
    const items = data.groups.flatMap((group) => [
      {
        id: `group-${group.label}`,
        label: group.label,
        type: 'group',
        disabled: true,
      },
      ...group.items.map((item) => ({ ...item, href: `#${item.path}` })),
    ]);
    this.sidebar = this.kit.scope.mount(
      XWUINavSidebar,
      this.rail,
      {
        header,
        items,
        footer: routeAction(ui, data.back, {
          icon: data.back.icon,
          size: 'sm',
          fullWidth: true,
        }),
      },
      {
        width: '232px',
        className: 'xwf-admin-sidebar',
        menu: { mode: 'vertical', size: 'sm' },
      },
    );
  }
  setActive(route) {
    this.route = route;
    if (!this.data) return;
    const item = this.data.groups
      .flatMap((group) => group.items)
      .find((entry) => entry.path === route.path);
    this.sidebar?.setSelected(item?.id ?? '');
    this.barKit?.scope.destroy();
    this.barKit = createXwfKit();
    const { ui } = this.barKit;
    const group = route.path.startsWith('/system')
      ? this.data.system
      : this.data.admin;
    this.topbar.replaceChildren(
      h(
        'div',
        { class: 'crumb' },
        h('span', {}, group),
        h('span', {}, WEBSITE_ROUTES.home),
        h('b', {}, item?.label ?? route.page.title),
      ),
      h(
        'div',
        { class: 'rowf gap8 sp' },
        ui.tag(this.data.sample, 'default', { className: 'xw-tone-plan' }),
        ui.tag(this.data.tenant),
        assetImage(
          this.data.assets,
          this.data.assetRefs.avatar,
          'xwf-admin__avatar',
        ),
      ),
    );
  }
  destroy() {
    this.disposed = true;
    this.barKit?.scope.destroy();
    this.kit.scope.destroy();
    this.shell.remove();
  }
}
