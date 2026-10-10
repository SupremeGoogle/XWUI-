/**
 * XWFFlowDiagram - logic. Pure model derivations shared by every notation renderer:
 * column layout, participants (lanes), message sequence from a receipt, hand-offs and the
 * discrete-event simulation step.
 */
import { XWUIComponentLogic } from '@exonware/xwui/basic';
import { XWF_FLOW_DIAGRAM_DEFINITION } from './XWFFlowDiagram.model.js';

export function createXWFFlowDiagramLogic(data = {}, conf = {}) {
  return new XWUIComponentLogic(XWF_FLOW_DIAGRAM_DEFINITION, data, conf);
}

/* ------------------------------------------------------------ structure */

/** Steps ordered from the trigger with their depth (column) and branch (row offset). */
export function layoutColumns(graph, types) {
  const incoming = new Map(graph.nodes.map((n) => [n.id, 0]));
  graph.edges.forEach((e) => incoming.set(e.to, (incoming.get(e.to) ?? 0) + 1));
  const roots = graph.nodes.filter((n) => types[n.type]?.group === 'trigger' || !incoming.get(n.id));
  const info = new Map();
  const queue = roots.map((n) => ({ id: n.id, col: 0, row: 0 }));
  while (queue.length) {
    const cur = queue.shift();
    if (info.has(cur.id)) continue;
    info.set(cur.id, cur);
    graph.edges.filter((e) => e.from === cur.id).forEach((e) => {
      const row = e.port === 'yes' ? cur.row - 1 : e.port === 'no' ? cur.row + 1 : cur.row;
      queue.push({ id: e.to, col: cur.col + 1, row });
    });
  }
  graph.nodes.forEach((n, i) => { if (!info.has(n.id)) info.set(n.id, { id: n.id, col: i, row: 2 }); });
  const steps = graph.nodes.map((n) => ({ node: n, type: types[n.type] ?? {}, ...info.get(n.id) }));
  steps.sort((a, b) => a.col - b.col || a.row - b.row);
  return {
    steps,
    cols: Math.max(1, ...steps.map((s) => s.col + 1)),
    minRow: Math.min(0, ...steps.map((s) => s.row)),
    maxRow: Math.max(0, ...steps.map((s) => s.row)),
  };
}

const KIND_TONE = { source: 'lime', engine: 'violet', ai: 'pink', apps: 'cyan', data: 'violet' };

/**
 * Participants (lanes / lifelines). A flow may declare `systems` and tag nodes with
 * `system`; otherwise lanes come from the step types' `lane` and connection names.
 */
export function deriveSystems(flow, types, connections = [], lanesCatalog = []) {
  const graph = flow.graph;
  if (flow.systems?.length) {
    const engine = flow.systems.find((s) => s.kind === 'engine')?.id;
    return {
      systems: flow.systems,
      systemOf: (node) => node.system ?? engine,
      engineId: engine,
    };
  }
  const systems = [];
  const add = (s) => { if (!systems.some((x) => x.id === s.id)) systems.push(s); };
  const laneLabel = (id) => lanesCatalog.find((l) => l.id === id);
  const systemIdOf = (node) => {
    const type = types[node.type] ?? {};
    const conn = connections.find((c) => c.id === node.params?.connectionId);
    if (conn) return `conn:${conn.id}`;
    return type.lane ?? 'engine';
  };
  graph.nodes.forEach((node) => {
    const type = types[node.type] ?? {};
    const id = systemIdOf(node);
    if (id.startsWith('conn:')) {
      const conn = connections.find((c) => `conn:${c.id}` === id);
      add({ id, label: conn.name, hint: conn.kind, tone: conn.tone ?? 'cyan', kind: 'system' });
    } else {
      const lane = laneLabel(id);
      add({ id, label: lane?.label ?? type.label, hint: '', tone: lane?.tone ?? KIND_TONE[id] ?? 'violet', kind: id === 'source' ? 'source' : id === 'engine' ? 'engine' : 'system' });
    }
  });
  if (!systems.some((s) => s.id === 'engine')) {
    const lane = laneLabel('engine');
    systems.splice(Math.min(1, systems.length), 0, { id: 'engine', label: lane?.label ?? 'Engine', hint: '', tone: lane?.tone ?? 'violet', kind: 'engine' });
  }
  return { systems, systemOf: systemIdOf, engineId: 'engine' };
}

/** Edges whose two ends live in different lanes. */
export function countHandoffs(graph, systemOf) {
  const byId = new Map(graph.nodes.map((n) => [n.id, n]));
  return graph.edges.filter((e) => systemOf(byId.get(e.from)) !== systemOf(byId.get(e.to))).length;
}

export function retriesInRun(run) {
  if (!run) return 0;
  return run.ledger.filter((r) => r.result === 'failed' && (r.maxAttempts ?? 1) > r.attempt).length;
}

/* ------------------------------------------------------------ sequence */

