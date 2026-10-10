/**
 * Studio sample data (the dummy backend's database).
 * Only src/api/studio.api.js reads this file.
 *
 * Times are stored as offsets ("ago") and turned into ISO dates when the API seeds its
 * collections, so relative labels ("2 min ago") stay true whenever the demo is opened.
 */

/* ------------------------------------------------------------------ people */

export const users = [
  { id: 'u_you', name: 'You', initials: 'YO', gradient: 'var(--xw-grad)' },
  { id: 'u_sam', name: 'Sam Rivers', initials: 'SR', gradient: 'var(--xw-grad2)' },
];

export const currentUserId = 'u_you';

export const project = {
  id: 'p_personal',
  name: 'Personal',
  visibility: 'Private',
  description: 'All the flows, agents, tables, forms, connections, variables, runs and MCP servers in this project.',
  sampleNotice: 'Sample rows',
};

export const usage = {
  usedRuns: 3820,
  includedRuns: 10000,
  periodEnds: { days: 19 },
  label: '{used} of {included} runs',
  periodLabel: 'Period ends {date}',
};

/* ------------------------------------------------------------- node catalog */

/** Palette groups, in display order. `tone` names a --xw-* colour token. */
export const nodeGroups = [
  { id: 'trigger', label: 'Triggers', tone: 'lime' },
  { id: 'control', label: 'Control flow', tone: 'orange' },
  { id: 'data', label: 'Data', tone: 'violet' },
  { id: 'ai', label: 'AI', tone: 'pink' },
  { id: 'apps', label: 'Apps and APIs', tone: 'cyan' },
];

/**
 * Step types. `fields` drive the inspector form (XWUI inputs), `ports` the outputs,
 * `notation` how each diagram view draws the step, `lane` the swimlane it belongs to.
 */
