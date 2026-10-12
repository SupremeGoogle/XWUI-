/** Component definition and geometry constants. */
export const DEFINITION = {
  id: 'XWFContrastCheck',
  component: 'XWFContrastCheck',
  properties: {
    data: {
      properties: {
        kit: {
          default: {},
        },
        content: {
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
export const CONTRAST_RULES = Object.freeze({
  aa: 4.5,
  offset: 0.05,
  threshold: 0.04045,
  linearDivisor: 12.92,
  channelDivisor: 255,
  transferOffset: 0.055,
  transferDivisor: 1.055,
  gamma: 2.4,
  weights: [0.2126, 0.7152, 0.0722],
});
