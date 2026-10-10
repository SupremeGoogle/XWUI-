/**
 * XWFTemplate - model.
 * The definition has the same shape as XWUI's own component definitions: an id, the
 * component name and the two property buckets, `data` (content) and `conf_comp`
 * (appearance/behaviour), each with JSON-Schema-like property descriptions and defaults.
 * XWUIComponentLogic reads defaults from here.
 */

/** @typedef {{ id: string, label: string, hint?: string, tone?: XWFTemplateTone }} XWFTemplateItem */
/** @typedef {'lime'|'cyan'|'violet'|'pink'|'orange'} XWFTemplateTone */

export const XWF_TEMPLATE_TONES = Object.freeze(['lime', 'cyan', 'violet', 'pink', 'orange']);
export const XWF_TEMPLATE_VARIANTS = Object.freeze(['glass', 'plain']);

export const XWF_TEMPLATE_DEFINITION = Object.freeze({
  id: 'XWFTemplate',
  component: 'XWFTemplate',
  properties: {
    data: {
      properties: {
        title: { type: 'string', default: '' },
        items: { type: 'array', default: [] },
        selectedId: { type: 'string', default: '' },
        uid: { type: 'string' },
      },
    },
    conf_comp: {
      properties: {
        variant: { type: 'string', enum: XWF_TEMPLATE_VARIANTS, default: 'glass' },
        selectable: { type: 'boolean', default: true },
        className: { type: 'string' },
      },
    },
  },
});

export const XWF_TEMPLATE_EVENTS = Object.freeze({ SELECT: 'xwf-select' });