export const nodeTypes = [
  {
    id: 'webhook', label: 'Webhook', group: 'trigger', tone: 'lime', icon: 'webhook', palette: true,
    description: 'Starts the flow when an HTTP call arrives.',
    notation: { flowchart: 'terminal', bpmn: 'start-message', sequence: 'source' }, lane: 'source',
    ports: ['out'],
    fields: [
      { key: 'path', label: 'Path', kind: 'text', mono: true, default: '/hooks/orders' },
      { key: 'method', label: 'Method', kind: 'select', options: ['POST', 'PUT'], default: 'POST' },
    ],
    sim: { durationMs: null },
  },
  {
    id: 'schedule', label: 'Schedule', group: 'trigger', tone: 'lime', icon: 'clock', palette: true,
    description: 'Starts the flow on a timetable.',
    notation: { flowchart: 'terminal', bpmn: 'start-timer', sequence: 'source' }, lane: 'source',
    ports: ['out'],
    fields: [
      { key: 'every', label: 'Runs', kind: 'select', options: ['Every hour', 'Every day 08:00', 'Every Monday 08:00'], default: 'Every hour' },
      { key: 'timezone', label: 'Time zone', kind: 'select', options: ['UTC', 'Asia/Riyadh', 'Europe/London'], default: 'UTC' },
    ],
    sim: { durationMs: null },
  },
  {
    id: 'condition', label: 'Condition', group: 'control', tone: 'orange', icon: 'git-branch', palette: true,
    description: 'Sends items down the yes or the no branch.',
    notation: { flowchart: 'decision', bpmn: 'gateway-xor', sequence: 'alt' }, lane: 'engine',
    ports: ['yes', 'no'],
    fields: [
      { key: 'expression', label: 'Condition', kind: 'text', mono: true, expression: true, default: 'order.total > 500' },
    ],
    sim: { durationMs: 3 },
  },
  {
    id: 'wait', label: 'Wait', group: 'control', tone: 'orange', icon: 'hourglass', palette: true,
    description: 'Pauses the run for a time or until someone answers.',
    notation: { flowchart: 'delay', bpmn: 'intermediate-timer', sequence: 'self' }, lane: 'engine',
    ports: ['out'],
    fields: [
      { key: 'until', label: 'Wait until', kind: 'select', options: ['A reply arrives', 'A fixed time passes'], default: 'A reply arrives' },
      { key: 'timeoutHours', label: 'Give up after (hours)', kind: 'number', default: 48 },
    ],
    sim: { durationMs: 1500 },
  },
  {
    id: 'merge', label: 'Merge', group: 'control', tone: 'orange', icon: 'git-merge', palette: true,
    description: 'Joins branches back together.',
    notation: { flowchart: 'junction', bpmn: 'gateway-and', sequence: 'self' }, lane: 'engine',
    ports: ['out'],
    fields: [
      { key: 'mode', label: 'Mode', kind: 'select', options: ['Wait for all', 'First to arrive'], default: 'Wait for all' },
    ],
    sim: { durationMs: 2 },
  },
  {
    id: 'code', label: 'Code', group: 'data', tone: 'violet', icon: 'code', palette: true,
    description: 'Runs a short script on every item.',
    notation: { flowchart: 'process', bpmn: 'task-script', sequence: 'self' }, lane: 'engine',
    ports: ['out'],
    fields: [
      { key: 'source', label: 'Script', kind: 'textarea', mono: true, default: 'return items.map(i => ({ ...i }));' },
    ],
    sim: { durationMs: 18 },
  },
  {
    id: 'set_fields', label: 'Set fields', group: 'data', tone: 'violet', icon: 'variable', palette: true,
    description: 'Adds, renames or removes fields.',
    notation: { flowchart: 'process', bpmn: 'task', sequence: 'self' }, lane: 'engine',
    ports: ['out'],
    fields: [
      { key: 'mapping', label: 'Fields', kind: 'textarea', mono: true, default: 'score = lead.size * 2' },
    ],
    sim: { durationMs: 6 },
  },
  {
    id: 'ai_condition', label: 'AI condition', group: 'ai', tone: 'pink', icon: 'sparkles', palette: true,
    description: 'Lets a model decide which branch an item takes.',
    notation: { flowchart: 'decision', bpmn: 'gateway-xor', sequence: 'alt' }, lane: 'ai',
    ports: ['yes', 'no'],
    fields: [
      { key: 'question', label: 'Question for the model', kind: 'textarea', default: 'Is this request legitimate?' },
      { key: 'model', label: 'Model', kind: 'select', options: ['Fast', 'Careful'], default: 'Fast' },
    ],
    sim: { durationMs: 640 },
  },
  {
    id: 'http_request', label: 'HTTP request', group: 'apps', tone: 'cyan', icon: 'globe', palette: true,
    description: 'Calls any API.',
    notation: { flowchart: 'process', bpmn: 'task-service', sequence: 'call' }, lane: 'apps',
    ports: ['out'],
    fields: [
      { key: 'method', label: 'Method', kind: 'select', options: ['GET', 'POST', 'PUT', 'DELETE'], default: 'GET' },
      { key: 'url', label: 'URL', kind: 'text', mono: true, default: 'https://api.example.com/' },
      { key: 'urlExpression', label: 'Expression', kind: 'expression', default: '' },
      { key: 'connectionId', label: 'Credential', kind: 'connection', default: '' },
      { key: 'retry', label: 'Retry on failure', kind: 'switch', default: true, hint: 'Up to {tries} tries, {delayMs} ms apart' },
    ],
    retry: { tries: 3, delayMs: 1000 },
    sim: { durationMs: 212 },
  },
  {
    id: 'post_message', label: 'Post a message', group: 'apps', tone: 'pink', icon: 'message', palette: false,
    description: 'Posts to a chat channel.',
    notation: { flowchart: 'io', bpmn: 'task-send', sequence: 'call' }, lane: 'apps',
    ports: [],
    fields: [
      { key: 'channel', label: 'Channel', kind: 'text', default: '#sales' },
      { key: 'connectionId', label: 'Chat connection', kind: 'connection', default: '' },
    ],
    sim: { durationMs: 160 },
  },
  {
    id: 'append_row', label: 'Append a row', group: 'data', tone: 'violet', icon: 'table', palette: false,
    description: 'Adds a row to a table.',
    notation: { flowchart: 'data', bpmn: 'task-data', sequence: 'call' }, lane: 'data',
    ports: [],
    fields: [
      { key: 'table', label: 'Table', kind: 'select', options: ['Orders', 'Customers', 'Leads'], default: 'Orders' },
    ],
    sim: { durationMs: 48 },
  },
  {
    id: 'send_email', label: 'Send email', group: 'apps', tone: 'pink', icon: 'mail', palette: false,
    description: 'Sends an email.',
    notation: { flowchart: 'io', bpmn: 'task-send', sequence: 'call' }, lane: 'apps',
    ports: [],
    fields: [
      { key: 'to', label: 'To', kind: 'text', default: 'finance@example.com' },
      { key: 'subject', label: 'Subject', kind: 'text', default: 'Weekly invoice digest' },
    ],
    sim: { durationMs: 310 },
  },
];

