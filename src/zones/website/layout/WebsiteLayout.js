import { h, ensureStylesheet } from '../../../core/dom.js';
import { createXwfKit, routeAction, assetImage } from '../../../components/xwf-ui.js';

export class WebsiteLayout {
  constructor(root, ctx) {
    ensureStylesheet('xwf-website-css', new URL('../pages/website.css', import.meta.url));
    try { const language = localStorage.getItem('xwflow-language'); if (['en', 'ar'].includes(language)) { document.documentElement.lang = language; document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr'; } } catch { /* locale uses the current document fallback */ }
    this.ctx = ctx; this.kit = createXwfKit(); this.disposed = false;
    this.header = h('div', { class: 'nav-wrap xwf-website__header' });
    this.content = h('main', { class: 'xwf-website__outlet' });
    this.footer = h('footer', { class: 'foot' });
    this.shell = h('div', { class: 'xwf-website' }, this.header, this.content, this.footer);
    root.replaceChildren(this.shell);
    this.header.append(this.kit.ui.skeleton({ height: '64px' }));
    this.ctx.api.websiteApi.getNavigation().then((data) => { if (this.disposed) return; this.data = data; this.renderChrome(); }).catch((error) => { if (!this.disposed) ctx.notify.error(error.message); });
  }
  get outlet() { return this.content; }
  setActive(route) { this.route = route; if (this.data) this.updateActive(); }
  renderChrome() {
    this.chrome?.scope.destroy(); this.chrome = createXwfKit();
    const { ui } = this.chrome; const data = this.data;
    const lang = document.documentElement.lang === 'ar' ? 'ar' : 'en';
    const brand = () => h('a', { class: 'brand', href: `#${data.home}` }, assetImage(data.assets, data.assetRefs.mark, 'xwf-brand-mark', true), data.brand);
    const nav = h('nav', { class: 'xwf-website__nav rowf gap4', 'aria-label': data.primaryLabel }, data.items.map((item) => {
      const el = routeAction(ui, { ...item, label: lang === 'ar' ? item.ar : item.label, variant: 'ghost' }, { size: 'sm' });
      el.dataset.navId = item.id; return el;
    }));
    const language = ui.button(data.language[lang], { variant: 'ghost', size: 'sm', onClick: () => {
      const next = lang === 'ar' ? 'en' : 'ar'; document.documentElement.lang = next; document.documentElement.dir = next === 'ar' ? 'rtl' : 'ltr';
      try { localStorage.setItem('xwflow-language', next); } catch { /* locale still works without storage */ }
      this.renderChrome(); this.ctx.bus.emit('xwf-language', { lang: next });
    } });
    this.header.replaceChildren(h('div', { class: 'wrap' }, h('header', { class: 'navbar xwf-website__navbar' }, brand(), nav, h('div', { class: 'rowf gap4 sp' }, language, data.actions.map((action) => routeAction(ui, { ...action, label: lang === 'ar' ? action.ar : action.label }, { size: 'sm' }))))));
    const footer = data.footer;
    this.footer.replaceChildren(h('div', { class: 'wrap stack gap48' }, h('div', { class: 'wrapf gap48' }, h('div', { class: 'stack gap16 xwf-website__footer-brand' }, brand(), h('p', { class: 'small sec' }, footer.description), h('div', { class: 'rowf gap8' }, footer.tags.map((tag) => ui.tag(tag)))), footer.columns.map((column) => h('div', { class: 'xwf-website__footer-column' }, h('h4', {}, column.title), column.links.map(([label, path]) => routeAction(ui, { label, path, variant: 'link' }, { size: 'sm' }))))), h('div', { class: 'wordmark', 'aria-hidden': 'true' }, data.brand), h('div', { class: 'rowf wrapf gap16 small sec' }, footer.license, h('span', { class: 'sp rowf gap8' }, footer.sourceLabel, ui.button(data.brand, { variant: 'link', href: footer.source, target: '_blank', size: 'sm' })))));
    this.updateActive();
  }
  updateActive() {
    for (const host of this.header.querySelectorAll('[data-nav-id]')) {
      const item = this.data.items.find((entry) => entry.id === host.dataset.navId);
      const link = host.querySelector('a');
      const active = item.path === this.route?.path;
      if (active) link?.setAttribute('aria-current', 'page'); else link?.removeAttribute('aria-current');
    }
  }
  destroy() { this.disposed = true; this.chrome?.scope.destroy(); this.kit.scope.destroy(); this.shell.remove(); }
}