function fillCall(text, payload) {
  return String(text ?? '').replace(/\{(\w+)\}/g, (_, k) => {
    const found = JSON.stringify(payload ?? {}).match(new RegExp(`"${k}":"?([^",}]+)`));
    return found ? found[1] : k;
  });
}

/**
 * Messages of one run, in time order, between participants. Falls back to the graph
 * order when there is no receipt (then it reads as the intended interaction).
 * @returns {{ messages: object[], fragments: object[] }}
 */
export function deriveSequence(flow, types, run, systemsModel, labels) {
  const { systems, systemOf, engineId } = systemsModel;
  const graph = flow.graph;
  const byId = new Map(graph.nodes.map((n) => [n.id, n]));
  const source = systems.find((s) => s.kind === 'source') ?? systems[0];
  const messages = [];
  const fragments = [];
  const payload = flow.samplePayload;
  const ledger = run?.ledger ?? graph.nodes.map((n, i) => ({ nodeId: n.id, attempt: 1, result: 'succeeded', index: i + 1 }));
  const trigger = graph.nodes.find((n) => types[n.type]?.group === 'trigger');
  messages.push({ from: source.id, to: engineId, label: source.call ?? labels.start, kind: 'call', ledgerIndex: 1, tone: 'lime' });
  let alt = null;
  ledger.forEach((row, i) => {
    const node = byId.get(row.nodeId);
    if (!node || node === trigger) return;
    const type = types[node.type] ?? {};
    const target = systemOf(node);
    const index = row.index ?? i + 1;
    if (type.ports?.includes('yes')) {
      const yesTargets = graph.edges.filter((e) => e.from === node.id && e.port === 'yes').map((e) => e.to);
      const noTargets = graph.edges.filter((e) => e.from === node.id && e.port === 'no').map((e) => e.to);
      alt = { nodeId: node.id, guard: node.params?.expression ?? node.name, startAt: messages.length, yesTargets, noTargets, took: row.result, ledgerIndex: index };
      fragments.push(alt);
      return;
    }
    if (row.result === 'disabled' || row.result === 'not_run' || row.attempt === 0) {
      if (alt && (alt.yesTargets.includes(node.id) || alt.noTargets.includes(node.id))) {
        messages.push({ from: engineId, to: target, label: node.call ?? node.name, kind: alt.yesTargets.includes(node.id) ? 'skipped-yes' : 'skipped-no', skipped: true, reason: row.result, nodeId: node.id, branch: alt.yesTargets.includes(node.id) ? 'yes' : 'no', fragment: alt });
      }
      return;
    }
    const branch = alt && (alt.yesTargets.includes(node.id) ? 'yes' : alt.noTargets.includes(node.id) ? 'no' : null);
    if (target === engineId) {
      messages.push({ from: engineId, to: engineId, label: node.name, kind: 'self', nodeId: node.id, ledgerIndex: index, branch, fragment: branch ? alt : null });
      return;
    }
    const tries = (row.maxAttempts ?? 1) > 1 ? `, ${labels.tryWord} ${row.attempt}` : '';
    messages.push({ from: engineId, to: target, label: `${fillCall(node.call ?? node.name, payload)}${row.attempt > 1 ? tries : ''}`, kind: 'call', nodeId: node.id, branch, fragment: branch ? alt : null });
    if (row.result === 'failed') {
      messages.push({ from: target, to: engineId, label: `${row.error?.status ?? ''} ${row.error?.message ?? labels.failed}`.trim(), kind: 'error', nodeId: node.id, ledgerIndex: index, branch, fragment: branch ? alt : null });
      const delay = types[node.type]?.retry?.delayMs;
      if (row.attempt < (row.maxAttempts ?? 1) && delay) messages.push({ from: engineId, to: engineId, label: `${labels.wait} ${delay.toLocaleString('en-GB')} ms`, kind: 'wait', nodeId: node.id });
    } else {
      messages.push({ from: target, to: engineId, label: node.reply ?? labels.ok, kind: 'reply', nodeId: node.id, ledgerIndex: index, branch, fragment: branch ? alt : null });
    }
  });
  if (source.reply) messages.push({ from: engineId, to: source.id, label: source.reply, kind: 'reply' });
  fragments.forEach((f) => {
    const inFrag = messages.map((m, i) => (m.fragment === f ? i : -1)).filter((i) => i >= 0);
    f.from = inFrag.length ? Math.min(...inFrag) : f.startAt;
    f.to = inFrag.length ? Math.max(...inFrag) : f.startAt;
    f.elseAt = messages.findIndex((m) => m.fragment === f && m.branch === 'no');
  });
  return { messages, fragments };
}

/* ------------------------------------------------------------ simulation */

