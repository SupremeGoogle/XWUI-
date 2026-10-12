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

