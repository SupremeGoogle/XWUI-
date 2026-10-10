import { XWUIComponentLogic } from '@exonware/xwui/basic';
import { DEFINITION } from './XWFPricingTiers.model.js';
export const createXWFPricingTiersLogic = (data = {}, config = {}) =>
  new XWUIComponentLogic(DEFINITION, data, config);
