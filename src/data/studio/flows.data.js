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
      params: { channel: '#sales', connectionId: 'conn_sales_chat' } },
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
