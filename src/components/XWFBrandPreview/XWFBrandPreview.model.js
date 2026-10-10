/** Component definition and geometry constants. */
export const DEFINITION = {
  id: 'XWFBrandPreview',
  component: 'XWFBrandPreview',
  properties: {
    data: {
      properties: {
        kit: {
          default: {},
        },
        content: {
          default: {},
        },
        dirty: {
          default: false,
        },
        labels: {
          default: {},
        },
        uid: {
          type: 'string',
        },
      },
    },
    conf_comp: {
      properties: {
        className: {
          type: 'string',
        },
      },
    },
  },
};

export const FONT_FAMILIES = {
  unbounded: '"Unbounded", sans-serif',
  manrope: '"Manrope", sans-serif',
  mono: '"JetBrains Mono", monospace',
};
