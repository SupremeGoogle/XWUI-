import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const store = new Map();
globalThis.localStorage = { getItem: (key) => store.get(key) ?? null, setItem: (key, value) => store.set(key, value) };
globalThis.window = { location: { search: '?mock=fast' } };
globalThis.fetch = async (url) => ({ ok: true, json: async () => JSON.parse(await readFile(new URL(url), 'utf8')) });
const { studioApi } = await import('./studio.api.js');
const { MOCK_CONFIG } = await import('../core/mock.config.js');

async function complete(id) {
  const now = Date.now;
  Date.now = () => now() + 60000;
  try { return await studioApi.getRun(id); } finally { Date.now = now; }
}

test('published versions and receipts survive later draft edits and flow deletion', async () => {
  const flow = await studioApi.getFlow('flow_order_alert');
  const graph = structuredClone(flow.graph);
  graph.nodes[0].name = 'Edited draft trigger';
  await studioApi.saveDraft(flow.id, graph);
  assert.equal((await studioApi.getFlow(flow.id)).statusKey, 'changes');
  const { id } = await studioApi.startRun(flow.id, { mode: 'production' });
  const receipt = await complete(id);
  assert.equal(receipt.version, 3);
  assert.equal(receipt.ledger[0].stepName, flow.graph.nodes[0].name);
  await studioApi.deleteFlow(flow.id);
  const afterDelete = await studioApi.getRun(id);
  assert.equal(afterDelete.flowName, flow.name);
  assert.equal(afterDelete.stepsTotal, flow.graph.nodes.length);
  assert.deepEqual(afterDelete.ledger, receipt.ledger);
});

test('publish snapshots, restore changes only the draft, and production requires publication', async () => {
  const { id } = await studioApi.createFlow({ name: 'Snapshot test' });
  await assert.rejects(studioApi.startRun(id, { mode: 'production' }), { code: 'not_published' });
  const original = await studioApi.getFlow(id);
  await studioApi.publishFlow(id, { note: 'First version' });
  const edited = structuredClone(original.graph);
  edited.nodes[0].name = 'Version two trigger';
  await studioApi.saveDraft(id, edited);
  const published = await studioApi.publishFlow(id);
  assert.equal(published.version, 2);
  await studioApi.restoreVersion(id, 1);
  const restored = await studioApi.getFlow(id);
  assert.equal(restored.publishedVersion, 2);
  assert.equal(restored.statusKey, 'changes');
  assert.equal(restored.graph.nodes[0].name, original.graph.nodes[0].name);
  const run = await studioApi.startRun(id, { mode: 'production' });
  assert.equal((await complete(run.id)).ledger[0].stepName, 'Version two trigger');
});

test('retry from a step reuses earlier payloads and assigns unique receipt sequences', async () => {
  const source = await studioApi.getRun('run_weekly_digest_014');
  const step = source.ledger.find((row) => row.result === 'failed');
  const first = await studioApi.retryFromStep(source.id, step.nodeId);
  const second = await studioApi.retryFromStep(source.id, step.nodeId);
  const a = await complete(first.id);
  const b = await complete(second.id);
  assert.equal(a.retryOf, source.id);
  assert.equal(a.ledger[0].result, 'pinned');
  assert.deepEqual(a.ledger[0].output, source.ledger[0].output);
  assert.ok(b.sequence > a.sequence);
  assert.ok((await studioApi.listRuns({ days: null })).items.some((run) => run.id === b.id));
});

test('catalog copy and assets come through the API; response mutation cannot change the seed', async () => {
  const catalog = await studioApi.getCatalog();
  assert.equal(catalog.assets[catalog.assetRefs.emptyFlows].kind, 'illustration');
  catalog.copy.flows.title = 'Caller mutation';
  assert.equal((await studioApi.getCatalog()).copy.flows.title, 'Flows');
  assert.equal((await studioApi.getNotationGallery()).items.length, 24);
});

test('simulated failure leaves an unpublished draft unchanged', async () => {
  const { id } = await studioApi.createFlow({ name: 'Failure test' });
  const random = Math.random;
  MOCK_CONFIG.enabled = true;
  Math.random = () => 0;
  try {
    await assert.rejects(studioApi.publishFlow(id), { code: 'unavailable' });
    assert.equal((await studioApi.getFlow(id)).publishedVersion, null);
  } finally { MOCK_CONFIG.enabled = false; Math.random = random; }
});

