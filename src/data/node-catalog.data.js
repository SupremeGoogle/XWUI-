/** Shared step registry used by the website directory and Studio API. */
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
    ports: ['yes', 'no', 'unsure'],
    fields: [
      { key: 'demoVerdict', label: 'Demo verdict', kind: 'select', options: ['yes', 'no', 'unsure'], default: 'yes' },
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

  {
    id: 'field_changed', label: 'Field changed', group: 'trigger', tone: 'lime', icon: 'edit', palette: true,
    description: 'Starts a run when a record field changes.',
    notation: { flowchart: 'terminal', bpmn: 'start-message', sequence: 'source' }, lane: 'source', ports: ['out'],
    fields: [
      { key: 'record', label: 'Record collection', kind: 'text', default: 'Orders' },
      { key: 'field', label: 'Changed field', kind: 'text', default: 'status' },
    ], sim: { durationMs: null },
  },
  {
    id: 'switch', label: 'Switch', group: 'control', tone: 'orange', icon: 'arrows-shuffle', palette: true,
    description: 'Routes items to a matching case or the default output.',
    notation: { flowchart: 'decision', bpmn: 'gateway-xor', sequence: 'alt' }, lane: 'engine', ports: ['case_1', 'case_2', 'default'],
    fields: [
      { key: 'path', label: 'Input field', kind: 'text', default: 'order.priority' },
      { key: 'case_1', label: 'Case 1 value', kind: 'text', default: 'high' },
      { key: 'case_2', label: 'Case 2 value', kind: 'text', default: 'normal' },
    ], sim: { durationMs: 3 },
  },
  {
    id: 'sub_flow', label: 'Sub-flow', group: 'control', tone: 'orange', icon: 'sitemap', palette: true,
    description: 'Calls another flow as one recorded step.',
    notation: { flowchart: 'process', bpmn: 'task', sequence: 'call' }, lane: 'engine', ports: ['out'],
    fields: [
      { key: 'flowId', label: 'Flow', kind: 'flow', default: '' },
      { key: 'mode', label: 'Version', kind: 'select', options: ['Published version', 'Current draft'], default: 'Published version' },
    ], sim: { durationMs: 20 },
  },
];

const directoryPresentation = {
  "ai_condition": {
    "name": "AI condition",
    "category": "ai",
    "icon": "sparkles",
    "featured": true,
    "description": "Branch on a model's answer with three honest outputs: yes, no and unsure. The receipt records the verdict, model and token count, never the prompt.",
    "assetId": "node-ai-condition"
  },
  "webhook": {
    "name": "Webhook",
    "category": "trig",
    "icon": "bolt",
    "description": "Start a run when an HTTP request arrives.",
    "assetId": "node-webhook"
  },
  "schedule": {
    "name": "Schedule",
    "category": "trig",
    "icon": "clock",
    "description": "Start a run on a cron schedule, in your time zone.",
    "assetId": "node-schedule"
  },
  "field_changed": {
    "name": "Field changed",
    "category": "trig",
    "icon": "edit",
    "description": "Start a run when a record field changes.",
    "assetId": "node-set-fields"
  },
  "http_request": {
    "name": "HTTP request",
    "category": "int",
    "icon": "world",
    "description": "Call any HTTP API with your own credentials.",
    "assetId": "node-http-request"
  },
  "code": {
    "name": "Code",
    "category": "data",
    "icon": "code",
    "description": "Run a script once per item or once per run.",
    "assetId": "node-code"
  },
  "set_fields": {
    "name": "Set fields",
    "category": "data",
    "icon": "adjustments",
    "description": "Add, rename or remove fields on each item.",
    "assetId": "node-set-fields"
  },
  "condition": {
    "name": "Condition",
    "category": "ctrl",
    "icon": "git-branch",
    "description": "Send items down a yes or a no branch.",
    "assetId": "node-condition"
  },
  "switch": {
    "name": "Switch",
    "category": "ctrl",
    "icon": "arrows-shuffle",
    "description": "Route items to one of several outputs.",
    "assetId": "node-condition"
  },
  "merge": {
    "name": "Merge",
    "category": "ctrl",
    "icon": "git-merge",
    "description": "Join branches back into one stream.",
    "assetId": "node-merge"
  },
  "wait": {
    "name": "Wait",
    "category": "ctrl",
    "icon": "player-pause",
    "description": "Pause until a time or a condition.",
    "assetId": "node-wait"
  },
  "sub_flow": {
    "name": "Sub-flow",
    "category": "ctrl",
    "icon": "sitemap",
    "description": "Call another flow as one step.",
    "assetId": "node-merge"
  }
};

export const publicNodeTypes = Object.entries(directoryPresentation).map(([id, presentation]) => ({
  ...presentation,
  id: id.replaceAll('_', '-'),
  nodeType: nodeTypes.find(type => type.id === id).id,
}));
