/** Component definition and geometry constants. */
export const DEFINITION = {
  id: 'XWFIntegrationCard',
  component: 'XWFIntegrationCard',
  properties: {
    data: {
      properties: {
        item: {
          default: {},
        },
        assets: {
          default: {},
        },
        labels: {
          default: {},
        },
        featured: {
          default: false,
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
