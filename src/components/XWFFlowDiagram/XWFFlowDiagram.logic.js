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
    // per station: items in/out, waiting now, worker-capacity offered, item-minutes spent waiting
    stations: Object.fromEntries(steps.map((s) => [s.node.id, { in: 0, out: 0, queue: 0, capacity: 0, waitMin: 0 }])),
    /** Queue length per station after each step: { [nodeId]: [{ t, q }] } */
    trace: Object.fromEntries(steps.map((s) => [s.node.id, []])),
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
  const next = { ...state, stations: structuredClone(state.stations), trace: structuredClone(state.trace ?? {}) };
  next.clockMin = Math.min(state.totalMin, state.clockMin + minutes);
  const graph = flow.graph;
  const trigger = graph.nodes.find((n) => types[n.type]?.group === 'trigger') ?? graph.nodes[0];
  if (!trigger) return next;
  // Bursty arrivals and uneven service times (±40% / ±25% around the means) are what make
  // queues form below full utilisation, as they do in real traffic.
  const arrivals = Math.round(((cfg.arrivalsPerHour ?? 60) / 60) * minutes * (0.6 + rng() * 0.8));
  next.arrived += arrivals;
  next.stations[trigger.id].out += arrivals;
  const capacity = Math.max(1, Math.round((((cfg.workers ?? 2) * minutes) / (cfg.serviceMinutes ?? 1)) * (0.75 + rng() * 0.5)));
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
  graph.nodes.forEach((node) => {
    const st = next.stations[node.id];
    if (!st) return;
    if (node.id !== trigger.id && !node.disabled) {
      st.capacity += capacity;
      st.waitMin += st.queue * minutes;
    }
    (next.trace[node.id] ??= []).push({ t: next.clockMin, q: st.queue });
  });
  next.running = next.clockMin < next.totalMin;
  return next;
}

/**
 * The model with a scenario applied: arrivals and service time scaled, workers set.
 * @param {{ arrivalFactor?: number, serviceFactor?: number, workers?: number }} scenario
 */
export function simModel(flow, { arrivalFactor = 1, serviceFactor = 1, workers } = {}) {
  const sim = flow.sim ?? {};
  return {
    ...flow,
    sim: {
      ...sim,
      arrivalsPerHour: (sim.arrivalsPerHour ?? 60) * arrivalFactor,
      serviceMinutes: (sim.serviceMinutes ?? 1) * serviceFactor,
      workers: workers ?? sim.workers ?? 2,
    },
  };
}

/**
 * Figures for the simulation panel. The focus station is the flow's declared one
 * (`sim.focusNodeId`) or the one where items waited longest; `sim.countNodeId` names the
 * step whose arrivals are counted (for example alerts sent).
 */
export function simSummary(state, flow, types) {
  if (!state) return null;
  const graph = flow.graph;
  const trigger = graph.nodes.find((n) => types[n.type]?.group === 'trigger');
  const served = graph.nodes.filter((n) => n !== trigger && !n.disabled && state.stations[n.id]);
  const focus = graph.nodes.find((n) => n.id === flow.sim?.focusNodeId)
    ?? [...served].sort((a, b) => state.stations[b.id].waitMin - state.stations[a.id].waitMin)[0]
    ?? null;
  const st = focus ? state.stations[focus.id] : null;
  const counted = graph.nodes.find((n) => n.id === flow.sim?.countNodeId) ?? null;
  return {
    done: state.done,
    arrived: state.arrived,
    waitingNow: Object.values(state.stations).reduce((a, x) => a + x.queue, 0),
    focus,
    avgWaitMin: st && st.out ? st.waitMin / st.out : 0,
    utilization: st && st.capacity ? Math.min(1, st.out / st.capacity) : 0,
    counted,
    countedValue: counted ? state.stations[counted.id]?.in ?? 0 : null,
    queueTrace: focus ? state.trace?.[focus.id] ?? [] : [],
  };
}

