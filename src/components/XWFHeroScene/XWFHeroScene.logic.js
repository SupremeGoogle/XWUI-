import { XWUIComponentLogic } from '@exonware/xwui/basic';
import { DEFINITION } from './XWFHeroScene.model.js';
export const createXWFHeroSceneLogic = (data = {}, config = {}) =>
  new XWUIComponentLogic(DEFINITION, data, config);
