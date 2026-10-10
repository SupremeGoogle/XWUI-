/**
 * Flow editor - step palette (left floating panel): search + grouped step types.
 * Click adds a step after the selection; drag drops it on the canvas.
 */
import { XWUIInputText, XWUIDisplayKbd } from '@exonware/xwui/basic';
import { h } from '../../../../core/dom.js';
import { createKit } from '../../../../core/ui.js';
import { XWF_FLOW_DND_TYPE } from '../../../../components/XWFFlowCanvas/XWFFlowCanvas.model.js';

export function createPalette({ catalog, copy, onAdd }) {
  const { scope, ui } = createKit();
  const list = h('div', { class: 'editor-palette__list' });
  const searchHost = h('div', { class: 'editor-palette__search' });
  const el = h('aside', { class: 'fl stack editor-palette', 'aria-label': copy.paletteLabel }, searchHost, list,
    h('p', { class: 'xs ter editor-palette__hint' }, copy.paletteHint));

  const input = scope.mount(XWUIInputText, searchHost, { placeholder: copy.paletteSearch }, {
    leadingIcon: 'search', fullWidth: true, ariaLabel: copy.paletteSearch, size: 'sm',
    suffix: undefined,
  });
  const kbdHost = h('span', { class: 'editor-palette__kbd' });
  searchHost.append(kbdHost);
  scope.mount(XWUIDisplayKbd, kbdHost, { keys: copy.paletteShortcut }, { size: 'sm' });

  const paletteTypes = catalog.nodeTypes.filter((t) => t.palette);

  function render(query = '') {
    const q = query.trim().toLowerCase();
    const groups = catalog.nodeGroups.map((g) => ({
      ...g,
      items: paletteTypes.filter((t) => t.group === g.id && (!q || t.label.toLowerCase().includes(q) || t.description.toLowerCase().includes(q))),
    })).filter((g) => g.items.length);
    list.replaceChildren(...(groups.length ? groups.flatMap((g) => [
      h('div', { class: 'gl' }, g.label),
      ...g.items.map((t) => h('button', {
        class: 'pi editor-palette__item',
        type: 'button',
        draggable: 'true',
        title: t.description,
        onClick: () => onAdd(t.id),
        onDragstart: (e) => { e.dataTransfer.setData(XWF_FLOW_DND_TYPE, t.id); e.dataTransfer.effectAllowed = 'copy'; },
      }, h('span', { class: 'ico s', style: { '--gc': `var(--xw-${t.tone})` } }, ui.icon(t.icon, { size: 'sm' })), t.label)),
    ]) : [h('p', { class: 'small ter' }, copy.paletteEmpty)]));
  }

  input.onChange?.((v) => render(v));
  render();

  return {
    el,
    focusSearch: () => input.focus?.(),
    destroy: () => scope.destroy(),
  };
}
