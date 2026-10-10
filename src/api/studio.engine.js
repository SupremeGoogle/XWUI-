/**
 * Run simulator (the dummy backend's execution engine).
 * Walks a flow graph from its trigger, the way the real engine would, and produces a
 * ledger of attempts with timings. Used when the studio starts a run. Pure functions:
 * no storage, no timers.
 */

/** Read a dotted path from an object: get({ a: { b: 1 } }, 'a.b') -> 1 */
export function getPath(source, path) {
  return String(path).split('.').reduce((acc, key) => (acc == null ? undefined : acc[key]), source);
}

const COMPARATORS = {
  '>': (a, b) => a > b,
  '>=': (a, b) => a >= b,
  '<': (a, b) => a < b,
  '<=': (a, b) => a <= b,
  '==': (a, b) => a == b, // eslint-disable-line eqeqeq
  '!=': (a, b) => a != b, // eslint-disable-line eqeqeq
};

/**
 * Evaluate a simple condition such as `order.total > 500` against a payload.
 * Supports `<path> <op> <number|"string"|true|false>` and a bare `<path>` (truthy).
 * Never uses eval.
 * @returns {{ ok: boolean, value?: boolean, error?: string, keys: string[] }}
 */
export function evaluateCondition(expression, payload) {
  const text = String(expression ?? '').trim();
  const match = /^([\w.]+)\s*(>=|<=|==|!=|>|<)\s*(.+)$/.exec(text);
  if (!match) {
    if (/^[\w.]+$/.test(text)) return { ok: true, value: Boolean(getPath(payload, text)), keys: [text] };
    return { ok: false, error: `Cannot read the condition "${text}"`, keys: [] };
  }
  const [, path, op, rawRight] = match;
  const left = getPath(payload, path);
  let right = rawRight.trim();
  if (/^-?\d+(\.\d+)?$/.test(right)) right = Number(right);
  else if (right === 'true' || right === 'false') right = right === 'true';
  else right = right.replace(/^["']|["']$/g, '');
  if (left === undefined) return { ok: false, error: `${path} is missing from the input`, keys: [path] };
  return { ok: true, value: COMPARATORS[op](left, right), keys: [path] };
}

/** Outgoing edges of a node keyed by port. */
function outgoing(graph, nodeId) {
  return graph.edges.filter((e) => e.from === nodeId);
}

/** Nodes in a stable breadth-first order from the trigger(s). */
export function orderNodes(graph, types) {
  const incoming = new Set(graph.edges.map((e) => e.to));
  const triggers = graph.nodes.filter((n) => types[n.type]?.group === 'trigger' || !incoming.has(n.id));
  const seen = new Set();
  const order = [];
  const queue = [...triggers.map((n) => n.id)];
  while (queue.length) {
    const id = queue.shift();
    if (seen.has(id)) continue;
    seen.add(id);
    order.push(id);
    outgoing(graph, id).forEach((e) => queue.push(e.to));
  }
  graph.nodes.forEach((n) => { if (!seen.has(n.id)) order.push(n.id); });
  return order.map((id) => graph.nodes.find((n) => n.id === id));
}

/**
 * Simulate a run.
 * @param {{ graph: object, types: Record<string, object>, payload: object, mode: string, stopAtNodeId?: string }} input
 * @returns {{ ledger: object[], status: string, durationMs: number }}
 */
export function simulateRun({ graph, types, payload, stopAtNodeId = null, reusedRows = {} }) {
  const ledger = [];
  const reached = new Set();
  const ordered = orderNodes(graph, types);
  const triggers = ordered.filter((n) => types[n.type]?.group === 'trigger');
  triggers.forEach((t) => reached.add(t.id));

  let clock = 0;
  let failed = false;
  let retried = false;
  let stopped = false;

  for (const node of ordered) {
    const type = types[node.type] ?? {};
    if (stopped || failed || !reached.has(node.id)) {
      ledger.push({ nodeId: node.id, attempt: 0, result: node.disabled ? 'disabled' : 'not_run', payload: 'none', offsetMs: null, durationMs: null });
      continue;
    }
    if (node.disabled) {
      ledger.push({ nodeId: node.id, attempt: 0, result: 'disabled', payload: 'none', offsetMs: null, durationMs: null });
      continue;
    }

    if (reusedRows[node.id]) {
      const previous = reusedRows[node.id];
      ledger.push({ ...structuredClone(previous), attempt: 1, result: 'pinned', offsetMs: clock, durationMs: null });
      clock += 12;
      outgoing(graph, node.id).filter((edge) => !previous.output?.branch || edge.port === previous.output.branch).forEach((edge) => reached.add(edge.to));
    } else if (node.pinned) {
      ledger.push({ nodeId: node.id, attempt: 1, result: 'pinned', payload: 'stored', offsetMs: clock, durationMs: null, output: payload });
      clock += 12;
      outgoing(graph, node.id).forEach((e) => reached.add(e.to));
    } else if (type.group === 'trigger') {
      ledger.push({ nodeId: node.id, attempt: 1, result: 'succeeded', payload: 'stored', offsetMs: clock, durationMs: 2, output: payload });
      clock += 2;
      outgoing(graph, node.id).forEach((e) => reached.add(e.to));
    } else if (type.ports?.includes('yes')) {
      const evaluation = type.id === 'condition'
        ? evaluateCondition(node.params?.expression, payload)
        : { ok: true, value: true, keys: Object.keys(payload) };
      const duration = node.sim?.durationMs ?? type.sim?.durationMs ?? 3;
      if (!evaluation.ok) {
        ledger.push({ nodeId: node.id, attempt: 1, result: 'failed', detail: evaluation.error, payload: 'keys', offsetMs: clock, durationMs: duration, error: { message: evaluation.error } });
        failed = true;
      } else {
        const port = evaluation.value ? 'yes' : 'no';
        ledger.push({ nodeId: node.id, attempt: 1, result: `took_${port}`, payload: 'keys', offsetMs: clock, durationMs: duration, input: { keys: evaluation.keys }, output: { branch: port } });
        outgoing(graph, node.id).filter((e) => e.port === port).forEach((e) => reached.add(e.to));
      }
      clock += duration;
    } else {
      const maxAttempts = node.params?.retry ? (type.retry?.tries ?? 1) : 1;
      const failAttempts = node.sim?.failAttempts ?? 0;
      const durations = node.sim?.attemptDurationsMs ?? [];
      let attempt = 0;
      let succeeded = false;
      while (attempt < maxAttempts && !succeeded) {
        attempt += 1;
        const duration = durations[attempt - 1] ?? node.sim?.durationMs ?? type.sim?.durationMs ?? 20;
        const fails = attempt <= failAttempts;
        ledger.push({
          nodeId: node.id,
          attempt,
          maxAttempts,
          result: fails ? 'failed' : 'succeeded',
          detail: fails ? `the server answered ${node.sim?.failStatus ?? 500}` : undefined,
          payload: 'stored',
          offsetMs: clock,
          durationMs: duration,
          error: fails ? { status: node.sim?.failStatus ?? 500 } : undefined,
          output: fails ? undefined : node.sim?.output,
        });
        clock += duration;
        if (!fails) succeeded = true;
        else if (attempt < maxAttempts) retried = true;
      }
      if (succeeded) outgoing(graph, node.id).forEach((e) => reached.add(e.to));
      else failed = true;
    }
    if (stopAtNodeId && node.id === stopAtNodeId) stopped = true;
  }

  const status = failed ? 'failed' : retried ? 'succeeded_after_retry' : 'succeeded';
  return { ledger, status, durationMs: clock };
}

/** How many ledger rows are visible `elapsedMs` after the start (for a live run). */
export function progressAt(ledger, elapsedMs) {
  return ledger.map((row) => {
    if (row.offsetMs === null || row.offsetMs === undefined) return row;
    if (row.offsetMs > elapsedMs) return { ...row, result: 'queued', hidden: true };
    if (row.durationMs !== null && row.offsetMs + row.durationMs > elapsedMs) return { ...row, result: 'running', durationMs: null };
    return row;
  });
}