/** Initial state of the discrete-event model for a flow. */
export function createSimState(flow, types) {
  const { steps } = layoutColumns(flow.graph, types);
  return {
    clockMin: 0,
    totalMin: (flow.sim?.hours ?? 8) * 60,
    arrived: 0,
    stations: Object.fromEntries(steps.map((s) => [s.node.id, { in: 0, out: 0, queue: 0 }])),
    done: 0,
    running: true,
  };
}

/**
 * Advance the model by `minutes`. Arrivals follow the configured rate; each station
 * serves up to `workers` items per service time; decisions split by `branchShare`.
 * Pure: returns a new state.
 */
export function stepSim(state, flow, types, minutes, rng = Math.random) {
  if (state.clockMin >= state.totalMin) return { ...state, running: false };
  const cfg = flow.sim ?? {};
  const next = { ...state, stations: structuredClone(state.stations) };
  next.clockMin = Math.min(state.totalMin, state.clockMin + minutes);
  const graph = flow.graph;
  const trigger = graph.nodes.find((n) => types[n.type]?.group === 'trigger') ?? graph.nodes[0];
  if (!trigger) return next;
  const arrivals = Math.round(((cfg.arrivalsPerHour ?? 60) / 60) * minutes * (0.7 + rng() * 0.6));
  next.arrived += arrivals;
  next.stations[trigger.id].out += arrivals;
  const capacity = Math.max(1, Math.round(((cfg.workers ?? 2) * minutes) / (cfg.serviceMinutes ?? 1)));
  const flowInto = (nodeId, count) => {
    if (!count) return;
    const outs = graph.edges.filter((e) => e.from === nodeId);
    if (!outs.length) { next.done += count; return; }
    const type = types[graph.nodes.find((n) => n.id === nodeId)?.type];
    if (type?.ports?.includes('yes')) {
      const yes = Math.round(count * (cfg.branchShare?.yes ?? 0.5));
      outs.forEach((e) => receive(e.to, e.port === 'yes' ? yes : count - yes));
    } else outs.forEach((e) => receive(e.to, count));
  };
  const receive = (nodeId, count) => {
    const st = next.stations[nodeId];
    const node = graph.nodes.find((n) => n.id === nodeId);
    if (!st || !node) return;
    st.in += count;
    if (node.disabled) { st.out += count; flowInto(nodeId, count); return; }
    const total = st.queue + count;
    const served = Math.min(total, capacity);
    st.queue = total - served;
    st.out += served;
    flowInto(nodeId, served);
  };
  flowInto(trigger.id, arrivals);
  next.running = next.clockMin < next.totalMin;
  return next;
}

export function formatSimClock(minutes) {
  const h = Math.floor(minutes / 60);
  const m = Math.floor(minutes % 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`;
}

/* ------------------------------------------------------------ text forms */

/** Mermaid-compatible flowchart text for a flow ("flow as code"). */
export function flowToMermaid(graph, types) {
  const { steps } = layoutColumns(graph, types);
  const letter = new Map(steps.map((s, i) => [s.node.id, String.fromCharCode(65 + (i % 26)) + (i >= 26 ? Math.floor(i / 26) : '')]));
  const shape = (s) => (s.type.ports?.includes('yes') ? `{${s.node.name}}` : `[${s.node.name}]`);
  const declared = new Set();
  const ref = (s) => {
    const id = letter.get(s.node.id);
    if (declared.has(id)) return id;
    declared.add(id);
    return `${id}${shape(s)}`;
  };
  const byId = new Map(steps.map((s) => [s.node.id, s]));
  const lines = ['flowchart LR'];
  graph.edges.forEach((e) => {
    const a = byId.get(e.from); const b = byId.get(e.to);
    if (!a || !b) return;
    const label = e.port === 'yes' || e.port === 'no' ? `|${e.port}|` : '';
    lines.push(`  ${ref(a)} -->${label} ${ref(b)}`);
  });
  steps.forEach((s) => { if (!declared.has(letter.get(s.node.id))) lines.push(`  ${ref(s)}`); });
  return lines.join('\n');
}

/**
 * Ordered list form ("list mode"): numbered steps; a branch's targets indent under it and
 * a target that comes back on the main line points to its step number.
 */
export function flowToList(graph, types) {
  const { steps } = layoutColumns(graph, types);
  const main = steps.filter((s) => s.row === 0);
  const number = new Map(main.map((s, i) => [s.node.id, i + 1]));
  const rows = [];
  main.forEach((s) => {
    const retry = s.node.params?.retry && s.type.retry ? `, retries ${s.type.retry.tries}` : '';
    rows.push({ n: number.get(s.node.id), name: s.node.name, detail: `${s.type.label ?? s.node.type}${retry}`, indent: 0 });
    graph.edges.filter((e) => e.from === s.node.id && (e.port === 'yes' || e.port === 'no')).forEach((e) => {
      const target = steps.find((x) => x.node.id === e.to);
      rows.push({ port: e.port, name: target?.node.name ?? e.to, goTo: number.get(e.to) ?? null, indent: 1 });
    });
  });
  return rows;
}
