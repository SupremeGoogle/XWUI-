import { XWUIComponent, createXWUIElement } from '@exonware/xwui/basic';
import { ensureStylesheet } from '../../core/dom.js';
import { createXwfKit } from '../xwf-ui.js';
import { createXWFIsoTilesLogic } from './XWFIsoTiles.logic.js';
import { projectXWFIsoTilesView } from './XWFIsoTiles.view.js';
/** Specialized visual composed of XWUI basic primitives. */
export class XWFIsoTiles extends XWUIComponent {
  static componentName = 'XWFIsoTiles';
  constructor(container, data = {}, conf_comp = {}) {
    ensureStylesheet(
      'xwui-css-xwfisotiles',
      new URL('./XWFIsoTiles.css', import.meta.url),
    );
    super(container, createXWFIsoTilesLogic(data, conf_comp));
    this.kit = null;
    this.unsubscribe = this.logic.subscribe(() => this.renderView());
    this.renderView();
  }
  renderView() {
    this.kit?.scope.destroy();
    this.kit = createXwfKit(this);
    this.container.replaceChildren(
      projectXWFIsoTilesView(
        this.data,
        {
          onAction: (detail) =>
            this.container.dispatchEvent(
              new CustomEvent('xwf-action', { bubbles: true, detail }),
            ),
        },
        this.kit.ui,
      ),
    );
  }
  destroy() {
    this.unsubscribe?.();
    this.kit?.scope.destroy();
    this.kit = null;
    super.destroy();
  }
}
createXWUIElement(XWFIsoTiles, 'xwf-iso-tiles');
