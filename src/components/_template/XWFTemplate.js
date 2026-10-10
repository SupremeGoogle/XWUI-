/**
 * XWFTemplate - component.
 * Reference implementation of an xwflow custom component built on the XWUI base:
 *   model  -> XWFTemplate.model.js  (definition, defaults, enums, event names)
 *   logic  -> XWFTemplate.logic.js  (XWUIComponentLogic + pure helpers)
 *   view   -> XWFTemplate.view.js   (state -> DOM, XWUI children through the ui kit)
 *   style  -> XWFTemplate.css       (tokens only)
 *   docs   -> XWFTemplate.md
 * Copy this folder when a screen needs something XWUI basic does not ship.
 */
import { XWUIComponent, createXWUIElement } from '@exonware/xwui/basic';
import { ensureStylesheet } from '../../core/dom.js';
import { createKit } from '../../core/ui.js';
import { XWF_TEMPLATE_EVENTS } from './XWFTemplate.model.js';
import { createXWFTemplateLogic, deriveXWFTemplateItems, nextXWFTemplateSelection } from './XWFTemplate.logic.js';
import { projectXWFTemplateView } from './XWFTemplate.view.js';

const STYLE_ID = 'xwf-css-xwftemplate';

export class XWFTemplate extends XWUIComponent {
  static componentName = 'XWFTemplate';

  /**
   * @param {HTMLElement} container
   * @param {{ title?: string, items?: import('./XWFTemplate.model.js').XWFTemplateItem[], selectedId?: string }} data
   * @param {{ variant?: 'glass'|'plain', selectable?: boolean, className?: string }} conf_comp
   */
  constructor(container, data = {}, conf_comp = {}) {
    // The stylesheet is linked before super(): XWUI's CSS loader then finds it and does
    // not try to fetch XWFTemplate.css from the XWUI CDN.
    ensureStylesheet(STYLE_ID, new URL('./XWFTemplate.css', import.meta.url));
    super(container, createXWFTemplateLogic(data, conf_comp));
    this.kit = null;
    this.unsubscribe = this.logic.subscribe(() => this.renderView());
    this.renderView();
  }

  renderView() {
    this.kit?.scope.destroy();
    this.kit = createKit(this);
    const { title, items, selectedId } = this.data;
    const view = projectXWFTemplateView(
      { title, items: deriveXWFTemplateItems(items, selectedId), config: this.config },
      { onActivate: (id) => this.select(nextXWFTemplateSelection(this.data.selectedId, id)) },
      this.kit.ui,
    );
    this.container.replaceChildren(view);
  }

  /** Public API: select an item by id ('' clears) and announce it. */
  select(id) {
    this.logic.updateData({ selectedId: id });
    this.container.dispatchEvent(new CustomEvent(XWF_TEMPLATE_EVENTS.SELECT, {
      bubbles: true,
      detail: { id, item: this.data.items.find((i) => i.id === id) ?? null },
    }));
  }

  getSelected() {
    return this.data.items.find((i) => i.id === this.data.selectedId) ?? null;
  }

  destroy() {
    this.unsubscribe?.();
    this.kit?.scope.destroy();
    this.kit = null;
    super.destroy();
  }
}

createXWUIElement(XWFTemplate, 'xwf-template');
