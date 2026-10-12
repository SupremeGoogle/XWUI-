import { createResourceApi } from './resources.api.js';
import { STUDIO_RESOURCES } from '../data/studio/resources.data.js';
/**
 * Studio dummy API: flows, versions, runs, connections, assistant drafts.
 * Every method is async, adds latency, returns clones and persists mutations.
 */
import {
  respond, createCollection, createDocument, paginate, matches, ApiError, newId, nowIso, clone,
} from '../core/mock.js';
import * as db from '../data/studio.data.js';
import { simulateRun, progressAt } from './studio.engine.js';
import { gallery } from '../data/notations.data.js';
import { resolveAssets } from './assets.api.js';
import { STUDIO_COPY } from '../data/studio-copy.data.js';
import { STUDIO_SEARCH } from '../data/studio-search.data.js';

/* ------------------------------------------------------------ seeding */

const MS = { seconds: 1e3, minutes: 6e4, hours: 36e5, days: 864e5 };

/** { minutes: 2 } -> ISO date that far in the past */
function ago(offset, base = Date.now()) {
  if (!offset) return null;
  const ms = Object.entries(offset).reduce((sum, [unit, n]) => sum + (MS[unit] ?? 0) * n, 0);
  return new Date(base - ms).toISOString();
}

const typeIndex = Object.fromEntries(db.nodeTypes.map((t) => [t.id, t]));

const flows = createCollection('studio.flows', db.flows.map((f) => {
  const { updated, ...rest } = f;
  return { ...rest, updatedAt: ago(updated), createdAt: ago({ days: 30 }) };
}), { idPrefix: 'flow' });

const versions = createCollection('studio.versions', db.versions.map((v) => {
  const { published, ...rest } = v;
  const flow = db.flows.find((f) => f.id === v.flowId);
  return { ...rest, id: `${v.flowId}@${v.version}`, publishedAt: ago(published), graph: clone(flow.graph) };
}), { idPrefix: 'ver' });

const runs = createCollection('studio.runs', db.runs.map((r) => {
  const { started, ...rest } = r;
  const flow = db.flows.find((f) => f.id === r.flowId);
  return { ...rest, flowName: flow?.name, graph: clone(flow?.graph), startedAt: ago(started) };
}), { idPrefix: 'run' });

const connections = createCollection('studio.connections', db.connections.map((c) => {
  const { lastUsed, expired, expiresIn, ...rest } = c;
  return { ...rest, lastUsedAt: ago(lastUsed), expiredAt: ago(expired), expiresAt: expiresIn ? ago(Object.fromEntries(Object.entries(expiresIn).map(([k, v]) => [k, -v]))) : null };
}), { idPrefix: 'conn' });

function shapeConnection(c) {
  const owner = userById(c.ownerId);
  const days = c.expiresAt ? Math.max(0, Math.ceil((new Date(c.expiresAt).getTime() - Date.now()) / MS.days)) : null;
  return {
    ...c,
    ownerName: owner.name,
    daysLeft: days,
    usedBy: c.usedByFlowIds.map((id) => flows.get(id)).filter(Boolean).map((f) => ({ id: f.id, name: f.name })),
  };
}

const ui = createDocument('studio.ui', { recommendedHidden: false });

/* ------------------------------------------------------------ helpers */

const userById = (id) => db.users.find((u) => u.id === id) ?? db.users[0];

function flowStatusKey(flow) {
  if (!flow.publishedVersion) return 'draft';
  return flow.draftChanged ? 'changes' : 'published';
}

function runsOfFlow(flowId) {
  return runs.list((r) => r.flowId === flowId).sort((a, b) => b.startedAt.localeCompare(a.startedAt));
}

