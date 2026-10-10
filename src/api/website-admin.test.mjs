import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

// These APIs intentionally run without a browser or a live backend.
const store = new Map();
globalThis.localStorage = {
  getItem: (key) => store.get(key) ?? null,
  setItem: (key, value) => store.set(key, value),
  removeItem: (key) => store.delete(key),
};
globalThis.window = { location: { search: '?mock=fast' } };
globalThis.fetch = async (url) => {
  const text = await readFile(new URL(url), 'utf8');
  return {
    ok: true,
    json: async () => JSON.parse(text),
    text: async () => text,
  };
};
const { adminApi } = await import('./admin.api.js');
const { websiteApi } = await import('./website.api.js');
const { MOCK_CONFIG } = await import('../core/mock.config.js');

test('directory filters, pagination, clones and manifest IDs', async () => {
  const result = await websiteApi.listIntegrations({
    category: 'data',
    pageSize: 1,
  });
  assert.equal(result.total, 2);
  assert.equal(result.items.length, 1);
  result.items[0].name = 'Changed outside the API';
  assert.notEqual(
    (await websiteApi.getIntegration(result.items[0].id)).name,
    result.items[0].name,
  );
  assert.equal(
    (await websiteApi.listIntegrations({ q: 'NOTHINGMATCHES' })).total,
    0,
  );
  const page = await websiteApi.getDirectory();
  assert.equal(page.assets[page.assetRefs.search].kind, 'illustration');
  assert.equal(page.assets[page.featured.assetId].kind, 'node');
});

test('brand validation rejects bad domains and preserves persisted values', async () => {
  const initial = (await adminApi.getBranding()).kit;
  await assert.rejects(adminApi.saveBrandKit({ ...initial, primary: 'pink' }), {
    code: 'validation',
  });
  await assert.rejects(
    adminApi.saveBrandKit({ domain: 'https://bad.example/path' }),
    { code: 'validation' },
  );
  await assert.rejects(adminApi.saveBrandKit({ logo: 'javascript:alert(1)' }), {
    code: 'validation',
  });
  const saved = await adminApi.saveBrandKit({
    productName: '  Example Flow  ',
    primary: '#2ee6ff',
    domain: 'flow.example.com',
  });
  assert.equal(saved.productName, 'Example Flow');
  assert.ok(saved.savedAt);
  const reloaded = (await import('./admin.api.js?reload=brand')).adminApi;
  assert.equal(
    (await reloaded.getBranding()).kit.productName,
    saved.productName,
  );
  assert.equal((await adminApi.getBrandingSample(1)).logo.id, 'sample-logo-2');
});

test('audit exports all matching rows and escapes formula-leading values', async () => {
  const page = await adminApi.listAuditEvents({ actor: 'You', pageSize: 1 });
  assert.ok(page.total > page.items.length);
  const csv = await adminApi.exportAudit({ actor: 'You', pageSize: 1 });
  assert.equal(csv.csv.trim().split('\r\n').length, page.total + 1);
  assert.ok(csv.csv.includes('"Example Flow"'));
  await adminApi.saveBrandKit({ productName: '=SUM(A1)' });
  assert.ok(
    (await adminApi.exportAudit({ q: '=SUM(A1)' })).csv.includes(
      '"\'=SUM(A1)"',
    ),
  );
  assert.equal(
    (await adminApi.listAuditEvents({ q: 'nothingmatches' })).total,
    0,
  );
});

test('SIEM accepts credential-free HTTPS and persists without network transfer', async () => {
  for (const endpoint of [
    'http://logs.example.com',
    'https://user:pass@logs.example.com',
    'invalid',
  ])
    await assert.rejects(
      adminApi.configureStreaming({ endpoint, enabled: true }),
      { code: 'validation' },
    );
  await adminApi.configureStreaming({
    endpoint: 'https://logs.example.com/events',
    enabled: true,
  });
  assert.equal((await adminApi.getAudit()).streamingConfig.enabled, true);
});

test('health recovery and operational actions are persistent and idempotent', async () => {
  const result = await adminApi.checkHealth();
  assert.ok(
    result.checks.every((item) => !['error', 'warning'].includes(item.variant)),
  );
  assert.equal(
    result.uptime.find((row) => row.label === 'Storage').days.at(-1),
    'success',
  );
  await adminApi.pauseSchedules();
  await adminApi.drainWorker();
  const total = (await adminApi.listAuditEvents({ days: 'all' })).total;
  await adminApi.pauseSchedules();
  await adminApi.drainWorker();
  assert.equal((await adminApi.listAuditEvents({ days: 'all' })).total, total);
  const refreshed = await adminApi.checkHealth();
  assert.equal(
    refreshed.checks.find((item) => item.id === 'scheduler').status,
    'Paused',
  );
  assert.deepEqual(refreshed.drainedWorkers, ['worker-3']);
});

test('access requests are idempotent and quote form validates required fields', async () => {
  const first = await adminApi.requestAccess();
  const second = await adminApi.requestAccess();
  assert.deepEqual(first, second);
  assert.equal(first.status, 'pending');
  await assert.rejects(
    websiteApi.requestQuote({ email: 'bad', notes: 'Demo' }),
    { code: 'validation' },
  );
  await assert.rejects(
    websiteApi.requestQuote({ email: 'test@example.com', notes: '' }),
    { code: 'validation' },
  );
  assert.ok(
    (
      await websiteApi.requestQuote({
        email: 'test@example.com',
        notes: 'Demo',
      })
    ).id,
  );
});

test('forced panel failure is independent and mutations leave state unchanged', async () => {
  MOCK_CONFIG.enabled = true;
  MOCK_CONFIG.latency = { min: 0, max: 0 };
  const previous = (await adminApi.getBranding()).kit.productName;
  try {
    await assert.rejects(adminApi.getKpis({ fail: true }), {
      code: 'unavailable',
    });
    assert.ok((await adminApi.getRunsByHour()).hours.length);
    await assert.rejects(
      adminApi.saveBrandKit({ productName: 'Lost update' }, { fail: true }),
      { code: 'unavailable' },
    );
    assert.equal((await adminApi.getBranding()).kit.productName, previous);
  } finally {
    MOCK_CONFIG.enabled = false;
  }
});
