/**
 * Ctrl K search: an XWUIOverlayDialog with an XWUIInputText that finds flows and runs
 * through the studio API and jumps to them.
 */
import { XWUIOverlayDialog, XWUIInputText } from '@exonware/xwui/basic';
import { h } from '../../../core/dom.js';
import { createKit } from '../../../core/ui.js';
import { STUDIO_SEARCH } from './studio-search.data.js';

let openDialog = null;

export function openStudioSearch(ctx) {
  if (openDialog) return;
  const { scope, ui } = createKit();
  const host = h('div');
  const inputHost = h('div');
  const results = h('div', { class: 'studio-search__results', role: 'listbox', 'aria-label': STUDIO_SEARCH.resultsLabel });
  const content = h('div', { class: 'studio-search stack gap12' }, inputHost, results);
  document.body.append(host);

  const close = () => {
    scope.destroy();
    try { dialog.destroy(); } catch { /* already gone */ }
    host.remove();
    openDialog = null;
  };

  const dialog = new XWUIOverlayDialog(host, { title: STUDIO_SEARCH.title, content }, { size: 'md' });
  dialog.open?.();
  dialog.onClose?.(close);
  openDialog = dialog;

  const go = (route) => { close(); ctx.navigate(route); };
  let token = 0;
  const search = async (q) => {
    const current = ++token;
    results.replaceChildren(ui.spinner());
    try {
      const [flows, runs] = await Promise.all([
        ctx.api.studioApi.listFlows({ q }),
        ctx.api.studioApi.listRuns({ q, days: null, pageSize: 6 }),
      ]);
      if (current !== token) return;
      const rows = [
        ...flows.items.map((f) => ({ kind: STUDIO_SEARCH.flowKind, label: f.name, hint: f.folder, icon: 'workflow', route: `/studio/flows/${f.id}` })),
        ...runs.items.map((r) => ({ kind: STUDIO_SEARCH.runKind, label: `${r.flowName}`, hint: r.shortId, icon: 'history', route: `/studio/runs/${r.id}` })),
      ];
      results.replaceChildren(...(rows.length ? rows.map((r) => h('button', {
        class: 'studio-search__row', type: 'button', role: 'option', onClick: () => go(r.route),
      }, ui.icon(r.icon), h('span', { class: 'grow' }, r.label), h('span', { class: 'xs ter mono' }, r.hint), ui.tag(r.kind))) : [ui.empty({ title: STUDIO_SEARCH.emptyTitle, description: STUDIO_SEARCH.emptyBody, icon: 'search' }, { size: 'sm' })]));
    } catch (error) {
      ctx.notify.fromError(error);
    }
  };

  const input = scope.mount(XWUIInputText, inputHost, { placeholder: STUDIO_SEARCH.placeholder }, { leadingIcon: 'search', fullWidth: true, clearable: true, ariaLabel: STUDIO_SEARCH.placeholder });
  let debounce = null;
  input.onChange?.((value) => {
    clearTimeout(debounce);
    debounce = setTimeout(() => search(value), STUDIO_SEARCH.debounceMs);
  });
  requestAnimationFrame(() => input.focus?.());
  search('');
}