/** A live run reports the state its simulated clock has reached. */
function materializeRun(run) {
  if (!run.live) return run;
  const elapsed = Date.now() - new Date(run.startedAt).getTime();
  if (elapsed >= run.plannedDurationMs) {
    const done = { ...run, live: false, status: run.plannedStatus, durationMs: run.plannedRecordedMs ?? run.plannedDurationMs };
    delete done.plannedStatus;
    delete done.plannedDurationMs;
    delete done.plannedRecordedMs;
    runs.update(run.id, done);
    return done;
  }
  return { ...run, status: 'running', durationMs: null, ledger: progressAt(run.ledger, elapsed).filter((r) => !r.hidden) };
}

function summarizeFlow(flow) {
  const latest = runsOfFlow(flow.id).map(materializeRun)[0] ?? null;
  const owner = userById(flow.ownerId);
  const statusKey = flowStatusKey(flow);
  return {
    id: flow.id,
    name: flow.name,
    folder: flow.folder,
    description: flow.description,
    statusKey,
    status: db.flowStatuses[statusKey],
    chain: flow.graph.nodes.map((n) => typeIndex[n.type]?.tone ?? 'violet'),
    steps: flow.graph.nodes.length,
    lastRun: latest ? { id: latest.id, status: latest.status, startedAt: latest.startedAt } : null,
    nextRun: statusKey === 'draft' || flow.scheduleEnabled === false ? null : flow.trigger,
    owner: { id: owner.id, name: owner.name, gradient: owner.gradient },
    updatedAt: flow.updatedAt,
    publishedVersion: flow.publishedVersion,
  };
}

function shapeRun(run) {
  const flow = flows.get(run.flowId);
  const graph = run.graph ?? versions.get(`${run.flowId}@${run.version}`)?.graph ?? flow?.graph;
  const nodeName = (id) => graph?.nodes.find((n) => n.id === id)?.name ?? id;
  const live = materializeRun(run);
  const stepIds = new Set((graph?.nodes ?? []).map((n) => n.id));
  const recorded = new Set(live.ledger.filter((l) => l.attempt > 0 && l.result !== 'running').map((l) => l.nodeId));
  return {
    ...live,
    flowName: run.flowName ?? flow?.name ?? 'Deleted flow',
    ledger: live.ledger.map((row, index) => ({ ...row, index: index + 1, stepName: nodeName(row.nodeId), nodeType: graph?.nodes.find((n) => n.id === row.nodeId)?.type })),
    stepsTotal: stepIds.size,
    stepsRecorded: recorded.size,
    previousRunId: runsOfFlow(run.flowId).find(other => other.id !== run.id && other.startedAt < run.startedAt)?.id ?? null,
  };
}

/* ------------------------------------------------------------ API */

function subFlowSnapshots() {
  return Object.fromEntries(flows.list().map(flow => [flow.id, {
    graph: flow.graph,
    publishedGraph: flow.publishedVersion ? versions.get(`${flow.id}@${flow.publishedVersion}`)?.graph : null,
  }]));
}

/** Internal API projection: use a surviving sample if the original demo was deleted. */
export function getDemoFlowId() {
  return flows.get(gallery.demoFlowId)?.id ?? flows.list()[0]?.id ?? null;
}

