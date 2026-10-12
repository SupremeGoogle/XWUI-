export const connections = [
  { id: 'conn_finance_mail', name: 'Finance mailbox', kind: 'OAuth', ownerId: 'u_you', icon: 'mail', tone: 'pink', status: 'broken', expired: { days: 3 }, usedByFlowIds: ['flow_weekly_digest'], scopes: 'send email', team: 'Finance', lastUsed: { days: 1 } },
  { id: 'conn_sales_chat', name: 'Sales chat workspace', kind: 'OAuth', ownerId: 'u_sam', icon: 'message', tone: 'amber', status: 'expiring', expiresIn: { days: 6 }, usedByFlowIds: ['flow_order_alert'], scopes: 'post messages', team: 'Only you', lastUsed: { days: 1 } },
  { id: 'conn_customer_api', name: 'Customer API', kind: 'API key', ownerId: 'u_you', icon: 'key', tone: 'cyan', status: 'healthy', usedByFlowIds: ['flow_order_alert', 'flow_lead_intake', 'flow_sync_customers'], scopes: 'read', team: 'Sales', lastUsed: { minutes: 2 } },
  { id: 'conn_orders_db', name: 'Orders database', kind: 'Username and password', ownerId: 'u_sam', icon: 'database', tone: 'violet', status: 'healthy', usedByFlowIds: ['flow_order_alert', 'flow_sync_customers'], scopes: 'read, write', team: 'Operations', lastUsed: { hours: 1 } },
  { id: 'conn_crm', name: 'CRM', kind: 'OAuth', ownerId: 'u_sam', icon: 'users', tone: 'lime', status: 'healthy', usedByFlowIds: ['flow_lead_intake'], scopes: 'read, write', team: 'Sales', lastUsed: { minutes: 1 } },
];

/** "Add connection" form options. */
export const connectionForm = {
  kinds: ['OAuth', 'API key', 'Username and password', 'HTTP header auth'],
  teams: ['Only you', 'Sales', 'Finance', 'Operations'],
  scopes: ['read', 'read, write', 'send email', 'post messages'],
  icons: { OAuth: 'shield', 'API key': 'key', 'Username and password': 'lock', 'HTTP header auth': 'globe' },
  tones: ['cyan', 'violet', 'lime', 'orange', 'pink'],
};

/* ------------------------------------------------------------------- flows */