/** Lanes used by the swimlane, BPMN and sequence views. */
export const lanes = [
  { id: 'source', label: 'Trigger source', tone: 'lime' },
  { id: 'engine', label: 'xwflow engine', tone: 'orange' },
  { id: 'ai', label: 'AI model', tone: 'pink' },
  { id: 'apps', label: 'Apps and APIs', tone: 'cyan' },
  { id: 'data', label: 'Tables', tone: 'violet' },
];

/* ------------------------------------------------------------- connections */

export const connections = [
  { id: 'conn_customer_api', name: 'Customer API', kind: 'HTTP header auth', icon: 'key', tone: 'cyan', status: 'connected', usedBy: 2, lastUsed: { minutes: 2 } },
  { id: 'conn_sales_chat', name: 'Sales chat', kind: 'Chat workspace', icon: 'message', tone: 'pink', status: 'expired', usedBy: 1, lastUsed: { days: 12 } },
  { id: 'conn_finance_mail', name: 'Finance mailbox', kind: 'SMTP', icon: 'mail', tone: 'orange', status: 'connected', usedBy: 1, lastUsed: { days: 1 } },
  { id: 'conn_crm', name: 'CRM', kind: 'OAuth 2', icon: 'users', tone: 'violet', status: 'connected', usedBy: 1, lastUsed: { minutes: 1 } },
];

/* ------------------------------------------------------------------- flows */

const orderAlertGraph = {
  nodes: [
    { id: 'n_new_order', system: 'shop', type: 'webhook', name: 'New order', x: 296, y: 360, pinned: true, disabled: false,
      params: { path: '/hooks/orders', method: 'POST' } },
    { id: 'n_lookup', system: 'customer_api', type: 'http_request', name: 'Look up customer', x: 496, y: 360, pinned: false, disabled: false,
      call: 'GET /customers/{customer_id}', reply: '200 customer',
      params: { method: 'GET', url: 'https://api.example.com/customers/', urlExpression: 'order.customer_id', connectionId: 'conn_customer_api', retry: true },
      notes: '',
      sim: { failAttempts: 1, failStatus: 503, attemptDurationsMs: [840, 212], output: { customer_id: 'c_1042', tier: 'gold' } } },
    { id: 'n_over_500', type: 'condition', name: 'Over 500?', x: 696, y: 350, pinned: false, disabled: false,
      params: { expression: 'order.total > 500' } },
    { id: 'n_notify', system: 'sales', type: 'post_message', name: 'Notify sales', x: 906, y: 250, pinned: false, disabled: true,
      call: 'post message: order over 500', reply: 'ok',
      params: { channel: '#sales', connectionId: '' } },
    { id: 'n_log', system: 'orders', type: 'append_row', name: 'Log order', x: 906, y: 470, pinned: false, disabled: false,
      call: 'append row', reply: 'row stored',
      params: { table: 'Orders' } },
  ],
  edges: [
    { id: 'e1', from: 'n_new_order', port: 'out', to: 'n_lookup' },
    { id: 'e2', from: 'n_lookup', port: 'out', to: 'n_over_500' },
    { id: 'e3', from: 'n_over_500', port: 'yes', to: 'n_notify' },
    { id: 'e4', from: 'n_over_500', port: 'no', to: 'n_log' },
  ],
  frames: [{ id: 'f_intake', label: 'Intake', tone: 'lime', x: 282, y: 318, w: 380, h: 168 }],
  stickies: [{ id: 's_threshold', text: 'Check the 500 threshold with finance before publishing.', x: 300, y: 196, rotate: -2 }],
};

