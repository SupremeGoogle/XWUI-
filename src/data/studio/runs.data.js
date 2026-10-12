export const runs = [
  {
    id: 'run_lead_intake_008', shortId: 'r_7f3a', flowId: 'flow_lead_intake', version: 4, mode: 'production',
    status: 'running', started: { seconds: 70 }, durationMs: null, sequence: 8,
    ledger: [
      { nodeId: 'n_form', attempt: 1, result: 'succeeded', payload: 'stored', offsetMs: 0, durationMs: 4 },
      { nodeId: 'n_qualify', attempt: 1, result: 'took_yes', payload: 'keys', offsetMs: 4, durationMs: 702 },
      { nodeId: 'n_score', attempt: 1, result: 'succeeded', payload: 'stored', offsetMs: 706, durationMs: 6 },
      { nodeId: 'n_crm', attempt: 1, result: 'running', payload: 'none', offsetMs: 712, durationMs: null },
    ],
  },
  {
    id: 'run_order_alert_001', shortId: 'r_7f39', flowId: 'flow_order_alert', version: 3, mode: 'test',
    status: 'succeeded_after_retry', started: { minutes: 2 }, durationMs: 1055, sequence: 1, sampleData: true,
    ledger: [
      { nodeId: 'n_new_order', attempt: 1, result: 'pinned', payload: 'stored', offsetMs: 0, durationMs: null,
        output: { order: { id: 'o_5581', customer_id: 'c_1042', total: 740, currency: 'USD' } } },
      { nodeId: 'n_lookup', attempt: 1, maxAttempts: 3, result: 'failed', detail: 'the server answered 503', payload: 'stored', offsetMs: 12, durationMs: 840,
        input: { method: 'GET', url: 'https://api.example.com/customers/c_1042', credential: 'Customer API' },
        error: { status: 503, message: 'Service Unavailable', retryInMs: 1000 } },
      { nodeId: 'n_lookup', attempt: 2, maxAttempts: 3, result: 'succeeded', payload: 'stored', offsetMs: 852, durationMs: 212,
        input: { method: 'GET', url: 'https://api.example.com/customers/c_1042', credential: 'Customer API' },
        output: { customer_id: 'c_1042', tier: 'gold' } },
      { nodeId: 'n_over_500', attempt: 1, result: 'took_yes', payload: 'keys', offsetMs: 1064, durationMs: 3,
        input: { keys: ['order.total'] }, output: { branch: 'yes' } },
      { nodeId: 'n_notify', attempt: 0, result: 'disabled', payload: 'none', offsetMs: null, durationMs: null },
      { nodeId: 'n_log', attempt: 0, result: 'not_run', payload: 'none', offsetMs: null, durationMs: null },
    ],
  },
  {
    id: 'run_sync_customers_003', shortId: 'r_7f31', flowId: 'flow_sync_customers', version: 2, mode: 'production',
    status: 'succeeded', started: { minutes: 6 }, durationMs: 4870, sequence: 3,
    ledger: [
      { nodeId: 'n_hourly', attempt: 1, result: 'succeeded', payload: 'keys', offsetMs: 0, durationMs: 2 },
      { nodeId: 'n_map', attempt: 1, result: 'succeeded', payload: 'stored', offsetMs: 2, durationMs: 2240 },
      { nodeId: 'n_rows', attempt: 1, result: 'succeeded', payload: 'stored', offsetMs: 2242, durationMs: 2628 },
    ],
  },
  {
    id: 'run_order_alert_009', shortId: 'r_7f1c', flowId: 'flow_order_alert', version: 3, mode: 'production',
    status: 'failed', started: { minutes: 25 }, durationMs: 840, sequence: 9,
    ledger: [
      { nodeId: 'n_new_order', attempt: 1, result: 'succeeded', payload: 'stored', offsetMs: 0, durationMs: 3 },
      { nodeId: 'n_lookup', attempt: 1, maxAttempts: 1, result: 'failed', detail: 'the server answered 503', payload: 'stored', offsetMs: 3, durationMs: 837,
        input: { method: 'GET', url: 'https://api.example.com/customers/c_0977', credential: 'Customer API' },
        error: { status: 503, message: 'Service Unavailable' } },
      { nodeId: 'n_over_500', attempt: 0, result: 'not_run', payload: 'none', offsetMs: null, durationMs: null },
      { nodeId: 'n_notify', attempt: 0, result: 'disabled', payload: 'none', offsetMs: null, durationMs: null },
      { nodeId: 'n_log', attempt: 0, result: 'not_run', payload: 'none', offsetMs: null, durationMs: null },
    ],
  },
  {
    id: 'run_order_alert_010', shortId: 'r_7f1d', flowId: 'flow_order_alert', version: 3, mode: 'retry', retryOf: 'run_order_alert_009',
    status: 'succeeded', started: { minutes: 24 }, durationMs: 986, sequence: 10,
    ledger: [
      { nodeId: 'n_new_order', attempt: 1, result: 'succeeded', payload: 'stored', offsetMs: 0, durationMs: 2 },
      { nodeId: 'n_lookup', attempt: 1, result: 'succeeded', payload: 'stored', offsetMs: 2, durationMs: 931 },
      { nodeId: 'n_over_500', attempt: 1, result: 'took_no', payload: 'keys', offsetMs: 933, durationMs: 3 },
      { nodeId: 'n_notify', attempt: 0, result: 'disabled', payload: 'none', offsetMs: null, durationMs: null },
      { nodeId: 'n_log', attempt: 1, result: 'succeeded', payload: 'stored', offsetMs: 936, durationMs: 50 },
    ],
  },
  {
    id: 'run_weekly_digest_014', shortId: 'r_7e10', flowId: 'flow_weekly_digest', version: 5, mode: 'production',
    status: 'failed', started: { days: 1, hours: 4 }, durationMs: 2310, sequence: 14,
    ledger: [
      { nodeId: 'n_monday', attempt: 1, result: 'succeeded', payload: 'keys', offsetMs: 0, durationMs: 0 },
      { nodeId: 'n_fetch', attempt: 1, maxAttempts: 3, result: 'failed', detail: 'the server answered 504', payload: 'stored', offsetMs: 0, durationMs: 770,
        error: { status: 504, message: 'Gateway Timeout' } },
      { nodeId: 'n_fetch', attempt: 2, maxAttempts: 3, result: 'failed', detail: 'the server answered 504', payload: 'stored', offsetMs: 770, durationMs: 770,
        error: { status: 504, message: 'Gateway Timeout' } },
      { nodeId: 'n_fetch', attempt: 3, maxAttempts: 3, result: 'failed', detail: 'the server answered 504', payload: 'stored', offsetMs: 1540, durationMs: 770,
        error: { status: 504, message: 'Gateway Timeout' } },
      { nodeId: 'n_email', attempt: 0, result: 'not_run', payload: 'none', offsetMs: null, durationMs: null },
    ],
  },
  {
    id: 'run_order_alert_008', shortId: 'r_7d02', flowId: 'flow_order_alert', version: 2, mode: 'replay',
    status: 'succeeded', started: { days: 3, hours: 20 }, durationMs: 1102, sequence: 8,
    ledger: [
      { nodeId: 'n_new_order', attempt: 1, result: 'succeeded', payload: 'stored', offsetMs: 0, durationMs: 3 },
      { nodeId: 'n_lookup', attempt: 1, result: 'succeeded', payload: 'stored', offsetMs: 3, durationMs: 1040 },
      { nodeId: 'n_over_500', attempt: 1, result: 'took_yes', payload: 'keys', offsetMs: 1043, durationMs: 4 },
      { nodeId: 'n_notify', attempt: 1, result: 'succeeded', payload: 'stored', offsetMs: 1047, durationMs: 55 },
      { nodeId: 'n_log', attempt: 0, result: 'not_run', payload: 'none', offsetMs: null, durationMs: null },
    ],
  },
  {
    id: 'run_lead_intake_007', shortId: 'r_7a51', flowId: 'flow_lead_intake', version: 4, mode: 'production',
    status: 'failed', started: { days: 9 }, durationMs: 1410, sequence: 7,
    ledger: [
      { nodeId: 'n_form', attempt: 1, result: 'succeeded', payload: 'stored', offsetMs: 0, durationMs: 4 },
      { nodeId: 'n_qualify', attempt: 1, result: 'took_yes', payload: 'keys', offsetMs: 4, durationMs: 690 },
      { nodeId: 'n_score', attempt: 1, result: 'succeeded', payload: 'stored', offsetMs: 694, durationMs: 6 },
      { nodeId: 'n_crm', attempt: 1, maxAttempts: 1, result: 'failed', detail: 'the CRM refused the record (409, duplicate)', payload: 'stored', offsetMs: 700, durationMs: 710,
        error: { status: 409, message: 'Duplicate lead' } },
    ],
  },
];

