import { XWUIComponent, createXWUIElement } from '@exonware/xwui/basic';
import { ensureStylesheet } from '../../core/dom.js';
import { createXwfKit } from '../xwf-ui.js';
import { createXWFHeroSceneLogic, heroLayout } from './XWFHeroScene.logic.js';
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
    this.resizeObserver = new ResizeObserver(() => this.resizeScene());
    this.resizeObserver.observe(this.container);
  }
  renderView() {
    this.kit?.scope.destroy();
    this.kit = createXwfKit(this);
    this.root = projectXWFHeroSceneView(
      this.data,
      {
        onAction: (detail) =>
          this.container.dispatchEvent(
            new CustomEvent('xwf-action', { bubbles: true, detail }),
          ),
      },
      this.kit.ui,
    );
    this.container.replaceChildren(this.root);
    this.resizeScene();
  }
  resizeScene() {
    const width = this.root?.clientWidth;
    if (!width) return;
    const layout = heroLayout(width);
    this.root.style.setProperty('--xwf-scene-scale', layout.scale);
    this.root.style.setProperty('--xwf-plane-top', `${layout.planeTop}px`);
    this.root.style.setProperty('--xwf-prompt-top', `${layout.promptTop}px`);
    this.root.style.setProperty('--xwf-scene-height', `${layout.height}px`);
  }
  destroy() {
    this.resizeObserver?.disconnect();
    this.unsubscribe?.();
    this.kit?.scope.destroy();
    this.kit = null;
    super.destroy();
  }
}
createXWUIElement(XWFHeroScene, 'xwf-hero-scene');
