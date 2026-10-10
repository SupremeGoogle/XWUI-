import { XWUIComponent, createXWUIElement } from '@exonware/xwui/basic';
import { ensureStylesheet } from '../../core/dom.js';
import { createXwfKit } from '../xwf-ui.js';
import { createXWFHeroSceneLogic } from './XWFHeroScene.logic.js';
import { projectXWFHeroSceneView } from './XWFHeroScene.view.js';
/** Specialized visual composed of XWUI basic primitives. */
export class XWFHeroScene extends XWUIComponent {
  static componentName = 'XWFHeroScene';
  constructor(container, data = {}, conf_comp = {}) {
    ensureStylesheet(
      'xwui-css-xwfheroscene',
      new URL('./XWFHeroScene.css', import.meta.url),
    );
    super(container, createXWFHeroSceneLogic(data, conf_comp));
    this.kit = null;
    this.unsubscribe = this.logic.subscribe(() => this.renderView());
    this.renderView();
  }
  renderView() {
    this.kit?.scope.destroy();
    this.kit = createXwfKit(this);
    this.container.replaceChildren(
      projectXWFHeroSceneView(
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
createXWUIElement(XWFHeroScene, 'xwf-hero-scene');
