/** Pure DOM projection; all controls are XWUI basic. */
import { h } from '../../core/dom.js';
import { XWUITable } from '@exonware/xwui/basic';
import { deriveContrastRows } from './XWFContrastCheck.logic.js';
export function projectXWFContrastCheckView({ kit, content }, handlers, ui) {
  const rows = deriveContrastRows(kit, content);
  return h(
    'section',
    { class: 'xwf-contrast-check stack gap12', 'aria-label': content.title },
    h('h2', { class: 'h3' }, content.title),
    ui.mount(
      XWUITable,
      {
        columns: content.columns.map((column) => ({
          ...column,
          render:
            column.key === 'result'
              ? (value, row) =>
                  ui.status(value, row.passes ? 'success' : 'error')
              : undefined,
        })),
        data: rows,
      },
      { size: 'sm' },
    ),
    h('p', { class: 'xs sec' }, content.note),
  );
}