const resourceApi = createResourceApi({
  namespace: 'studio_resources', definitions: STUDIO_RESOURCES,
  derive: (id) => {
    if (id === 'templates') return db.templates.map(item => ({ id: item.id, name: item.name, description: item.steps.map(step => step.name).join(' / '), templateId: item.id }));
    if (id === 'insights') {
      const all = runs.list().map(materializeRun);
      return ['succeeded', 'failed', 'waiting', 'running'].map(status => ({ id: status, name: db.runStatuses[status].label, value: String(all.filter(run => run.status === status).length), description: STUDIO_RESOURCES.insights.description }));
    }
    return null;
  },
  action: (id, record) => {
    if (id !== 'templates') throw new ApiError('invalid', STUDIO_RESOURCES.templates.description);
    return studioApi.createFlow({ templateId: record.templateId, name: record.name });
  },
});
export const studioApi = {
  ...resourceApi,
  /** Rail, top bar and project chrome. */
  getShell: () => respond(() => ({
    nav: db.studioNav,
    project: db.project,
    chats: db.chats,
    user: userById(db.currentUserId),
    usage: { ...db.usage, periodEndsAt: ago({ days: -db.usage.periodEnds.days }) },
    tabs: db.projectTabs,
    demoFlowId: getDemoFlowId(),
  }), { latency: [120, 260] }),

  /** Static catalog: step types, groups, lanes, labels, notations. */
  getSearchCopy: () => respond(() => STUDIO_SEARCH),

  getCatalog: () => respond(async () => ({
    copy: STUDIO_COPY,
    assetRefs: db.studioAssetRefs,
    assets: await resolveAssets(Object.values(db.studioAssetRefs)),
    nodeGroups: db.nodeGroups,
    nodeTypes: db.nodeTypes,
    lanes: db.lanes,
    runStatuses: db.runStatuses,
    runModes: db.runModes,
    stepResults: db.stepResults,
    payloadLabels: db.payloadLabels,
    flowStatuses: db.flowStatuses,
    connectionStatuses: db.connectionStatuses,
    notations: db.notations,
  }), { latency: [80, 200] }),

  /**
   * @param {{ q?: string, status?: 'all'|'published'|'changes'|'draft', folder?: string }} filters
   */
  listFlows: ({ q = '', status = 'all', folder = 'all' } = {}) => respond(() => {
    const all = flows.list().map(summarizeFlow);
    const items = all.filter((f) => matches(f, q, ['name', 'folder'])
      && (status === 'all' || f.statusKey === status)
      && (folder === 'all' || f.folder === folder));
    const dayAgo = Date.now() - MS.days;
    const recentRuns = runs.list().map(materializeRun);
    return {
      items,
      total: all.length,
      folders: [...new Set(all.map((f) => f.folder))].sort(),
      kpis: {
        published: all.filter((f) => f.statusKey === 'published').length,
        running: recentRuns.filter((r) => r.status === 'running').length,
        failed24h: recentRuns.filter((r) => r.status === 'failed' && new Date(r.startedAt).getTime() > dayAgo).length,
        drafts: all.filter((f) => f.statusKey === 'draft').length,
      },
    };
  }),

  getBackupSnapshot: () => respond(() => ({ flows: flows.all(), versions: versions.all(), runs: runs.all().map(shapeRun) })),

  setScheduleEnabled: (id, enabled) => respond(() => {
    const flow = flows.require(id);
    if (typeof enabled !== 'boolean' || !flow.graph.nodes.some(node => node.type === 'schedule')) throw new ApiError('invalid', STUDIO_COPY.runs.modeFilter);
    flows.update(id, { scheduleEnabled: enabled, updatedAt: nowIso() });
    return { id, enabled };
  }),

  getFlow: (id) => respond(() => {
    const flow = flows.require(id);
    return {
      ...flow,
      statusKey: flowStatusKey(flow),
      versions: versions.list((v) => v.flowId === id).sort((a, b) => b.version - a.version)
        .map(({ graph, ...v }) => ({ ...v, publishedByName: userById(v.publishedBy).name })),
      lastRun: runsOfFlow(id).map(shapeRun)[0] ?? null,
    };
  }),

  /** Save the editable draft graph (positions, params, structure). */
  saveDraft: (id, graph) => respond(() => {
    const flow = flows.update(id, { graph, draftChanged: true, updatedAt: nowIso() });
    return { id: flow.id, statusKey: flowStatusKey(flow), updatedAt: flow.updatedAt };
  }, { latency: [120, 300], failRate: 0.02 }),

  /** Publish the draft as a new immutable version. */
  publishFlow: (id, { note = '' } = {}) => respond(() => {
    const flow = flows.require(id);
    const problems = flow.graph.nodes.filter((n) => !typeIndex[n.type]);
    if (problems.length) throw new ApiError('invalid', 'Some steps have an unknown type.');
    const version = (flow.publishedVersion ?? 0) + 1;
    versions.create({
      id: `${id}@${version}`, flowId: id, version, publishedBy: db.currentUserId, publishedAt: nowIso(),
      note, graph: clone(flow.graph),
    });
    flows.update(id, { publishedVersion: version, draftChanged: false, updatedAt: nowIso() });
    return { id, version, statusKey: 'published' };
  }, { latency: [500, 900], failRate: 0.03 }),

  /** Replace the draft with a published version's graph. */
  restoreVersion: (id, version) => respond(() => {
    const snapshot = versions.require(`${id}@${version}`);
    flows.update(id, { graph: clone(snapshot.graph), draftChanged: true, updatedAt: nowIso() });
    return { id, version };
  }, { latency: [300, 600] }),

  createFlow: ({ name, folder, templateId } = {}) => respond(() => {
    const template = db.templates.find((t) => t.id === templateId);
    const graph = template ? graphFromTemplate(template) : graphFromTemplate({ steps: [{ type: 'webhook', name: typeIndex.webhook.label }] });
    const flow = flows.create({
      id: newId('flow'), name: name || template?.name || 'Untitled flow', folder: folder || db.flows[0].folder,
      ownerId: db.currentUserId, description: template?.name ?? '', trigger: 'On webhook',
      publishedVersion: null, draftChanged: true, samplePayload: clone(db.flows[0].samplePayload),
      graph, createdAt: nowIso(), updatedAt: nowIso(),
    });
    return { id: flow.id };
  }, { latency: [300, 600] }),

  duplicateFlow: (id) => respond(() => {
    const flow = flows.require(id);
    const copy = flows.create({
      ...clone(flow), id: newId('flow'), name: `${flow.name} (copy)`, publishedVersion: null, draftChanged: true,
      createdAt: nowIso(), updatedAt: nowIso(),
    });
    return { id: copy.id };
  }),

  deleteFlow: (id) => respond(() => {
    flows.require(id);
    flows.remove(id);
    return { id };
  }, { failRate: 0.02 }),

  /* ------------------------------ runs */

  /**
   * @param {{ q?: string, status?: string, mode?: string, days?: number|null, flowId?: string, page?: number, pageSize?: number }} filters
   */
  listRuns: ({ q = '', status = 'all', mode = 'all', days = 7, flowId = null, page = 1, pageSize = 20 } = {}) => respond(() => {
    const since = days ? Date.now() - days * MS.days : 0;
    const all = runs.list().map(shapeRun).sort((a, b) => b.startedAt.localeCompare(a.startedAt));
    const inWindow = all.filter((r) => new Date(r.startedAt).getTime() >= since);
    const filtered = inWindow.filter((r) => matches(r, q, ['flowName', 'shortId'])
      && (status === 'all' || r.status === status || (status === 'succeeded' && r.status === 'succeeded_after_retry'))
      && (mode === 'all' || r.mode === mode)
      && (!flowId || r.flowId === flowId));
    const week = all.filter((r) => new Date(r.startedAt).getTime() >= Date.now() - 7 * MS.days);
    return {
      ...paginate(filtered.map(({ ledger, ...r }) => r), { page, pageSize }),
      kpis: {
        runningNow: all.filter((r) => r.status === 'running').length,
        waitingNow: all.filter((r) => r.status === 'waiting').length,
        liveNow: all.filter((r) => r.live).length,
        succeeded7d: week.filter((r) => r.status.startsWith('succeeded')).length,
        failed7d: week.filter((r) => r.status === 'failed').length,
        asOf: nowIso(),
      },
      perHour: db.runsPerHour,
    };
  }),

  getRun: (id) => respond(() => {
    const run = shapeRun(runs.require(id));
    const previous = runsOfFlow(run.flowId).find((r) => r.id !== id && r.startedAt < run.startedAt) ?? null;
    return { ...run, previousRunId: previous?.id ?? null };
  }, { latency: [150, 350] }),

  /**
   * Start a run of the flow's current draft (test) or published version (production).
   * The engine plans the whole run now; getRun() reveals it step by step in real time.
   */
  startRun: (flowId, { mode = 'test', stopAtNodeId = null, retryOf = null } = {}) => respond(() => {
    const flow = flows.require(flowId);
    if (mode === 'production' && !flow.publishedVersion) throw new ApiError('not_published', 'Publish the flow before running it in production.');
    const graph = mode === 'production' ? versions.require(`${flowId}@${flow.publishedVersion}`).graph : flow.graph;
    const snapshots = subFlowSnapshots();
    const inputPayload = clone(flow.samplePayload ?? {});
    const plan = simulateRun({ graph, types: typeIndex, payload: inputPayload, stopAtNodeId, subFlows: snapshots });
    const sequence = runsOfFlow(flowId).reduce((max, r) => Math.max(max, r.sequence ?? 0), 0) + 1;
    const run = runs.create({
      id: newId(`run_${flowId.replace(/^flow_/, '')}`),
      shortId: `r_${Math.random().toString(16).slice(2, 6)}`,
      flowId, flowName: flow.name, graph: clone(graph), version: flow.publishedVersion, mode, retryOf, sequence,
      startedAt: nowIso(), live: true, status: 'running', durationMs: null,
      plannedStatus: plan.status, plannedRecordedMs: plan.durationMs, plannedDurationMs: Math.max(plan.durationMs, 600), ledger: plan.ledger,
      sampleData: mode === 'test',
      inputPayload, subFlows: snapshots, stopAtNodeId, pendingWait: plan.pendingWait, waitDecisions: {},
    });
    return { id: run.id };
  }, { latency: [250, 450] }),

  /** Resolve exactly one pending reply; identical repeats are idempotent. */
  resolveWait: (runId, stepId, decision) => respond(() => {
    if (!['approve', 'reject'].includes(decision)) throw new ApiError('validation', 'Choose approve or reject.');
    const source = materializeRun(runs.require(runId));
    const existing = source.waitDecisions?.[stepId];
    if (existing) {
      if (existing.decision !== decision) throw new ApiError('already_resolved', 'This wait already has a different decision.');
      return shapeRun(source);
    }
    if (source.status !== 'waiting' || source.pendingWait?.stepId !== stepId) throw new ApiError('not_waiting', 'This step is not waiting for a reply.');
    const actor = userById(db.currentUserId);
    const waitDecisions = { ...source.waitDecisions, [stepId]: {
      decision, actorId: actor.id, actorName: actor.name, resolvedAt: nowIso(),
      offsetMs: Math.max(source.durationMs ?? 0, Date.now() - new Date(source.startedAt).getTime()),
    } };
    const plan = simulateRun({ graph: source.graph, types: typeIndex,
      payload: source.inputPayload ?? flows.get(source.flowId)?.samplePayload ?? {},
      subFlows: source.subFlows ?? subFlowSnapshots(), historyRows: source.ledger,
      waitDecisions, stopAtNodeId: source.stopAtNodeId,
    });
    const next = runs.update(runId, { ledger: plan.ledger, status: plan.status, durationMs: plan.durationMs,
      live: false, pendingWait: plan.pendingWait, waitDecisions });
    return shapeRun(next);
  }, { latency: [200, 400], failRate: 0.03 }),

  /** Retry runs (each becomes a new run in "retry" mode). */
  retryRuns: (ids) => respond(() => ids.map((id) => {
    const source = runs.require(id);
    const flow = flows.require(source.flowId);
    const graph = source.graph ?? versions.get(`${source.flowId}@${source.version}`)?.graph ?? flow.graph;
    const inputPayload = clone(source.inputPayload ?? flow.samplePayload ?? {});
    const snapshots = clone(source.subFlows ?? subFlowSnapshots());
    const plan = simulateRun({ graph, types: typeIndex, payload: inputPayload, subFlows: snapshots });
    return runs.create({
      id: newId(`run_${source.flowId.replace(/^flow_/, '')}`),
      shortId: `r_${Math.random().toString(16).slice(2, 6)}`,
      flowId: source.flowId, flowName: source.flowName ?? flow.name, graph: clone(graph), version: source.version, mode: 'retry', retryOf: id,
      sequence: runsOfFlow(source.flowId).reduce((max, r) => Math.max(max, r.sequence ?? 0), 0) + 1, startedAt: nowIso(), live: true, status: 'running', durationMs: null,
      plannedStatus: plan.status, plannedRecordedMs: plan.durationMs, plannedDurationMs: Math.max(plan.durationMs, 600), ledger: plan.ledger, pendingWait: plan.pendingWait,
      inputPayload, subFlows: snapshots, waitDecisions: {},
    }).id;
  }), { latency: [400, 800], failRate: 0.03 }),

  /** Re-run a recorded run from one step on, reusing the stored payloads before it. */
  retryFromStep: (runId, nodeId) => respond(() => {
    const source = runs.require(runId);
    const flow = flows.require(source.flowId);
    const graph = source.graph ?? versions.get(`${source.flowId}@${source.version}`)?.graph ?? flow.graph;
    const start = source.ledger.findIndex((row) => row.nodeId === nodeId);
    if (start < 0) throw new ApiError('not_found', 'This step is not in the receipt.');
    const reusedRows = Object.fromEntries(source.ledger.slice(0, start).filter((row) => ['succeeded', 'pinned'].includes(row.result) || row.result.startsWith('took_')).map((row) => [row.nodeId, row]));
    const retryGraph = { ...graph, nodes: graph.nodes.map((n) => n.id === nodeId ? { ...n, sim: { ...n.sim, failAttempts: 0 } } : n) };
    const inputPayload = clone(source.inputPayload ?? flow.samplePayload ?? {});
    const snapshots = clone(source.subFlows ?? subFlowSnapshots());
    const plan = simulateRun({ graph: retryGraph, types: typeIndex, payload: inputPayload, reusedRows, subFlows: snapshots });
    const run = runs.create({
      id: newId(`run_${source.flowId.replace(/^flow_/, '')}`),
      shortId: `r_${Math.random().toString(16).slice(2, 6)}`,
      flowId: source.flowId, flowName: source.flowName ?? flow.name, graph: clone(graph), version: source.version, mode: 'retry', retryOf: runId, retryFromNodeId: nodeId,
      sequence: runsOfFlow(source.flowId).reduce((max, r) => Math.max(max, r.sequence ?? 0), 0) + 1, startedAt: nowIso(), live: true, status: 'running', durationMs: null,
      plannedStatus: plan.status, plannedRecordedMs: plan.durationMs, plannedDurationMs: Math.max(plan.durationMs, 600), ledger: plan.ledger, pendingWait: plan.pendingWait,
      inputPayload, subFlows: snapshots, waitDecisions: {},
    });
    return { id: run.id };
  }, { latency: [400, 800] }),

  deleteRuns: (ids) => respond(() => {
    ids.forEach((id) => runs.remove(id));
    return { deleted: ids.length };
  }, { latency: [300, 600], failRate: 0.02 }),

  /** A receipt as a downloadable JSON document. */
  exportReceipt: (id) => respond(() => {
    const run = shapeRun(runs.require(id));
    return {
      fileName: `xwflow-receipt-${run.shortId}.json`,
      mimeType: 'application/json',
      content: JSON.stringify({
        receipt: run.shortId, flow: run.flowName, version: run.version, mode: run.mode, status: run.status,
        startedAt: run.startedAt, durationMs: run.durationMs,
        steps: run.ledger.map(({ index, stepName, attempt, maxAttempts, result, payload, durationMs, error, input, output, decision, actorId, actorName, resolvedAt }) => ({ index, stepName, attempt, maxAttempts, result, payload, durationMs, error, input, output, decision, actorId, actorName, resolvedAt })),
        note: 'Credentials appear by name only. Values are never stored in a receipt.',
      }, null, 2),
    };
  }, { latency: [300, 600] }),

  /** Per-step timing difference between a run and the previous run of the same flow. */
  compareRuns: (id, otherId) => respond(() => {
    const a = shapeRun(runs.require(id));
    const b = shapeRun(runs.require(otherId));
    const total = (run, nodeId) => run.ledger.filter((l) => l.nodeId === nodeId && l.durationMs).reduce((s, l) => s + l.durationMs, 0);
    const nodeIds = [...new Set([...a.ledger, ...b.ledger].map((l) => l.nodeId))];
    return {
      a: { id: a.id, shortId: a.shortId, status: a.status, durationMs: a.durationMs },
      b: { id: b.id, shortId: b.shortId, status: b.status, durationMs: b.durationMs },
      steps: nodeIds.map((nodeId) => ({
        nodeId,
        stepName: a.ledger.find((l) => l.nodeId === nodeId)?.stepName ?? b.ledger.find((l) => l.nodeId === nodeId)?.stepName,
        aMs: total(a, nodeId), bMs: total(b, nodeId),
        aResult: a.ledger.filter((l) => l.nodeId === nodeId).at(-1)?.result,
        bResult: b.ledger.filter((l) => l.nodeId === nodeId).at(-1)?.result,
      })),
    };
  }),

  /* ------------------------------ connections */

  /**
   * @param {{ q?: string, status?: 'all'|'healthy'|'expiring'|'broken' }} filters
   */
  listConnections: ({ q = '', status = 'all' } = {}) => respond(() => connections.list()
    .map(shapeConnection)
    .filter((c) => matches(c, q, ['name', 'kind', 'team']) && (status === 'all' || c.status === status))),

  getConnectionForm: () => respond(() => db.connectionForm, { latency: [60, 140] }),

  /** Checks the credential still works. A broken one fails with the reason. */
  testConnection: (id) => respond(() => {
    const conn = connections.require(id);
    connections.update(id, { lastTestedAt: nowIso() });
    if (conn.status === 'broken') throw new ApiError('auth_expired', `${conn.name}: the sign-in expired. Reconnect to continue.`);
    connections.update(id, { lastUsedAt: nowIso() });
    return { id, ok: true, latencyMs: 120 + Math.round(Math.random() * 200) };
  }, { latency: [600, 1200] }),

  /** Re-authorises: the connection becomes healthy with a fresh 90-day token. */
  reconnectConnection: (id) => respond(() => shapeConnection(connections.update(id, {
    status: 'healthy', expiredAt: null, expiresAt: null, lastUsedAt: nowIso(),
  })), { latency: [700, 1300], failRate: 0.03 }),

  createConnection: ({ name, kind, team, scopes, secret }) => respond(() => {
    if (!name?.trim()) throw new ApiError('invalid', 'Give the connection a name.');
    if (!secret?.trim()) throw new ApiError('invalid', 'Paste the secret. It is stored in the vault and never shown again.');
    const form = db.connectionForm;
    return shapeConnection(connections.create({
      id: newId('conn'), name: name.trim(), kind, ownerId: db.currentUserId, team, scopes,
      icon: form.icons[kind] ?? 'key', tone: form.tones[connections.list().length % form.tones.length],
      status: 'healthy', usedByFlowIds: [], lastUsedAt: null, expiredAt: null, expiresAt: null,
    }));
  }, { latency: [500, 900] }),

  /* ------------------------------ assistant */

  getAssistant: () => respond(() => ({
    copy: db.assistant,
    templates: db.templates,
    recommended: db.templates.filter((t) => t.recommended),
    recommendedHidden: ui.get().recommendedHidden,
  })),

  /**
   * Editor "Ask AI": either proposes a step to add (keyword match stands in for the model)
   * or explains the flow in plain sentences.
   * @returns {Promise<{ kind: 'add', type: string, name: string } | { kind: 'explain', sentences: string[] }>}
   */
  askAssistant: ({ flowId, text = '' }) => respond(() => {
    const flow = flows.require(flowId);
    const words = ` ${text.toLowerCase()} `;
    const A = db.editorAssistant;
    if (!A.explainWords.some((w) => words.includes(w))) {
      const match = Object.entries(A.keywordsByType).find(([, keys]) => keys.some((k) => words.includes(k)));
      if (match) return { kind: 'add', type: match[0], name: text.trim().replace(/^(add|insert|create)\s+(a|an)?\s*/i, '') || typeIndex[match[0]].label };
    }
    const fill = (tpl, values) => tpl.replace(/\{(\w+)\}/g, (_, k) => values[k] ?? '');
    const nodes = flow.graph.nodes;
    const label = (n) => typeIndex[n.type]?.label ?? n.type;
    const trigger = nodes.find((n) => typeIndex[n.type]?.group === 'trigger');
    const sentences = [fill(A.explainIntro, { name: flow.name, trigger: trigger ? `${trigger.name} (${label(trigger)})` : '-' })];
    nodes.filter((n) => n !== trigger).forEach((n) => {
      sentences.push(fill(A.explainStep, { step: n.name, type: label(n) }));
      flow.graph.edges.filter((e) => e.from === n.id && e.port !== 'out').forEach((e) => {
        sentences.push(fill(A.explainBranch, { step: n.name, port: e.port, target: nodes.find((x) => x.id === e.to)?.name }));
      });
      if (n.disabled) sentences.push(fill(A.explainDisabled, { step: n.name }));
    });
    return { kind: 'explain', sentences };
  }, { latency: [600, 1100] }),

  /** Notations gallery: copy, render modes, families and the 24 notation cards. */
  getNotationGallery: () => respond(() => ({ ...gallery, demoFlowId: getDemoFlowId() }), { latency: [120, 260] }),

  getEditorAssistant: () => respond(() => ({ examples: db.editorAssistant.examples }), { latency: [60, 120] }),

  setRecommendedHidden: (hidden) => respond(() => ui.patch({ recommendedHidden: hidden }), { latency: [80, 160] }),

  /**
   * Draft a flow from a free-text request (keyword matching stands in for the model).
   * @returns {Promise<{ template: object, graph: object, name: string }>}
   */
  draftFromPrompt: ({ text = '', templateId = null } = {}) => respond(() => {
    const words = text.toLowerCase();
    const score = (t) => t.keywords.reduce((s, k) => s + (words.includes(k) ? 1 : 0), 0);
    const template = db.templates.find((t) => t.id === templateId)
      ?? [...db.templates].sort((a, b) => score(b) - score(a))[0];
    return { template, name: template.name, request: text, graph: graphFromTemplate(template, { spacing: 300, y: 33, x: 20 }) };
  }, { latency: [700, 1300] }),
};

/** Lay template steps out left to right and wire them in a line. */
function graphFromTemplate(template, { spacing = 240, x = 120, y = 200 } = {}) {
  const nodes = template.steps.map((step, i) => ({
    id: `n_${i + 1}`,
    type: step.type,
    name: step.name,
    x: x + i * spacing,
    y,
    disabled: false,
    pinned: false,
    needsConnection: Boolean(step.needsConnection),
    params: Object.fromEntries((typeIndex[step.type]?.fields ?? []).map((f) => [f.key, f.default])),
  }));
  const edges = nodes.slice(1).map((n, i) => {
    const from = nodes[i];
    const port = typeIndex[from.type]?.ports?.includes('yes') ? 'yes' : 'out';
    return { id: `e${i + 1}`, from: from.id, port, to: n.id };
  });
  return { nodes, edges, frames: [], stickies: [] };
}
