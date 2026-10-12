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
export function simulateRun({ graph, types, payload, stopAtNodeId = null, reusedRows = {}, subFlows = {}, callStack = [], historyRows = [], waitDecisions = {}, stepPath = [] }) {
  const ledger = [];
  const reached = new Set();
  const ordered = orderNodes(graph, types);
  const triggers = ordered.filter((n) => types[n.type]?.group === 'trigger');
  triggers.forEach((t) => reached.add(t.id));

  let clock = 0;
  let failed = false;
  let retried = false;
  let stopped = false;
  let cancelled = false;
  let pendingWait = null;

  for (const node of ordered) {
    const type = types[node.type] ?? {};
    if (stopped || failed || pendingWait || !reached.has(node.id)) {
      ledger.push({ nodeId: node.id, attempt: 0, result: node.disabled ? 'disabled' : 'not_run', payload: 'none', offsetMs: null, durationMs: null });
      continue;
    }
    if (node.disabled) {
      ledger.push({ nodeId: node.id, attempt: 0, result: 'disabled', payload: 'none', offsetMs: null, durationMs: null });
      continue;
    }

    const past = historyRows.filter(row => row.nodeId === node.id && row.attempt > 0);
    const previous = past.at(-1);
    const completed = previous && (['succeeded', 'pinned', 'approved'].includes(previous.result) || previous.result.startsWith('took_'));
    if (completed) {
      ledger.push(...structuredClone(past));
      clock = Math.max(clock, ...past.map(row => (row.offsetMs ?? 0) + (row.durationMs ?? 0)));
      if (past.some(row => row.result === 'failed')) retried = true;
      outgoing(graph, node.id).filter(edge => !previous.output?.branch || edge.port === previous.output.branch).forEach(edge => reached.add(edge.to));
    } else if (reusedRows[node.id]) {
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
    } else if (type.id === 'wait' && (node.params?.until ?? type.wait?.replyValue) === type.wait?.replyValue) {
      const stepId = [...stepPath, node.id].join('/');
      const decision = waitDecisions[stepId];
      const waitingRow = previous?.result === 'waiting' ? previous : {
        nodeId: node.id, attempt: 1, result: 'waiting', payload: 'stored', offsetMs: clock,
        durationMs: null, input: payload,
      };
      ledger.push(structuredClone(waitingRow));
      if (decision) {
        clock = Math.max(clock, decision.offsetMs);
        ledger.push({ nodeId: node.id, attempt: 1, result: decision.decision === 'approve' ? 'approved' : 'rejected',
          event: 'wait_decision', payload: 'stored', offsetMs: clock, durationMs: 0,
          decision: decision.decision, actorId: decision.actorId, actorName: decision.actorName, resolvedAt: decision.resolvedAt,
          output: { decision: decision.decision, actor: decision.actorName, resolvedAt: decision.resolvedAt },
        });
        if (decision.decision === 'approve') outgoing(graph, node.id).forEach(edge => reached.add(edge.to));
        else { cancelled = true; stopped = true; }
      } else pendingWait = { nodeId: node.id, stepId, stepName: node.name, offsetMs: clock };
    } else if (type.id === 'sub_flow') {
      const flowId = node.params?.flowId;
      const target = subFlows[flowId];
      const nestedGraph = node.params?.mode === 'Current draft' ? target?.graph : target?.publishedGraph;
      const error = !target ? 'Select an existing flow.' : !nestedGraph ? 'Publish the called flow first.' : callStack.includes(flowId) || callStack.length >= 8 ? 'Recursive sub-flow calls are not supported.' : null;
      if (error) {
        ledger.push({ nodeId: node.id, attempt: 1, result: 'failed', detail: error, payload: 'none', offsetMs: clock, durationMs: 0, error: { message: error } });
        failed = true;
      } else {
        const nested = simulateRun({ graph: nestedGraph, types, payload, subFlows, callStack: [...callStack, flowId],
          historyRows: previous?.output?.ledger ?? [], waitDecisions, stepPath: [...stepPath, node.id] });
        const succeeded = nested.status.startsWith('succeeded');
        if (previous?.result === 'waiting') ledger.push(...structuredClone(past));
        ledger.push({ nodeId: node.id, attempt: 1, result: nested.status === 'waiting' ? 'waiting' : nested.status === 'cancelled' ? 'rejected' : succeeded ? 'succeeded' : 'failed', payload: 'stored', offsetMs: clock, durationMs: nested.status === 'waiting' ? null : nested.durationMs,
          output: { flowId, status: nested.status, ledger: nested.ledger }, ...(nested.status === 'failed' ? { error: { message: 'The called flow failed.' } } : {}) });
        clock += nested.durationMs;
        if (succeeded) outgoing(graph, node.id).forEach(e => reached.add(e.to));
        else if (nested.status === 'waiting') pendingWait = { ...nested.pendingWait, nodeId: node.id };
        else if (nested.status === 'cancelled') { cancelled = true; stopped = true; }
        else failed = true;
        if (nested.status === 'succeeded_after_retry') retried = true;
      }
    } else if ((type.ports?.length ?? 0) > 1) {
      const evaluation = type.id === 'condition'
        ? evaluateCondition(node.params?.expression, payload)
        : { ok: true, value: true, keys: Object.keys(payload) };
      const duration = node.sim?.durationMs ?? type.sim?.durationMs ?? 3;
      if (!evaluation.ok) {
        ledger.push({ nodeId: node.id, attempt: 1, result: 'failed', detail: evaluation.error, payload: 'keys', offsetMs: clock, durationMs: duration, error: { message: evaluation.error } });
        failed = true;
      } else {
        let port = evaluation.value ? 'yes' : 'no';
        if (type.id === 'ai_condition') {
          const verdict = node.sim?.verdict ?? node.params?.demoVerdict ?? 'yes';
          port = type.ports.includes(verdict) ? verdict : 'unsure';
        } else if (type.id === 'switch') {
          const value = getPath(payload, node.params?.path);
          port = type.ports.find(id => id !== 'default' && value !== undefined && String(value) === String(node.params?.[id])) ?? 'default';
        }
        const output = { branch: port };
        if (type.id === 'ai_condition') Object.assign(output, { verdict: port, model: node.params?.model ?? type.fields.find(field => field.key === 'model')?.default, tokenCount: node.sim?.tokenCount ?? type.sim?.tokenCount ?? 64 });
        ledger.push({ nodeId: node.id, attempt: 1, result: `took_${port}`, payload: 'keys', offsetMs: clock, durationMs: duration, input: { keys: evaluation.keys }, output });
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
          input: payload,
          output: fails ? undefined : node.sim?.output ?? payload,
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

  const status = failed ? 'failed' : cancelled ? 'cancelled' : pendingWait ? 'waiting' : retried ? 'succeeded_after_retry' : 'succeeded';
  return { ledger, status, durationMs: clock, pendingWait };
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