test('every directory step resolves to an addable Studio type and a live demo flow', async () => {
  const { websiteApi } = await import('./website.api.js');
  const directory = await websiteApi.listIntegrations({ pageSize: 100 });
  const catalog = await studioApi.getCatalog();
  const index = Object.fromEntries(catalog.nodeTypes.map(type => [type.id, type]));
  for (const item of directory.items) {
    assert.ok(index[item.nodeType]?.palette, item.id);
    assert.equal(new URLSearchParams(item.path.split('?')[1]).get('nodeType'), item.nodeType);
    assert.ok(catalog.assets[catalog.assetRefs.emptyFlows]);
  }
  // The earlier deletion test removed the original sample: the shell must select
  // an existing demo rather than return an obsolete fixed identifier.
  const shell = await studioApi.getShell();
  assert.ok((await studioApi.getFlow(shell.demoFlowId)).id);
});

test('AI verdicts route only their branch and keep model/token metadata without the prompt', async () => {
  const { simulateRun } = await import('./studio.engine.js');
  const catalog = await studioApi.getCatalog();
  const types = Object.fromEntries(catalog.nodeTypes.map(type => [type.id, type]));
  for (const verdict of ['yes', 'no', 'unsure']) {
    const graph = {
      nodes: [{ id: 'trigger', type: 'webhook' }, { id: 'ai', type: 'ai_condition', params: { demoVerdict: verdict, question: 'Private prompt', model: 'Careful' } }, ...types.ai_condition.ports.map(port => ({ id: port, type: 'code' }))],
      edges: [{ from: 'trigger', to: 'ai', port: 'out' }, ...types.ai_condition.ports.map(port => ({ from: 'ai', to: port, port }))],
    };
    const run = simulateRun({ graph, types, payload: { order: { total: 600 } } });
    assert.equal(run.status, 'succeeded');
    const row = run.ledger.find(row => row.nodeId === 'ai');
    assert.equal(row.result, `took_${verdict}`);
    assert.deepEqual(row.output, { branch: verdict, verdict, model: 'Careful', tokenCount: 64 });
    assert.ok(!JSON.stringify(row).includes('Private prompt'));
    for (const port of types.ai_condition.ports) assert.equal(run.ledger.find(row => row.nodeId === port).result, port === verdict ? 'succeeded' : 'not_run');
  }
});

test('field-change trigger and switch execute the matching case or default', async () => {
  const { simulateRun } = await import('./studio.engine.js');
  const types = Object.fromEntries((await studioApi.getCatalog()).nodeTypes.map(type => [type.id, type]));
  const graph = {
    nodes: [{ id: 'trigger', type: 'field_changed' }, { id: 'switch', type: 'switch', params: { path: 'order.priority', case_1: 'high', case_2: 'normal' } }, ...types.switch.ports.map(port => ({ id: port, type: 'code' }))],
    edges: [{ from: 'trigger', to: 'switch', port: 'out' }, ...types.switch.ports.map(port => ({ from: 'switch', to: port, port }))],
  };
  for (const [priority, chosen] of [['high', 'case_1'], ['normal', 'case_2'], ['other', 'default']]) {
    const run = simulateRun({ graph, types, payload: { order: { priority } } });
    assert.equal(run.ledger.find(row => row.nodeId === 'switch').output.branch, chosen);
    for (const port of types.switch.ports) assert.equal(run.ledger.find(row => row.nodeId === port).result, port === chosen ? 'succeeded' : 'not_run');
  }
});

test('sub-flow respects publication, records the child result and rejects recursive calls', async () => {
  const { id: childId } = await studioApi.createFlow({ name: 'Child' });
  const { id: parentId } = await studioApi.createFlow({ name: 'Parent' });
  const parent = await studioApi.getFlow(parentId);
  const trigger = parent.graph.nodes[0];
  const child = { id: 'child', type: 'sub_flow', name: 'Call child', x: 400, y: 200, params: { flowId: childId, mode: 'Published version' } };
  const graph = { ...parent.graph, nodes: [trigger, child], edges: [{ id: 'child-edge', from: trigger.id, to: child.id, port: 'out' }] };
  await studioApi.saveDraft(parentId, graph);
  const unpublished = await complete((await studioApi.startRun(parentId)).id);
  assert.equal(unpublished.status, 'failed');
  assert.match(unpublished.ledger[1].error.message, /Publish/);
  await studioApi.publishFlow(childId);
  const successful = await complete((await studioApi.startRun(parentId)).id);
  assert.equal(successful.status, 'succeeded');
  assert.equal(successful.ledger[1].output.flowId, childId);
  assert.equal(successful.ledger[1].output.ledger[0].result, 'succeeded');
  await studioApi.saveDraft(parentId, { ...graph, nodes: [trigger, { ...child, params: { flowId: parentId, mode: 'Current draft' } }] });
  const recursive = await complete((await studioApi.startRun(parentId)).id);
  assert.equal(recursive.status, 'failed');
  assert.match(JSON.stringify(recursive.ledger), /Recursive/);
});