export const flows = [
  {
    id: 'flow_order_alert', name: 'Order alert', folder: 'Sales', ownerId: 'u_you',
    description: 'Tell sales when an order over 500 arrives, and log every order to a table.',
    trigger: 'On webhook', updated: { minutes: 30 }, publishedVersion: 3, draftChanged: false,
    samplePayload: { order: { id: 'o_5581', customer_id: 'c_1042', total: 740, currency: 'USD' } },
    systems: [
      { id: 'shop', label: 'Shop', hint: 'customer storefront', tone: 'cyan', kind: 'source', call: 'POST /webhook/order', reply: '200 accepted', event: 'Order placed' },
      { id: 'engine', label: 'xwflow', hint: 'engine', tone: 'violet', kind: 'engine' },
      { id: 'customer_api', label: 'Customer API', hint: 'external system', tone: 'orange', kind: 'system' },
      { id: 'sales', label: 'Sales', hint: 'chat channel', tone: 'pink', kind: 'people' },
      { id: 'orders', label: 'Orders table', hint: 'data store', tone: 'lime', kind: 'store' },
    ],
    sim: { arrivalsPerHour: 128, workers: 4, branchShare: { yes: 0.32 }, hours: 8, serviceMinutes: 1.6 },
    graph: orderAlertGraph,
  },
  {
    id: 'flow_weekly_digest', name: 'Weekly invoice digest', folder: 'Finance', ownerId: 'u_you',
    description: 'Every Monday, email finance the invoices that are still open.',
    trigger: 'Mon 08:00', updated: { days: 1 }, publishedVersion: 5, draftChanged: true, chatWaiting: true,
    samplePayload: { invoices: { open: 14, overdue: 3 } },
    graph: {
      nodes: [
        { id: 'n_monday', type: 'schedule', name: 'Every Monday', x: 120, y: 200, params: { every: 'Every Monday 08:00', timezone: 'Asia/Riyadh' } },
        { id: 'n_fetch', type: 'http_request', name: 'Fetch open invoices', x: 360, y: 200,
          params: { method: 'GET', url: 'https://billing.example.com/invoices?state=open', urlExpression: '', connectionId: 'conn_finance_mail', retry: true },
          sim: { failAttempts: 3, failStatus: 504, attemptDurationsMs: [770, 770, 770] } },
        { id: 'n_email', type: 'send_email', name: 'Email the digest', x: 600, y: 200, params: { to: 'finance@example.com', subject: 'Weekly invoice digest' } },
      ],
      edges: [
        { id: 'e1', from: 'n_monday', port: 'out', to: 'n_fetch' },
        { id: 'e2', from: 'n_fetch', port: 'out', to: 'n_email' },
      ],
      frames: [], stickies: [],
    },
  },
  {
    id: 'flow_sync_customers', name: 'Sync customers to the sheet', folder: 'Operations', ownerId: 'u_sam',
    description: 'Every hour, copy new customers into the shared sheet.',
    trigger: 'Every hour', updated: { days: 3 }, publishedVersion: 2, draftChanged: false,
    samplePayload: { customers: { new: 12 } },
    graph: {
      nodes: [
        { id: 'n_hourly', type: 'schedule', name: 'Every hour', x: 120, y: 200, params: { every: 'Every hour', timezone: 'UTC' } },
        { id: 'n_map', type: 'set_fields', name: 'Map columns', x: 360, y: 200, params: { mapping: 'name = customer.full_name' }, sim: { durationMs: 2240 } },
        { id: 'n_rows', type: 'append_row', name: 'Upsert sheet rows', x: 600, y: 200, params: { table: 'Customers' }, sim: { durationMs: 2620 } },
      ],
      edges: [
        { id: 'e1', from: 'n_hourly', port: 'out', to: 'n_map' },
        { id: 'e2', from: 'n_map', port: 'out', to: 'n_rows' },
      ],
      frames: [], stickies: [],
    },
  },
  {
    id: 'flow_refund_approval', name: 'Refund approval', folder: 'Finance', ownerId: 'u_you',
    description: 'Ask a model whether a refund looks legitimate, then wait for a person to approve it.',
    trigger: 'On webhook', updated: { days: 7 }, publishedVersion: null, draftChanged: true,
    samplePayload: { refund: { amount: 120, reason: 'Damaged item' } },
    graph: {
      nodes: [
        { id: 'n_refund', type: 'webhook', name: 'Refund requested', x: 120, y: 200, params: { path: '/hooks/refunds', method: 'POST' } },
        { id: 'n_legit', type: 'ai_condition', name: 'Looks legitimate?', x: 360, y: 200, params: { question: 'Is this refund request legitimate?', model: 'Careful' } },
        { id: 'n_wait', type: 'wait', name: 'Wait for approval', x: 600, y: 200, params: { until: 'A reply arrives', timeoutHours: 48 } },
      ],
      edges: [
        { id: 'e1', from: 'n_refund', port: 'out', to: 'n_legit' },
        { id: 'e2', from: 'n_legit', port: 'yes', to: 'n_wait' },
      ],
      frames: [], stickies: [],
    },
  },
  {
    id: 'flow_lead_intake', name: 'Lead intake', folder: 'Sales', ownerId: 'u_sam',
    description: 'Qualify every form lead with a model, score it, and create it in the CRM.',
    trigger: 'On webhook', updated: { days: 14 }, publishedVersion: 4, draftChanged: false,
    samplePayload: { lead: { email: 'dana@example.com', size: 40 } },
    graph: {
      nodes: [
        { id: 'n_form', type: 'webhook', name: 'Form submitted', x: 120, y: 200, params: { path: '/hooks/leads', method: 'POST' } },
        { id: 'n_qualify', type: 'ai_condition', name: 'Qualify lead', x: 340, y: 200, params: { question: 'Is this a real company lead?', model: 'Fast' } },
        { id: 'n_score', type: 'set_fields', name: 'Score lead', x: 560, y: 200, params: { mapping: 'score = lead.size * 2' } },
        { id: 'n_crm', type: 'http_request', name: 'Create CRM record', x: 780, y: 200,
          params: { method: 'POST', url: 'https://crm.example.com/leads', urlExpression: '', connectionId: 'conn_crm', retry: true } },
      ],
      edges: [
        { id: 'e1', from: 'n_form', port: 'out', to: 'n_qualify' },
        { id: 'e2', from: 'n_qualify', port: 'yes', to: 'n_score' },
        { id: 'e3', from: 'n_score', port: 'out', to: 'n_crm' },
      ],
      frames: [], stickies: [],
    },
  },
];

