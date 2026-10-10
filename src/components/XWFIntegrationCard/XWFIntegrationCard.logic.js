import { XWUIComponentLogic } from '@exonware/xwui/basic';
import { DEFINITION } from './XWFIntegrationCard.model.js';
export const createXWFIntegrationCardLogic = (data = {}, config = {}) => new XWUIComponentLogic(DEFINITION, data, config);
