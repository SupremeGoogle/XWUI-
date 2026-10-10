import { h } from '../../../core/dom.js';
import { createKit } from '../../../core/ui.js';
import { UI_CONFIG } from '../../../core/ui.config.js';

/** Shared failure state for a page that could not mount (API error, missing record...). */
export function renderPageError(outlet, error, retry) {
  const { ui } = createKit();
  outlet.replaceChildren(h('div', { class: 'pg xw-page-error' },
    ui.empty({
      title: UI_CONFIG.messages.loadFailedTitle,
      description: error?.message ?? UI_CONFIG.messages.genericError,
      icon: 'error',
      action: { label: UI_CONFIG.messages.retry, onClick: retry },
    })));
}
