/** Component definition and geometry constants. */
export const DEFINITION = {
  id: 'XWFPricingTiers',
  component: 'XWFPricingTiers',
  properties: {
    data: {
      properties: {
        tiers: {
          default: [],
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
