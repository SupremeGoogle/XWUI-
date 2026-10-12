/**
 * Hash router with layouts.
 *
 * Page module:  { id, path, layout, title, async mount(el, ctx) -> { unmount() } }
 * Layout class: new Layout(root, ctx); .outlet; .setActive(route); .destroy()
 *
 * URL shape: #/path/with/:params?query=1. The `section` query param scrolls to the
 * element with that id once the page mounted (in-page anchors without breaking routing).
 */
import { bus, BUS_EVENTS } from './bus.js';

function compile(path) {
  const keys = [];
  const pattern = path
    .replace(/\/+$/, '')
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    .replace(/:(\w+)/g, (_, key) => {
      keys.push(key);
      return '([^/]+)';
    });
  return { regex: new RegExp(`^${pattern || ''}/?$`), keys };
}

export function parseHash(hash = window.location.hash) {
  const raw = hash.replace(/^#/, '') || '/';
  const [pathPart, queryPart = ''] = raw.split('?');
  const path = pathPart.startsWith('/') ? pathPart : `/${pathPart}`;
  return { path, query: Object.fromEntries(new URLSearchParams(queryPart)) };
}

/** Build a hash href: href('/studio/runs/:runId', { runId: 'r1' }, { tab: 'ledger' }) */
export function href(path, params = {}, query = {}) {
  const filled = path.replace(/:(\w+)/g, (_, key) => encodeURIComponent(params[key] ?? `:${key}`));
  const qs = new URLSearchParams(Object.entries(query).filter(([, v]) => v !== undefined && v !== null && v !== '')).toString();
  return `#${filled}${qs ? `?${qs}` : ''}`;
}

export function navigate(path, { replace = false } = {}) {
  const target = path.startsWith('#') ? path : `#${path}`;
  if (replace) window.location.replace(target);
  else window.location.hash = target;
}

export function createRouter({ root, services, fallback, onError }) {
  const routes = [];
  const layouts = new Map();
  let activeLayout = null;
  let activeLayoutId = null;
  let activePage = null;
  let token = 0;
  let pendingController = null;

  function addPages(pages) {
    for (const page of pages) routes.push({ page, ...compile(page.path) });
  }

  function addLayouts(map) {
    for (const [id, Layout] of Object.entries(map)) layouts.set(id, Layout);
  }

  function match(path) {
    for (const route of routes) {
      const m = route.regex.exec(path.replace(/\/+$/, '') || '/');
      if (m) {
        let params;
        try { params = Object.fromEntries(route.keys.map((k, i) => [k, decodeURIComponent(m[i + 1])])); }
        catch { return null; }
        return { page: route.page, params };
      }
    }
    return null;
  }

  async function teardownPage() {
    if (!activePage) return;
    const previous = activePage;
    activePage = null;
    try {
      await previous.unmount?.();
    } catch (error) {
      console.error('[router] unmount failed', error);
    }
  }

  function useLayout(layoutId, routeInfo) {
    if (layoutId === activeLayoutId && activeLayout) return activeLayout;
    activeLayout?.destroy?.();
    root.replaceChildren();
    activeLayout = null;
    activeLayoutId = layoutId;
    if (!layoutId) return null;
    const Layout = layouts.get(layoutId);
    if (!Layout) {
      console.warn(`[router] layout "${layoutId}" is not registered; rendering the page without it`);
      return null;
    }
    activeLayout = new Layout(root, { ...services, route: routeInfo });
    return activeLayout;
  }

  async function render() {
    const current = ++token;
    pendingController?.abort();
    const controller = new AbortController();
    pendingController = controller;
    const { path, query } = parseHash();
    const found = match(path) ?? { page: fallback, params: {} };
    const route = { path, query, params: found.params, page: found.page };

    await teardownPage();
    if (current !== token) return;

    const layout = useLayout(found.page.layout ?? null, route);
    const outlet = layout?.outlet ?? root;
    // A late mount can only write into its own detached surface.
    const surface = document.createElement('div');
    surface.className = 'xwf-route-page';
    surface.dataset.route = path;
    outlet.replaceChildren(surface);
    layout?.setActive?.(route);
    const isActive = () => current === token && !controller.signal.aborted && surface.isConnected;
    const guardedLayout = layout && new Proxy(layout, {
      get(target, key) {
        const value = Reflect.get(target, key);
        return typeof value === 'function' ? (...args) => isActive() ? value.apply(target, args) : undefined : value;
      },
    });

    const ctx = {
      ...services,
      route,
      params: found.params,
      query,
      layout: guardedLayout,
      signal: controller.signal,
      isActive,
      notify: services.notify && new Proxy(services.notify, {
        get(target, key) {
          const value = Reflect.get(target, key);
          return typeof value === 'function' ? (...args) => { if (isActive()) return value.apply(target, args); } : value;
        },
      }),
      navigate: (...args) => { if (isActive()) return services.navigate(...args); },
      setTitle: (title) => { if (isActive()) document.title = title ? `${title} · ${services.appName}` : services.appName; },
    };
    ctx.setTitle(found.page.title);

    try {
      const handle = await found.page.mount(surface, ctx);
      if (!isActive()) {
        await handle?.unmount?.();
        return;
      }
      activePage = handle ?? null;
      bus.emit(BUS_EVENTS.ROUTE_CHANGED, route);
      if (query.section) {
        requestAnimationFrame(() => { if (isActive()) document.getElementById(query.section)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); });
      } else {
        window.scrollTo({ top: 0 });
      }
    } catch (error) {
      if (!isActive()) return;
      console.error(`[router] page "${found.page.id}" failed to mount`, error);
      onError?.(surface, error, () => render());
    }
  }

  return {
    addPages,
    addLayouts,
    match,
    start() {
      window.addEventListener('hashchange', render);
      if (!window.location.hash) window.location.replace('#/');
      return render();
    },
    refresh: render,
  };
}
