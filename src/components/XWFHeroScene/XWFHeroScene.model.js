/** Component definition and geometry constants. */
export const DEFINITION = {
  id: 'XWFHeroScene',
  component: 'XWFHeroScene',
  properties: {
    data: {
      properties: {
        scene: {
          default: {},
        },
        zoom: {
          default: 1,
        },
        busy: {
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
export const HERO_ZOOM = Object.freeze({
  min: 0.6,
  max: 1.3,
  step: 0.1,
  initial: 1,
});
export const HERO_LAYOUT = Object.freeze({
  projectedWidth: 1200,
  planeHeight: 560,
  graphHeight: 600,
  minGraphHeight: 220,
  padding: 32,
  maxScale: 1.12,
  stackedAt: 700,
  compactAt: 1100,
  desktopFooter: 120,
  compactFooter: 240,
  stackedFooter: 440,
  cardGap: 16,
  depthInset: 80,
});
