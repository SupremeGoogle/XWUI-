import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRouter } from './router.js';

class Surface {
  constructor(connected = false) { this.connected = connected; this.children = []; this.dataset = {}; }
  get isConnected() { return this.parent ? this.parent.isConnected : this.connected; }
  append(...children) { for (const child of children) { child.parent = this; this.children.push(child); } }
  replaceChildren(...children) { for (const child of this.children) child.parent = null; this.children = []; this.append(...children); }
}
const deferred = () => { let resolve, reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; };

function fixture() {
  const root = new Surface(true);
  const writes = [];
  const errors = [];
  globalThis.window = { location: { hash: '#/slow' }, scrollTo() {} };
  globalThis.document = { title: '', createElement: () => new Surface() };
  class Layout {
    constructor() { this.outlet = new Surface(); root.append(this.outlet); }
    setTopbar(value) { writes.push(value); }
    setActive() {}
  }
  const router = createRouter({ root, services: { appName: 'xwflow', navigate: value => writes.push(value), notify: { error: value => writes.push(value) } }, onError: (_el, error) => errors.push(error) });
  router.addLayouts({ studio: Layout });
  return { root, router, writes, errors };
}

test('late page cannot overwrite the current surface, title, topbar or navigation', async () => {
  const { root, router, writes } = fixture();
  const started = deferred(), finish = deferred();
  let disposed = false;
  router.addPages([
    { id: 'slow', path: '/slow', layout: 'studio', async mount(el, ctx) {
      started.resolve(ctx.signal); await finish.promise;
      el.append(new Surface()); ctx.setTitle('Old'); ctx.layout.setTopbar('Old'); ctx.navigate('/old'); ctx.notify.error('Old');
      return { unmount() { disposed = true; } };
    } },
    { id: 'new', path: '/new', layout: 'studio', title: 'New', async mount(el, ctx) { el.append(new Surface()); ctx.layout.setTopbar('New'); return { unmount() {} }; } },
  ]);
  const first = router.refresh();
  const signal = await started.promise;
  window.location.hash = '#/new'; await router.refresh();
  finish.resolve(); await first;
  assert.equal(signal.aborted, true);
  assert.equal(root.children[0].children.length, 1);
  assert.equal(root.children[0].children[0].dataset.route, '/new');
  assert.equal(root.children[0].children[0].children.length, 1);
  assert.equal(document.title, 'New · xwflow');
  assert.deepEqual(writes, ['New']);
  assert.equal(disposed, true);
});

test('late rejected page does not replace a successful page with an error', async () => {
  const { root, router, errors } = fixture();
  const started = deferred(), finish = deferred();
  router.addPages([
    { id: 'slow', path: '/slow', layout: 'studio', async mount() { started.resolve(); await finish.promise; } },
    { id: 'new', path: '/new', layout: 'studio', title: 'New', async mount(el) { el.append(new Surface()); } },
  ]);
  const first = router.refresh(); await started.promise;
  window.location.hash = '#/new'; await router.refresh();
  finish.reject(new Error('Late failure')); await first;
  assert.deepEqual(errors, []);
  assert.equal(root.children[0].children[0].dataset.route, '/new');
  assert.equal(document.title, 'New · xwflow');
});

test('malformed encoded route parameters resolve to the fallback instead of throwing', () => {
  const { router } = fixture();
  router.addPages([{ id: 'flow', path: '/studio/flows/:flowId' }]);
  assert.equal(router.match('/studio/flows/%ZZ'), null);
  assert.equal(router.match('/studio/flows/flow%20name').params.flowId, 'flow name');
});