/** Bucket a queue trace into `count` bars over the first `windowMin` simulated minutes. */
export function queueBuckets(trace, { windowMin = 60, count = 18 } = {}) {
  const size = windowMin / count;
  return Array.from({ length: count }, (_, i) => {
    const from = i * size;
    const points = trace.filter((p) => p.t > from && p.t <= from + size);
    return { value: points.length ? Math.max(...points.map((p) => p.q)) : 0, partial: !points.length };
  });
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

/* ------------------------------------------------------------ sequence as text */

/** Short, stable participant aliases for text diagrams (P1, P2...). */
function participantAliases(systems) {
  return new Map(systems.map((s, i) => [s.id, `P${i + 1}`]));
}

const quote = (text) => String(text ?? '').replace(/"/g, "'").replace(/[\r\n]+/g, ' ');
/** Why a message did not happen, in the words the sequence view uses. */
const skipNote = (m, labels) => (m.skipped ? ` (${m.reason === 'disabled' ? labels.skipped : labels.notRun})` : '');

/** PlantUML sequence diagram of one run (the same messages the sequence view draws). */
export function sequenceToPlantUml(flow, types, run, systemsModel, labels) {
  const { messages, fragments } = deriveSequence(flow, types, run, systemsModel, labels);
  const alias = participantAliases(systemsModel.systems);
  const lines = ['@startuml', `title ${quote(flow.name)}${run ? ` (${run.shortId ?? run.id})` : ''}`];
  systemsModel.systems.forEach((s) => lines.push(`participant "${quote(s.label)}" as ${alias.get(s.id)}`));
  messages.forEach((m, i) => {
    fragments.filter((f) => f.from === i).forEach((f) => lines.push(`alt ${quote(f.guard)}`));
    fragments.filter((f) => f.elseAt === i).forEach(() => lines.push('else'));
    const arrow = m.kind === 'reply' || m.kind === 'error' ? '-->' : '->';
    lines.push(`${alias.get(m.from)} ${arrow} ${alias.get(m.to)}: ${quote(m.label)}${skipNote(m, labels)}`);
    fragments.filter((f) => f.to === i).forEach(() => lines.push('end'));
  });
  lines.push('@enduml');
  return lines.join('\n');
}

/** Mermaid sequenceDiagram of one run. */
export function sequenceToMermaid(flow, types, run, systemsModel, labels) {
  const { messages, fragments } = deriveSequence(flow, types, run, systemsModel, labels);
  const alias = participantAliases(systemsModel.systems);
  const lines = ['sequenceDiagram'];
  systemsModel.systems.forEach((s) => lines.push(`  participant ${alias.get(s.id)} as ${quote(s.label)}`));
  messages.forEach((m, i) => {
    fragments.filter((f) => f.from === i).forEach((f) => lines.push(`  alt ${quote(f.guard)}`));
    fragments.filter((f) => f.elseAt === i).forEach(() => lines.push('  else'));
    const arrow = m.kind === 'reply' || m.kind === 'error' ? '-->>' : '->>';
    lines.push(`  ${alias.get(m.from)}${arrow}${alias.get(m.to)}: ${quote(m.label).replace(/[;#]/g, ' ')}${skipNote(m, labels)}`);
    fragments.filter((f) => f.to === i).forEach(() => lines.push('  end'));
  });
  return lines.join('\n');
}

/* ------------------------------------------------------------ BPMN interchange */

const BPMN_ELEMENT = {
  'start-message': 'startEvent', 'start-timer': 'startEvent', 'gateway-xor': 'exclusiveGateway', 'gateway-and': 'parallelGateway',
  'intermediate-timer': 'intermediateCatchEvent', 'task-service': 'serviceTask', 'task-send': 'sendTask', 'task-script': 'scriptTask',
  'task-data': 'serviceTask', task: 'task',
};

const xml = (text) => String(text ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const xmlId = (id) => String(id).replace(/[^\w.-]/g, '_');

/**
 * Structural checks a BPMN modeler would report: one start event, every step reachable
 * from it, and exclusive gateways with both branches wired.
 * @returns {{ code: string, nodeId?: string }[]}
 */
export function validateBpmn(flow, types) {
  const graph = flow.graph;
  const problems = [];
  const starts = graph.nodes.filter((n) => BPMN_ELEMENT[types[n.type]?.notation?.bpmn] === 'startEvent');
  if (starts.length !== 1) problems.push({ code: starts.length ? 'many-starts' : 'no-start' });
  const reachable = new Set();
  const queue = starts.map((n) => n.id);
  while (queue.length) {
    const id = queue.shift();
    if (reachable.has(id)) continue;
    reachable.add(id);
    graph.edges.filter((e) => e.from === id).forEach((e) => queue.push(e.to));
  }
  graph.nodes.forEach((n) => {
    if (starts.length && !reachable.has(n.id)) problems.push({ code: 'unreachable', nodeId: n.id });
    if (types[n.type]?.notation?.bpmn === 'gateway-xor' && graph.edges.filter((e) => e.from === n.id).length < 2) problems.push({ code: 'open-gateway', nodeId: n.id });
  });
  return problems;
}

/**
 * BPMN 2.0 XML (process, lanes, sequence flows and an end event per leaf) for import into
 * a modeler. `version` is recorded as the exporter version of the chosen notation.
 */
export function flowToBpmnXml(flow, types, systemsModel, { version = '2.0.2', exporter = 'xwflow' } = {}) {
  const graph = flow.graph;
  const processId = `Process_${xmlId(flow.id ?? flow.name)}`;
  const { systems, systemOf } = systemsModel;
  const leaves = graph.nodes.filter((n) => !graph.edges.some((e) => e.from === n.id));
  const lanes = systems.map((s) => ({ ...s, nodes: graph.nodes.filter((n) => systemOf(n) === s.id) })).filter((l) => l.nodes.length);
  const el = (n) => {
    const kind = types[n.type]?.notation?.bpmn ?? 'task';
    const tag = BPMN_ELEMENT[kind] ?? 'task';
    const definition = kind === 'start-message' ? '<bpmn:messageEventDefinition />'
      : kind === 'start-timer' || kind === 'intermediate-timer' ? '<bpmn:timerEventDefinition />' : '';
    const attrs = `id="${xmlId(n.id)}" name="${xml(n.name)}"`;
    return definition ? `    <bpmn:${tag} ${attrs}>${definition}</bpmn:${tag}>` : `    <bpmn:${tag} ${attrs} />`;
  };
  const lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" id="Definitions_${xmlId(flow.id ?? 'flow')}" targetNamespace="urn:xwflow" exporter="${xml(exporter)}" exporterVersion="${xml(version)}">`,
    `  <bpmn:process id="${processId}" name="${xml(flow.name)}" isExecutable="true">`,
    '    <bpmn:laneSet id="LaneSet_1">',
    ...lanes.map((l) => [`      <bpmn:lane id="Lane_${xmlId(l.id)}" name="${xml(l.label)}">`, ...l.nodes.map((n) => `        <bpmn:flowNodeRef>${xmlId(n.id)}</bpmn:flowNodeRef>`), '      </bpmn:lane>']).flat(),
    '    </bpmn:laneSet>',
    ...graph.nodes.map(el),
    ...leaves.map((n) => `    <bpmn:endEvent id="End_${xmlId(n.id)}" />`),
    ...graph.edges.map((e, i) => `    <bpmn:sequenceFlow id="Flow_${i + 1}" sourceRef="${xmlId(e.from)}" targetRef="${xmlId(e.to)}"${e.port === 'yes' || e.port === 'no' ? ` name="${e.port}"` : ''} />`),
    ...leaves.map((n) => `    <bpmn:sequenceFlow id="Flow_end_${xmlId(n.id)}" sourceRef="${xmlId(n.id)}" targetRef="End_${xmlId(n.id)}" />`),
    '  </bpmn:process>',
    '</bpmn:definitions>',
  ];
  return lines.join('\n');
}
