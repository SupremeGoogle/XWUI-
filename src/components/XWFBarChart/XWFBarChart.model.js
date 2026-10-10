/** Component definition and geometry constants. */
export const DEFINITION = {
  id: 'XWFBarChart',
  component: 'XWFBarChart',
  properties: {
    data: {
      properties: {
        chart: {
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
export const BAR_GEOMETRY = Object.freeze({
  width: 720,
  height: 230,
  plotHeight: 220,
  gap: 6,
  radius: 4,
  stackGap: 2,
  minimumFailureHeight: 1,
  partialOpacity: 0.45,
});
