/**
 * Ctrl K search: an XWUIOverlayDialog with an XWUIInputText that finds flows and runs
 * through the studio API and jumps to them.
 */
import { XWUIOverlayDialog, XWUIInputText } from '@exonware/xwui/basic';
import { h } from '../../../core/dom.js';
import { createKit } from '../../../core/ui.js';

let openDialog = null;

export async function openStudioSearch(ctx) {
  if (openDialog) return;
  openDialog = 'loading';
  let STUDIO_SEARCH;
  try { STUDIO_SEARCH = await ctx.api.studioApi.getSearchCopy(); }
  catch (error) { openDialog = null; ctx.notify.fromError(error); return; }
  const { scope, ui } = createKit();
  let token = 0;
  let debounce = null;
  let disposed = false;
  const host = h('div');
  const inputHost = h('div');
  const results = h('div', { class: 'studio-search__results', role: 'list', 'aria-label': STUDIO_SEARCH.resultsLabel });
  const content = h('div', { class: 'studio-search stack gap12' }, inputHost, results);
  document.body.append(host);

  const close = () => {
    disposed = true; token += 1; clearTimeout(debounce);
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
  const search = async (q) => {
    const current = ++token;
    results.replaceChildren(ui.spinner());
    try {
      const [flows, runs] = await Promise.all([
        ctx.api.studioApi.listFlows({ q }),
        ctx.api.studioApi.listRuns({ q, days: null, pageSize: 6 }),
      ]);
      if (disposed || current !== token) return;
      const rows = [
        ...flows.items.map((f) => ({ kind: STUDIO_SEARCH.flowKind, label: f.name, hint: f.folder, icon: 'workflow', route: `/studio/flows/${f.id}` })),
        ...runs.items.map((r) => ({ kind: STUDIO_SEARCH.runKind, label: `${r.flowName}`, hint: r.shortId, icon: 'history', route: `/studio/runs/${r.id}` })),
      ];
      results.replaceChildren(...(rows.length ? rows.map((r) => {
        const row = ui.button(r.label, { variant: 'ghost', icon: r.icon, fullWidth: true, className: 'studio-search__row', onClick: () => go(r.route) });
        row.setAttribute('role', 'listitem');
        row.querySelector('button').append(h('span', { class: 'xs ter mono sp' }, r.hint), ui.tag(r.kind));
        return row;
      }) : [ui.empty({ title: STUDIO_SEARCH.emptyTitle, description: STUDIO_SEARCH.emptyBody, icon: 'search' }, { size: 'sm' })]));
    } catch (error) {
      ctx.notify.fromError(error);
    }
  };

  const input = scope.mount(XWUIInputText, inputHost, { placeholder: STUDIO_SEARCH.placeholder }, { leadingIcon: 'search', fullWidth: true, clearable: true, ariaLabel: STUDIO_SEARCH.placeholder });
  input.onChange?.((value) => {
    clearTimeout(debounce);
    debounce = setTimeout(() => search(value), STUDIO_SEARCH.debounceMs);
  });
  requestAnimationFrame(() => input.focus?.());
  search('');
}
