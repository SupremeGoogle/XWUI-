import { XWUIComponentLogic } from '@exonware/xwui/basic';
import { DEFINITION, HERO_LAYOUT as L } from './XWFHeroScene.model.js';
export const createXWFHeroSceneLogic = (data = {}, config = {}) =>
  new XWUIComponentLogic(DEFINITION, data, config);

/** Fit the reference plane as a whole; circle and nodes share the same scale. */
export function heroLayout(width) {
  const scale = Math.min(L.maxScale, Math.max(0, width - L.padding) / L.projectedWidth);
  const graphHeight = Math.max(L.minGraphHeight, L.graphHeight * scale);
  return {
    scale,
    planeTop: (graphHeight - L.planeHeight) / 2 + L.cardGap + L.depthInset * Math.max(0, 1 - scale),
    promptTop: graphHeight + L.cardGap,
    height: graphHeight + (width <= L.stackedAt ? L.stackedFooter : width <= L.compactAt ? L.compactFooter : L.desktopFooter),
  };
}
