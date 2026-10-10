/**
 * XWFStatus - model.
 * A status line with a shaped marker, the prototype's `.st` element:
 * ok (glowing dot), err (diamond), warn (triangle), run (spinner), idle (ring),
 * pin (violet square), dis (hatched square).
 */
export const XWF_STATUS_KINDS = Object.freeze(['ok', 'err', 'warn', 'run', 'idle', 'pin', 'dis']);

export const XWF_STATUS_DEFINITION = Object.freeze({
  id: 'XWFStatus',
  component: 'XWFStatus',
  properties: {
    data: {
      properties: {
        label: { type: 'string', default: '' },
        uid: { type: 'string' },
      },
    },
    conf_comp: {
      properties: {
        kind: { type: 'string', enum: XWF_STATUS_KINDS, default: 'idle' },
        size: { type: 'string', enum: ['sm', 'md', 'lg'], default: 'md' },
        className: { type: 'string' },
      },
    },
  },
});

/** Words announced for each kind (the visible label carries the specifics). */
export const XWF_STATUS_SR = Object.freeze({
  ok: 'OK', err: 'Error', warn: 'Warning', run: 'In progress', idle: 'Idle', pin: 'Pinned', dis: 'Disabled',
});
