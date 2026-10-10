import { XWUIComponentLogic } from '@exonware/xwui/basic';
import { DEFINITION } from './XWFIsoTiles.model.js';
export const createXWFIsoTilesLogic = (data = {}, config = {}) => new XWUIComponentLogic(DEFINITION, data, config);
