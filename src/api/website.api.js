import { respond, paginate, createCollection, ApiError } from '../core/mock.js';
import { websiteData, WEBSITE_RULES } from '../data/website.data.js';

const quotes = createCollection('website_quotes', []);
const mutation = (options = {}) => ({ failRate: options.fail ? 1 : WEBSITE_RULES.failureRate });
export const websiteApi = {
  /** @returns {Promise<object>} Site navigation and footer content. */
  getNavigation: () => respond(() => websiteData.navigation),
  /** @returns {Promise<object>} Common public UI labels. */
  getLabels: () => respond(() => websiteData.labels),
  /** @returns {Promise<object>} Landing content with shared catalog records. */
  getLanding: () => respond(() => ({ ...websiteData.landing, steps: websiteData.integrations, dialects: websiteData.dialects, notationItems: websiteData.notationItems, labels: websiteData.labels })),
  /** @returns {Promise<object>} Directory metadata, category definitions and featured connector. */
  getDirectory: () => respond(() => ({ ...websiteData.directory, categories: websiteData.categories, labels: websiteData.labels, featured: enrich(websiteData.integrations.find((item) => item.featured)) })),
  /** @returns {Promise<{items:object[],total:number,page:number,pageSize:number,pages:number}>} Filtered catalog page. */
  listIntegrations: ({ q = '', category = 'all', page = 1, pageSize = websiteData.directory.pageSize } = {}) => respond(() => paginate(websiteData.integrations.filter((item) => (category === 'all' || item.category === category) && `${item.name} ${item.description}`.toLowerCase().includes(q.trim().toLowerCase())).map(enrich), { page, pageSize })),
  /** @returns {Promise<object>} Connector detail. */
  getIntegration: (id) => respond(() => { const item = websiteData.integrations.find((record) => record.id === id); if (!item) throw new ApiError('not_found', 'Integration not found.'); return enrich(item); }),
  /** @returns {Promise<object>} Pricing tiers, table, quote form and FAQ. The prototype has no billing toggle. */
  getPricing: () => respond(() => ({ ...websiteData.pricing, labels: websiteData.labels })),
  /** @returns {Promise<object>} Self-host steps and commands, including explicit reference placeholders. */
  getSelfHost: () => respond(() => ({ ...websiteData.selfHost, labels: websiteData.labels })),
  /** @returns {Promise<object>} Persisted quote request. No external communication occurs. */
  requestQuote: ({ email, notes }, options) => respond(() => { if (!WEBSITE_RULES.emailPattern.test(email?.trim() ?? '') || !notes?.trim()) throw new ApiError('validation', websiteData.pricing.contact.validation); return quotes.create({ email: email.trim(), notes: notes.trim(), createdAt: new Date().toISOString() }); }, mutation(options)),
  /** @returns {Promise<object>} Deterministic sample run result, never a live integration. */
  runSandbox: () => respond(() => ({ nodes: websiteData.landing.scene.nodes.map((node) => ({ ...node, status: node.id === 'log' ? websiteData.landing.scene.idleStatus : websiteData.landing.scene.completedStatus, variant: node.id === 'log' ? 'neutral' : 'success' })), receipt: websiteData.landing.scene.receipt.map((row) => row.value === 'running' ? { ...row, value: 'Done', variant: 'success' } : row), message: websiteData.landing.scene.complete })),
};

function enrich(item) { const group = websiteData.categories.find((record) => record.id === item.category); return { ...item, categoryLabel: group.singular ?? group.label, tone: group.tone }; }
