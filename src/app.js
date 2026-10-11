/**
 * xwflow bootstrap: load the dummy API, register every zone (layouts + pages), start the router.
 */
import { createRouter, navigate, href } from './core/router.js';
import { bus } from './core/bus.js';
import { notify } from './core/notify.js';
import { UI_CONFIG } from './core/ui.config.js';
import { loadApi, api } from './api/index.js';
import { MOCK_CONFIG } from './core/mock.config.js';
import { resetAllStorage } from './core/mock.js';
import { appZone } from './zones/_app/index.js';
import { renderPageError } from './zones/_app/pages/error.view.js';

const ZONES = [
  () => import('./zones/website/index.js'),
  () => import('./zones/studio/index.js'),
  () => import('./zones/admin/index.js'),
];

async function boot() {
  const root = document.getElementById('app');
  // Before the API modules load, since their collections read storage when created.
  if (MOCK_CONFIG.reset) resetAllStorage();
  await loadApi();

  const services = { api, bus, notify, navigate, href, appName: UI_CONFIG.appName };
  const router = createRouter({
    root,
    services,
    fallback: appZone.notFound,
    onError: (outlet, error, retry) => renderPageError(outlet, error, retry),
  });

  router.addLayouts(appZone.layouts);
  router.addPages(appZone.pages);

  const zones = await Promise.all(ZONES.map((load) => load()
    .then((mod) => mod.default)
    .catch((error) => {
      console.warn('[app] zone not available yet:', error.message);
      return null;
    })));

  for (const zone of zones.filter(Boolean)) {
    router.addLayouts(zone.layouts ?? {});
    router.addPages(zone.pages ?? []);
  }

  await router.start();
}

boot().catch((error) => {
  console.error('[app] boot failed', error);
  renderPageError(document.getElementById('app'), error, () => window.location.reload());
});