/** Runs per hour today (oldest first). `failed` marks hours with at least one failure. */
export const runsPerHour = [
  { hour: 0, runs: 4 }, { hour: 1, runs: 6 }, { hour: 2, runs: 7 }, { hour: 3, runs: 6 },
  { hour: 4, runs: 10 }, { hour: 5, runs: 8, failed: true }, { hour: 6, runs: 12 }, { hour: 7, runs: 14 },
  { hour: 8, runs: 17 }, { hour: 9, runs: 16 }, { hour: 10, runs: 11, failed: true }, { hour: 11, runs: 18 },
  { hour: 12, runs: 12, partial: true },
];

/* ---------------------------------------------------------------- labels */

export const runStatuses = {
  running: { label: 'Running', st: 'run' },
  waiting: { label: 'Waiting for a reply', st: 'warn' },
  succeeded: { label: 'Succeeded', st: 'ok' },
  succeeded_after_retry: { label: 'Succeeded after a retry', st: 'ok' },
  failed: { label: 'Failed', st: 'err' },
  cancelled: { label: 'Cancelled', st: 'idle' },
  queued: { label: 'Queued', st: 'idle' },
};

export const runModes = {
  production: { label: 'Production', tone: 'primary' },
  test: { label: 'Test', tone: 'cyan', longLabel: 'Test mode' },
  retry: { label: 'Retry', tone: 'orange' },
  replay: { label: 'Replay', tone: 'violet' },
};

