/**
 * Full-screen studio layout for the flow editor and the notation views: no rail, the page
 * owns the whole viewport (the prototype draws floating glass panels over the canvas).
 */
import { h, ensureStylesheet } from '../../../core/dom.js';
import { openStudioSearch } from './studio-search.js';

ensureStylesheet('xwf-css-studio', new URL('../studio.css', import.meta.url));

export class CanvasLayout {
  constructor(root, ctx) {
    this.onKeydown = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault(); openStudioSearch(ctx);
      }
    };
    window.addEventListener('keydown', this.onKeydown);
    this.outlet = h('div', { class: 'studio-canvas-outlet' });
    this.root = h('div', { class: 'xw studio-canvas-shell' }, this.outlet);
    root.append(this.root);
  }

  setActive() {}

  destroy() {
    window.removeEventListener('keydown', this.onKeydown);
    this.root.remove();
  }
}
