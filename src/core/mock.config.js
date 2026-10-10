/**
 * Knobs of the dummy backend. Change latency or failures here, not in API modules.
 * `?mock=fast` in the URL disables latency (handy for demos and automated checks).
 */
const params = new URLSearchParams(window.location.search);

export const MOCK_CONFIG = {
  enabled: params.get('mock') !== 'fast',
  latency: { min: 220, max: 650 },
  /** multiplies every failRate passed to respond(); 0 turns random failures off */
  failureMultiplier: params.get('mock') === 'flaky' ? 6 : 1,
  storagePrefix: 'xwflow:',
  /** bump to invalidate everything stored by an older build */
  schemaVersion: 'v1',
  messages: {
    transient: 'The server did not answer in time. Try again.',
  },
};
