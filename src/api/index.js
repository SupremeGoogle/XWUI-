/**
 * Dummy API entry point.
 * Each required domain loads before routes start. A failed module reaches the
 * application error screen with retry, rather than leaving an undefined API.
 */
const MODULES = [
  ['studioApi', () => import('./studio.api.js')],
  ['websiteApi', () => import('./website.api.js')],
  ['adminApi', () => import('./admin.api.js')],
];

/** @type {{ studioApi?: object, websiteApi?: object, adminApi?: object }} */
export const api = {};

export async function loadApi() {
  const modules = await Promise.all(MODULES.map(async ([name, load]) => {
    const mod = await load().catch((error) => { throw new Error(`${name}: ${error.message}`, { cause: error }); });
    return [name, mod[name]];
  }));
  Object.assign(api, Object.fromEntries(modules));
  return api;
}
