/**
 * Flow editor - floating header: back, breadcrumbs, publish state tags, view tabs,
 * Ask AI / Run / Publish.
 */
import { XWUINavTabs, XWUIDisplayKbd, XWUINavBreadcrumbs } from '@exonware/xwui/basic';
import { h } from '../../../../core/dom.js';
import { createKit } from '../../../../core/ui.js';
import { template } from '../../../../core/format.js';

/** Editor header tabs: the editor itself, two notation views, the gallery, versions, runs. */
const HEADER_VIEWS = ['editor', 'bpmn', '3d'];

export function createHeader({ ctx, flow, project, catalog, copy, handlers }) {
  let kit = createKit();
  const el = h('header', { class: 'fl rowf gap12 editor-header' });

  function render(state) {
    kit.scope.destroy();
    kit = createKit();
    const { ui, scope } = kit;
    const crumbs = h('div', { class: 'editor-header__crumbs' });
    scope.mount(XWUINavBreadcrumbs, crumbs, {
      items: [{ label: project.name, href: ctx.href('/studio/flows') }, { label: state.name }],
    }, { size: 'sm', className: 'studio-crumbs' });

    const tags = [];
    if (state.publishedVersion) tags.push(ui.tag(copy.published, 'primary', { title: template(copy.publishedVersion, { v: state.publishedVersion }) }));
    if (state.statusKey === 'changes' || (state.statusKey === 'draft' && state.publishedVersion)) tags.push(ui.tag(copy.unpublished, 'warning'));
    if (!state.publishedVersion) tags.push(ui.tag(copy.draft, 'default', { className: 'xw-tone-plan' }));
    if (state.saving) tags.push(h('span', { class: 'xs ter' }, copy.saving));

    const notationTabs = HEADER_VIEWS.map((id) => catalog.notations.find((n) => n.id === id)).filter(Boolean)
      .map((n) => ({ id: n.id, label: n.id === 'editor' ? n.short : n.short }));
    const tabs = [...notationTabs, { id: 'all', label: copy.allViews }, { id: 'versions', label: copy.versionsTab }, { id: 'runs', label: copy.runsTab }];
    const tabsHost = h('div', { class: 'studio-tabs editor-header__tabs' });
    const nav = scope.mount(XWUINavTabs, tabsHost, { tabs, activeTab: 'editor' }, { variant: 'button', size: 'sm', ariaLabel: copy.viewsLabel, hideContent: true });
    nav.onChange?.((id) => {
      const key = id?.id ?? id;
      if (key === 'editor') return;
      nav.setActiveTab?.('editor');
      handlers.onTab(key);
    });

    const runBtn = ui.button(copy.run, { variant: 'outline', size: 'sm', icon: 'play', loading: state.running, onClick: handlers.onRun });
    const kbd = h('span', { class: 'editor-header__kbd' });
    scope.mount(XWUIDisplayKbd, kbd, { keys: copy.runShortcut }, { size: 'sm' });
    runBtn.querySelector('button')?.append(kbd);

    el.replaceChildren(
      ui.button('', { variant: 'ghost', icon: 'arrow-left', ariaLabel: copy.back, title: copy.back, onClick: () => ctx.navigate('/studio/flows') }),
      h('span', { class: 'mark editor-header__mark', 'aria-hidden': 'true' }),
      crumbs,
      h('div', { class: 'rowf gap8' }, tags),
      tabsHost,
      h('div', { class: 'rowf gap8 sp' },
        ui.button(copy.askAi, { variant: 'secondary', size: 'sm', icon: 'sparkles', onClick: handlers.onAsk }),
        runBtn,
        ui.button(copy.publish, { variant: 'primary', size: 'sm', disabled: state.statusKey === 'published' && !state.dirty, onClick: handlers.onPublish })));
  }

  render({ name: flow.name, statusKey: flow.statusKey, publishedVersion: flow.publishedVersion });

  return {
    el,
    update: render,
    destroy: () => kit.scope.destroy(),
  };
}
