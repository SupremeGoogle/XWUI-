/**
 * Dummy API entry point.
 * Each domain lives in its own module; this file only loads and groups them. A module
 * that is missing (e.g. while a zone is still being built) is skipped with a warning
 * so the rest of the app keeps working.
 */
const MODULES = [
  ['studioApi', () => import('./studio.api.js')],
  ['websiteApi', () => import('./website.api.js')],
  ['adminApi', () => import('./admin.api.js')],
];

/** @type {{ studioApi?: object, websiteApi?: object, adminApi?: object }} */
export const api = {};

export async function loadApi() {
  await Promise.all(MODULES.map(async ([name, load]) => {
    try {
      const mod = await load();
      api[name] = mod[name];
    } catch (error) {
      console.warn(`[api] ${name} is not available yet`, error.message);
    }
  }));
  return api;
}