/** Published versions (immutable snapshots). The latest one per flow mirrors its graph. */
export const versions = [
  { flowId: 'flow_order_alert', version: 1, publishedBy: 'u_you', published: { days: 20 }, note: 'First version' },
  { flowId: 'flow_order_alert', version: 2, publishedBy: 'u_you', published: { days: 9 }, note: 'Retry the customer lookup' },
  { flowId: 'flow_order_alert', version: 3, publishedBy: 'u_you', published: { days: 2 }, note: 'Log every order' },
  { flowId: 'flow_weekly_digest', version: 5, publishedBy: 'u_you', published: { days: 6 }, note: 'Overdue invoices first' },
  { flowId: 'flow_sync_customers', version: 2, publishedBy: 'u_sam', published: { days: 3 }, note: 'Map the full name' },
  { flowId: 'flow_lead_intake', version: 4, publishedBy: 'u_sam', published: { days: 14 }, note: 'Score before the CRM call' },
];

/* -------------------------------------------------------------------- runs */

/**
 * Recorded runs. `ledger` lists every attempt in order. `offsetMs` is when the attempt
 * started, relative to the run start. Results: pinned | succeeded | failed | took_yes |
 * took_no | disabled | not_run | running.
 */
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
  pinned: { label: 'Pinned data', editorLabel: 'Pinned data used', st: 'pin' },
  succeeded: { label: 'Succeeded', st: 'ok' },
  failed: { label: 'Failed', st: 'err' },
  took_yes: { label: 'Took yes', st: 'ok' },
  took_no: { label: 'Took no', st: 'ok' },
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
  connected: { label: 'Connected', st: 'ok' },
  expired: { label: 'Expired', st: 'warn' },
  failing: { label: 'Failing', st: 'err' },
};

/* ------------------------------------------------------------- assistant */

