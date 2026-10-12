import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const store = new Map();
globalThis.localStorage = { getItem: key => store.get(key) ?? null, setItem: (key, value) => store.set(key, value) };
globalThis.window = { location: { search: '?mock=fast' } };
globalThis.fetch = async url => ({ ok: true, json: async () => JSON.parse(await readFile(new URL(url), 'utf8')) });
const { studioApi } = await import('./studio.api.js');
const { MOCK_CONFIG } = await import('../core/mock.config.js');

for (const resource of ['agents', 'tables', 'forms', 'variables', 'mcp', 'templates', 'insights', 'settings']) {
  test(`Studio ${resource}: read, search, cloned responses and every enabled mutation persist`, async () => {
    await verifyResource(studioApi, resource);
  });
}
async function verifyResource(api, resource) {
  const definition = await api.getResourceDefinition(resource);
  const initial = await api.listResources(resource);
  assert.ok(initial.items.length);
  const input = Object.fromEntries(definition.fields.map(field => [field.key,
    field.kind === 'json' ? '[]' : field.kind === 'https' ? 'https://example.com/demo' : field.kind === 'number' ? '12' : `QA ${field.key}`]));
  let record = definition.allowCreate ? await api.createResource(resource, input) : initial.items[0];
  const editable = definition.fields.find(field => !field.readOnly);
  if (editable) {
    const updated = await api.updateResource(resource, record.id, { [editable.key]: input[editable.key] });
    assert.equal(updated[editable.key], input[editable.key]); record = updated;
  }
  if (definition.allowToggle) {
    assert.equal((await api.toggleResource(resource, record.id, false)).enabled, false);
    assert.equal((await api.toggleResource(resource, record.id, true)).enabled, true);
    assert.equal((await api.listResources(resource, { status: 'enabled' })).items.some(row => row.id === record.id), true);
  }
  const exported = await api.exportResource(resource, record.id);
  assert.equal(JSON.parse(exported.content).id, record.id);
  if (definition.allowArchive) {
    await api.archiveResource(resource, record.id);
    assert.equal((await api.listResources(resource, { q: record.name })).items.some(row => row.id === record.id), false);
    assert.equal((await api.listResources(resource, { status: 'archived', q: record.name })).items.some(row => row.id === record.id), true);
    assert.equal((await api.archiveResource(resource, record.id, false)).archived, false);
  }
  const result = await api.listResources(resource, { q: record.name });
  assert.ok(result.items.some(row => row.id === record.id));
  result.items.find(row => row.id === record.id).name = 'Response modified';
  assert.notEqual((await api.listResources(resource, { q: record.name })).items.find(row => row.id === record.id).name, 'Response modified');
  assert.ok([...store.values()].some(json => JSON.parse(json)?.some?.(row => row.id === record.id)), 'Mutation must be mirrored to localStorage');
  await assert.rejects(api.updateResource(resource, 'missing-record', input), { code: 'not_found' });
}

test('resource validation rejects malformed values, unknown resources and failed writes without changing records', async () => {
  await assert.rejects(studioApi.getResourceDefinition('unknown'), { code: 'not_found' });
  await assert.rejects(studioApi.createResource('agents', {}), { code: 'invalid' });
  await assert.rejects(studioApi.createResource('mcp', { name: 'Bad URL', endpoint: 'https://user:secret@example.com/mcp', tools: '[]' }), { code: 'invalid' });
  await assert.rejects(studioApi.createResource('tables', { name: 'Bad JSON', columns: '{}', records: '[]' }), { code: 'invalid' });
  const record = (await studioApi.listResources('agents')).items[0];
  const before = JSON.parse((await studioApi.exportResource('agents', record.id)).content);
  const savedRandom = Math.random;
  const savedConfig = { ...MOCK_CONFIG };
  try {
    MOCK_CONFIG.enabled = true; MOCK_CONFIG.latency = { min: 0, max: 0 }; MOCK_CONFIG.failureMultiplier = 1; Math.random = () => 0;
    await assert.rejects(studioApi.updateResource('agents', record.id, { name: 'Failed' }, { fail: true }), { code: 'unavailable' });
  } finally { Object.assign(MOCK_CONFIG, savedConfig); Math.random = savedRandom; }
  assert.deepEqual(JSON.parse((await studioApi.exportResource('agents', record.id)).content), before);
});

test('template action creates an editable workflow from the selected template', async () => {
  const record = (await studioApi.listResources('templates')).items[0];
  const { id } = await studioApi.actOnResource('templates', record.id);
  const flow = await studioApi.getFlow(id);
  assert.equal(flow.name, record.name); assert.ok(flow.graph.nodes.length > 1); assert.equal(flow.publishedVersion, null);
});
