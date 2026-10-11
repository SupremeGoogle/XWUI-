/**
 * Studio shell: XWUINavSidebar rail (brand, search, create, nav, chats, usage meter)
 * plus a top bar whose breadcrumbs and actions each page sets through setTopbar().
 */
import {
  XWUINavSidebar, XWUIInputText, XWUIProgressBar, XWUINavBreadcrumbs, XWUIDisplayAvatar, XWUINavMenuDropdown, XWUIDisplayKbd,
} from '@exonware/xwui/basic';
import { h, ensureStylesheet } from '../../../core/dom.js';
import { createKit } from '../../../core/ui.js';
import { template, formatNumber, formatDateTime } from '../../../core/format.js';
import { openStudioSearch } from './studio-search.js';
import { STUDIO_LAYOUT_ID, studioRouteToNavId } from '../studio.routes.js';

ensureStylesheet('xwf-css-studio', new URL('../studio.css', import.meta.url));

const RAIL_STATE_KEY = 'xwflow:studio-rail-collapsed';
/** Below this width the rail shows icons only, whatever was saved. */
const COMPACT_RAIL_QUERY = '(max-width: 900px)';

export class StudioLayout {
  constructor(root, ctx) {
    this.ctx = ctx;
    this.kit = createKit();
    this.topKit = createKit();
    this.shell = null;
    this.disposed = false;
    this.sidebar = null;

    this.railHost = h('div', { class: 'studio-rail' });
    this.crumbsHost = h('div', { class: 'studio-topbar__crumbs' });
    this.topActions = h('div', { class: 'studio-topbar__actions' });
    this.topEnd = h('div', { class: 'studio-topbar__end' });
    this.outlet = h('div', { class: 'studio-outlet' });
    this.root = h('div', { class: 'xw app studio-shell' },
      this.railHost,
      h('div', { class: 'main studio-main' },
        h('header', { class: 'topb studio-topbar' }, this.crumbsHost, h('div', { class: 'rowf gap12 sp' }, this.topActions, this.topEnd)),
        this.outlet));
    root.append(this.root);

    this.railHost.append(this.kit.ui.skeleton({ preset: 'sidebar' }));
    this.onKeydown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        this.openSearch();
      }
    };
    window.addEventListener('keydown', this.onKeydown);
    this.compactQuery = window.matchMedia?.(COMPACT_RAIL_QUERY) ?? null;
    this.onCompactChange = () => this.applyRailState();
    this.compactQuery?.addEventListener?.('change', this.onCompactChange);
    this.offHelp = ctx.bus.on('studio:help', () => this.openHelp());
    this.ready = this.load();
  }

  async load() {
    try {
      this.shell = await this.ctx.api.studioApi.getShell();
      if (this.disposed) return;
    } catch (error) {
      this.ctx.notify.fromError(error);
      return;
    }
    this.renderRail();
    this.renderTopEnd();
    if (this.pendingRoute) this.setActive(this.pendingRoute);
  }

  renderRail() {
    const { nav, project, chats, usage } = this.shell;
    const { ui, scope } = this.kit;
    this.railHost.replaceChildren();

    const createBtn = ui.button(nav.createLabel, { variant: 'primary', icon: 'plus', fullWidth: true, className: 'xw-host--fill' });
    const createHost = h('div', { class: 'studio-rail__create' }, createBtn);
    const header = h('div', { class: 'studio-rail__header stack gap8' },
      h('div', { class: 'rowf gap8 studio-rail__brandrow' },
        h('a', { class: 'brand', href: '#/' }, h('span', { class: 'mark' }), nav.brand),
        ui.button('', { variant: 'ghost', size: 'sm', icon: 'layout-sidebar-left-collapse', title: nav.collapseLabel, ariaLabel: nav.collapseLabel, className: 'sp', onClick: () => this.toggleRail() })),
      h('div', { class: 'studio-rail__search', ref: (el) => {
        const search = scope.mount(XWUIInputText, el, { placeholder: nav.searchPlaceholder }, {
          trigger: true, leadingIcon: 'search', shortcut: 'Control+K', fullWidth: true, ariaLabel: nav.searchLabel, size: 'sm',
          suffix: ui.mount(XWUIDisplayKbd, { keys: nav.searchShortcut.split(' ') }, { size: 'sm' }),
        });
        search.onActivate?.(() => this.openSearch());
      } }),
      createHost);

    // The dropdown wraps its trigger inside the container it is mounted into, so the
    // container must be the in-rail host that already holds the button.
    const menu = scope.mount(XWUINavMenuDropdown, createHost, {
      triggerElement: createBtn.querySelector('button'),
      items: nav.createMenu.map((m) => ({ id: m.id, label: m.label, icon: m.icon })),
    }, { placement: 'bottom', align: 'start' });
    menu.onItemClick?.((item) => this.onCreate(nav.createMenu.find((m) => m.id === (item?.id ?? item))));

    const usageBar = h('div');
    const usageText = template(usage.label, { used: formatNumber(usage.usedRuns), included: formatNumber(usage.includedRuns) });
    const footer = h('div', { class: 'meter stack gap8 studio-rail__meter' },
      h('b', {}, usageText),
      usageBar,
      h('span', { class: 'sec xs' }, template(usage.periodLabel, { date: formatDateTime(usage.periodEndsAt, { day: 'numeric', month: 'short' }) })));
    scope.mount(XWUIProgressBar, usageBar, { value: Math.round((usage.usedRuns / usage.includedRuns) * 100) }, { size: 'sm', className: 'studio-usage' });
    usageBar.setAttribute('aria-label', usageText);

    const items = [
      ...nav.primary.map((i) => ({ id: i.id, label: i.label, icon: i.icon, href: this.ctx.href(i.route), badge: i.badge?.label })),
      { id: 'grp_project', label: nav.projectGroup },
      { id: 'project', label: project.name, icon: 'folder', href: this.ctx.href('/studio/flows') },
      { id: 'grp_chats', label: nav.chatsGroup },
      ...chats.map((c) => ({ id: `chat_${c.id}`, label: c.title, icon: 'message', href: this.ctx.href('/studio', {}, { chat: c.id }), badge: c.waiting ? c.waitingLabel : undefined })),
      { id: 'spacer', label: '' },
      ...nav.footer.map((i) => ({ id: i.id, label: i.label, icon: i.icon, href: i.route ? this.ctx.href(i.route) : this.ctx.href('/studio', {}, { soon: i.id }) })),
    ];

    this.sidebar = scope.mount(XWUINavSidebar, this.railHost, { header, footer, items, selected: '' }, {
      width: '256px', collapsedWidth: '72px', collapsible: true, collapsed: this.wantCollapsed(),
    });
    this.root.classList.toggle('is-rail-collapsed', this.wantCollapsed());
    // The collapsed sidebar swaps its header for a monogram, taking the collapse button with
    // it; this button brings the full rail back.
    this.railHost.append(ui.button('', {
      variant: 'ghost', icon: 'layout-sidebar-left-expand', title: nav.expandLabel, ariaLabel: nav.expandLabel,
      className: 'studio-rail__expand', onClick: () => this.toggleRail(),
    }));
  }

  renderTopEnd() {
    const { scope, ui } = this.topKit;
    const { nav, user } = this.shell;
    const avatarHost = h('span', { class: 'studio-avatar' });
    this.topEnd.replaceChildren(
      ui.button(nav.helpLabel, { variant: 'ghost', size: 'sm', onClick: () => this.ctx.bus.emit('studio:help') }),
      avatarHost);
    scope.mount(XWUIDisplayAvatar, avatarHost, { name: user.name, alt: nav.accountLabel }, { size: 'sm' });
  }

  readCollapsed() {
    try { return localStorage.getItem(RAIL_STATE_KEY) === '1'; } catch { return false; }
  }

  wantCollapsed() {
    return Boolean(this.compactQuery?.matches) || this.readCollapsed();
  }

  /** Follow the viewport: compact screens get the icon rail, wide ones the saved choice. */
  applyRailState() {
    const want = this.wantCollapsed();
    if (!this.sidebar || want === this.root.classList.contains('is-rail-collapsed')) return;
    this.sidebar.toggle();
    this.root.classList.toggle('is-rail-collapsed', want);
  }

  toggleRail() {
    this.sidebar?.toggle();
    this.root.classList.toggle('is-rail-collapsed');
    // On a compact screen opening the rail is momentary; only wide-screen choices are kept.
    if (this.compactQuery?.matches) return;
    try { localStorage.setItem(RAIL_STATE_KEY, this.root.classList.contains('is-rail-collapsed') ? '1' : '0'); } catch { /* ignore */ }
  }

  async onCreate(entry) {
    if (!entry) return;
    if (entry.route) {
      this.ctx.navigate(entry.route);
      return;
    }
    try {
      const { id } = await this.ctx.api.studioApi.createFlow({});
      this.ctx.navigate(`/studio/flows/${id}`);
    } catch (error) {
      this.ctx.notify.fromError(error);
    }
  }

  openSearch() {
    openStudioSearch(this.ctx);
  }

  async openHelp() {
    if (!this.shell || this.helpOpen) return;
    this.helpOpen = true;
    const help = this.shell.nav.help;
    const kit = createKit();
    const content = h('div', { class: 'stack gap16' },
      h('p', { class: 'small sec' }, help.body),
      h('dl', { class: 'studio-help' }, help.shortcuts.map(({ keys, label }) => [
        h('dt', {}, kit.ui.mount(XWUIDisplayKbd, { keys }, { size: 'sm' })),
        h('dd', {}, label),
      ])));
    try {
      await this.kit.ui.dialog({ title: help.title, content, actions: [{ id: 'close', label: help.close, variant: 'primary' }] });
    } finally { kit.scope.destroy(); this.helpOpen = false; }
  }

  /** Pages call this to fill the top bar. crumbs: [{ label, route? }], actions: Node[] */
  setTopbar({ crumbs = [], actions = [], meta = [] } = {}) {
    this.topKit.scope.destroy();
    this.topKit = createKit();
    if (this.shell) this.renderTopEnd();
    const crumbsEl = h('div');
    this.crumbsHost.replaceChildren(crumbsEl, ...meta);
    this.topKit.scope.mount(XWUINavBreadcrumbs, crumbsEl, {
      items: crumbs.map((c) => ({ label: c.label, href: c.route ? this.ctx.href(c.route) : undefined })),
    }, { separator: '/', size: 'sm', className: 'studio-crumbs' });
    this.topActions.replaceChildren(...actions);
    return this.topKit;
  }

  setActive(route) {
    this.pendingRoute = route;
    if (!this.sidebar) return;
    const navId = studioRouteToNavId(route);
    this.sidebar.setSelected?.(navId);
  }

  destroy() {
    this.disposed = true;
    this.offHelp?.();
    window.removeEventListener('keydown', this.onKeydown);
    this.compactQuery?.removeEventListener?.('change', this.onCompactChange);
    this.kit.scope.destroy();
    this.topKit.scope.destroy();
    this.root.remove();
  }
}

export const studioLayouts = { [STUDIO_LAYOUT_ID]: StudioLayout };