export const assistant = {
  title: { before: 'What should we ', accent: 'automate', after: ' today?' },
  subtitle: 'Describe the job. The assistant drafts it, you review it, and nothing goes live until you publish.',
  placeholder: 'Tell sales on chat when an order over 500 arrives, and log every order to a table',
  focusHint: 'Ctrl I to focus',
  sendLabel: 'Send',
  attachLabel: 'Attach a file',
  speakLabel: 'Speak your request',
  previewTitle: 'Preview',
  previewDraftTag: 'Draft, read-only',
  flowTag: 'Flow',
  topRecommendation: 'Top recommendation',
  stepsCount: '{n} steps',
  stepsToConnect: '{n} steps, {c} to connect',
  openDraftLabel: 'Open in the editor',
  draftingLabel: 'Drafting',
  needsConnection: 'Needs a connection',
  seeAll: 'See all',
  suggestions: [
    { id: 's_order', label: 'Alert me when a new order arrives', templateId: 't_order_alert' },
    { id: 's_digest', label: 'Send a weekly digest', templateId: 't_weekly_digest' },
    { id: 's_support', label: 'Answer customer questions', templateId: 't_support' },
    { id: 's_sync', label: 'Keep two tables in sync', templateId: 't_sync' },
  ],
  startTitle: 'Or start directly',
  startKinds: [
    { id: 'flow', label: 'Flow', hint: 'Automated workflows', icon: 'workflow', tone: 'lime', route: '/studio/flows' },
    { id: 'agent', label: 'Agent', hint: 'AI teammates', icon: 'bot', tone: 'pink', route: null },
    { id: 'table', label: 'Table', hint: 'Automated data', icon: 'table', tone: 'violet', route: null },
    { id: 'form', label: 'Form', hint: 'Automation-ready forms', icon: 'form', tone: 'cyan', route: null },
    { id: 'mcp', label: 'MCP server', hint: 'AI tool integrations', icon: 'plug', tone: 'orange', route: null },
  ],
  recommendedTitle: 'Recommended for you',
  hideLabel: 'Hide',
  showLabel: 'Show',
  notInPrototype: '{name} is not part of this prototype yet.',
};

/**
 * Templates the assistant drafts from. `keywords` decide which template a free-text
 * request maps to; `steps` become the draft graph (laid out left to right).
 */
export const templates = [
  {
    id: 't_order_alert', name: 'Order alert to a chat channel', recommended: true, top: true, tone: 'violet',
    keywords: ['order', 'sales', 'alert', 'chat', '500'],
    steps: [
      { type: 'webhook', name: 'New order' },
      { type: 'condition', name: 'Order over 500?' },
      { type: 'post_message', name: 'Notify sales', needsConnection: true },
    ],
    connectionsNeeded: 1,
  },
  {
    id: 't_weekly_digest', name: 'Weekly digest by email', recommended: true, tone: 'cyan',
    keywords: ['weekly', 'digest', 'email', 'report', 'monday'],
    steps: [
      { type: 'schedule', name: 'Every Monday' },
      { type: 'http_request', name: 'HTTP request' },
      { type: 'send_email', name: 'Send email' },
    ],
  },
  {
    id: 't_log_records', name: 'Log new records to a table', recommended: true, tone: 'lime',
    keywords: ['log', 'record', 'table', 'row'],
    steps: [
      { type: 'webhook', name: 'Field changed' },
      { type: 'set_fields', name: 'Set fields' },
      { type: 'append_row', name: 'Append row' },
    ],
  },
  {
    id: 't_support', name: 'Answer customer questions', tone: 'pink',
    keywords: ['customer', 'question', 'support', 'answer'],
    steps: [
      { type: 'webhook', name: 'Question received' },
      { type: 'ai_condition', name: 'Can the model answer?' },
      { type: 'send_email', name: 'Send the answer' },
    ],
  },
  {
    id: 't_sync', name: 'Keep two tables in sync', tone: 'violet',
    keywords: ['sync', 'tables', 'copy', 'sheet'],
    steps: [
      { type: 'schedule', name: 'Every hour' },
      { type: 'set_fields', name: 'Map columns' },
      { type: 'append_row', name: 'Upsert rows' },
    ],
  },
];

/** Assistant chats shown in the rail. */
export const chats = [
  { id: 'c1', title: 'Order alert to sales', flowId: 'flow_order_alert', waiting: false },
  { id: 'c2', title: 'Weekly invoice digest', flowId: 'flow_weekly_digest', waiting: true, waitingLabel: 'Waiting' },
];