export const stepResults = {
  waiting: { label: 'Waiting for a reply', st: 'warn' },
  approved: { label: 'Approved', st: 'ok' },
  rejected: { label: 'Rejected', st: 'err' },
  pinned: { label: 'Pinned data', editorLabel: 'Pinned data used', st: 'pin' },
  succeeded: { label: 'Succeeded', st: 'ok' },
  failed: { label: 'Failed', st: 'err' },
  took_yes: { label: 'Took yes', st: 'ok' },
  took_no: { label: 'Took no', st: 'ok' },
  took_unsure: { label: 'Took unsure', st: 'warn' },
  took_case_1: { label: 'Took case 1', st: 'ok' },
  took_case_2: { label: 'Took case 2', st: 'ok' },
  took_default: { label: 'Took default', st: 'ok' },
  disabled: { label: 'Disabled', st: 'dis' },
  not_run: { label: 'Not run', st: 'idle' },
  running: { label: 'Running', st: 'run' },
};

export const payloadLabels = { stored: 'Stored', keys: 'Keys only', none: 'None' };

export const flowStatuses = {
  published: { label: 'Published', st: 'ok' },
  changes: { label: 'Unpublished changes', st: 'warn' },
  draft: { label: 'Draft', st: 'idle' },
};

export const connectionStatuses = {
  healthy: { label: 'Healthy', st: 'ok', filterLabel: 'Healthy' },
  expiring: { label: 'Expires in {days} days', st: 'warn', filterLabel: 'Expiring' },
  broken: { label: 'Broken', st: 'err', filterLabel: 'Broken' },
};

/* ------------------------------------------------------------- assistant */