/* ------------------------------------------------------------- navigation */

export const studioNav = {
  brand: 'xwflow',
  collapseLabel: 'Collapse the rail',
  expandLabel: 'Expand the rail',
  searchPlaceholder: 'Search',
  searchLabel: 'Search everything',
  searchShortcut: 'Ctrl K',
  createLabel: 'Create',
  primary: [
    { id: 'assistant', label: 'Assistant', icon: 'sparkles', route: '/studio', badge: { label: 'Preview', tone: 'primary' } },
    { id: 'overview', label: 'Overview', icon: 'home', route: '/studio/flows' },
  ],
  projectGroup: 'Project',
  chatsGroup: 'Chats',
  footer: [
    { id: 'admin', label: 'Admin panel', icon: 'shield', route: '/admin' },
    { id: 'templates', label: 'Templates', icon: 'layers', route: null },
    { id: 'insights', label: 'Insights', icon: 'chart', route: null },
    { id: 'settings', label: 'Settings', icon: 'settings', route: null },
  ],
  helpLabel: 'Help',
  accountLabel: 'Your account',
  createMenu: [
    { id: 'flow', label: 'Flow', icon: 'workflow', action: 'create-flow' },
    { id: 'assistant', label: 'Describe it to the assistant', icon: 'sparkles', route: '/studio' },
  ],
};

/** Project tabs (flows / runs / connections pages). */
export const projectTabs = [
  { id: 'flows', label: 'Flows', route: '/studio/flows' },
  { id: 'agents', label: 'Agents', route: null },
  { id: 'tables', label: 'Tables', route: null },
  { id: 'forms', label: 'Forms', route: null },
  { id: 'connections', label: 'Connections', route: '/studio/connections' },
  { id: 'variables', label: 'Variables', route: null },
  { id: 'runs', label: 'Runs', route: '/studio/runs' },
  { id: 'mcp', label: 'MCP servers', route: null },
];

/** Notation views reachable from the editor and the gallery. */
export const notations = [
  { id: 'editor', label: 'Node graph', short: 'Editor', route: '/studio/flows/:flowId' },
  { id: 'flowchart', label: 'Classic flowchart', short: 'Flowchart', route: '/studio/flows/:flowId/view/flowchart' },
  { id: 'swimlane', label: 'Swimlanes', short: 'Swimlanes', route: '/studio/flows/:flowId/view/swimlane' },
  { id: 'bpmn', label: 'BPMN 2.0.2', short: 'BPMN', route: '/studio/flows/:flowId/view/bpmn' },
  { id: 'sequence', label: 'UML sequence', short: 'Sequence', route: '/studio/flows/:flowId/view/sequence' },
  { id: 'sim', label: 'Simulation', short: 'Simulation', route: '/studio/flows/:flowId/view/sim' },
  { id: '3d', label: '3D space', short: '3D', route: '/studio/flows/:flowId/view/3d' },
];

/* ------------------------------------------------------- editor assistant */

/** "Ask AI" in the editor: which words map to which step type. */
export const editorAssistant = {
  examples: ['Add a wait for approval', 'Email finance when it fails', 'Explain this flow'],
  explainWords: ['explain', 'what does', 'describe', 'summary'],
  keywordsByType: {
    send_email: ['email', 'mail'],
    post_message: ['message', 'chat', 'notify', 'slack', 'post'],
    wait: ['wait', 'pause', 'approval', 'delay'],
    condition: ['condition', 'if ', 'check', 'branch'],
    ai_condition: ['ai', 'model', 'classify', 'qualify'],
    http_request: ['http', 'api', 'request', 'call', 'fetch'],
    code: ['code', 'script', 'javascript'],
    set_fields: ['field', 'set ', 'map', 'rename'],
    append_row: ['row', 'table', 'log', 'record', 'sheet'],
    merge: ['merge', 'join'],
  },
  explainIntro: '{name} starts with {trigger}.',
  explainStep: 'Then {step} ({type}).',
  explainBranch: '{step} sends items down the {port} branch to {target}.',
  explainDisabled: '{step} is disabled, so runs skip it.',
};
