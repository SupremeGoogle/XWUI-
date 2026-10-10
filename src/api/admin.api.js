import { respond, paginate, createCollection, ApiError } from '../core/mock.js';
import { adminData, ADMIN_RULES } from '../data/admin.data.js';
import { resolveAssets } from './assets.api.js';

const brands = createCollection('admin_brands', [adminData.brandSeed]);
const events = createCollection('admin_audit', adminData.auditSeed);
const streaming = createCollection('admin_streaming', [adminData.streamingSeed]);
const health = createCollection('admin_health', [adminData.healthSeed]);
const access = createCollection('admin_access', []);
const mutation = (options = {}) => ({ failRate: options.fail ? 1 : ADMIN_RULES.failureRate });
function log(action, object) { events.create({ action, object, actor: 'You', actorClass: 'Person', timestamp: new Date().toISOString(), timeLabel: 'just now', tone: 'lime' }); }
function filteredEvents({ q = '', actor = '', actorClass = '', action = '', object = '', days = '7' } = {}) {
  const reference = Math.max(Date.parse(ADMIN_RULES.auditReferenceTime), ...events.list().map((event) => Date.parse(event.timestamp)));
  return events.list((event) => (!q || `${event.action} ${event.object} ${event.actor} ${event.actorClass}`.toLowerCase().includes(q.trim().toLowerCase())) && (!actor || event.actor === actor) && (!actorClass || event.actorClass === actorClass) && (!action || event.action === action) && (!object || event.object === object) && (days === 'all' || Date.parse(event.timestamp) >= reference - Number(days) * ADMIN_RULES.dayMs)).sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp));
}
export const adminApi = {
  /** @returns {Promise<object>} Fictional sample logo and favicon loaded by manifest ID. */
  getBrandingSample: (index) => respond(async () => { const refs = adminData.assetRefs.samples[index]; if (!refs) throw new ApiError('not_found', 'Sample brand not found.'); const assets = await resolveAssets(Object.values(refs)); const result = {}; for (const key of ['logo', 'favicon']) { const asset = assets[refs[key]]; const response = await fetch(asset.path); if (!response.ok) throw new ApiError('unavailable', 'Sample image could not be loaded.'); result[key] = { id: asset.id, content: await response.text() }; } return result; }),
  /** @returns {Promise<object>} Shared navigation, labels and placeholder metadata. */
  getNavigation: () => respond(async () => ({ ...adminData.navigation, labels: adminData.labels, placeholder: adminData.placeholder, assetRefs: adminData.assetRefs, assets: await resolveAssets(adminData.assetIds) })),
  /** @returns {Promise<object>} Overview heading and panel definitions. */
  getOverview: () => respond(() => ({ title: adminData.overview.title, description: adminData.overview.description, labels: adminData.labels })),
  /** @returns {Promise<object[]>} KPI records, independently loadable. */
  getKpis: (options = {}) => respond(() => adminData.overview.kpis, { failRate: options.fail ? 1 : 0 }),
  /** @returns {Promise<object>} Hourly chart data, independently loadable. */
  getRunsByHour: (options = {}) => respond(() => adminData.overview.chart, { failRate: options.fail ? 1 : 0 }),
  /** @returns {Promise<object>} Current service reachability. */
  getReachability: () => respond(() => { const result = structuredClone(adminData.overview.reachability); if (health.get('system').checkCount) { result.tiles = result.tiles.map((tile) => tile.label === 'Storage' ? { ...tile, tone: 'green', attention: false } : tile); result.notice = result.healthy; } return result; }),
  /** @returns {Promise<object>} Failed-run rows and column definitions. */
  getFailedRuns: () => respond(() => adminData.overview.failures),
  /** @returns {Promise<{content:object,kit:object,labels:object,rules:object}>} Brand kit and form/preview metadata. */
  getBranding: () => respond(async () => ({ content: adminData.branding, kit: brands.get('personal'), labels: adminData.labels, rules: { maxBytes: ADMIN_RULES.uploadMaxBytes, mime: ADMIN_RULES.uploadMime, darkText: ADMIN_RULES.darkText }, assetRefs: adminData.assetRefs, assets: await resolveAssets(adminData.assetIds) })),
  /** @returns {Promise<object>} Validated and persisted brand kit. */
  saveBrandKit: (patch, options) => respond(() => {
    const keys = Object.keys(adminData.brandSeed).filter((key) => !['id', 'savedAt'].includes(key));
    const next = { ...brands.get('personal'), ...Object.fromEntries(keys.filter((key) => key in patch).map((key) => [key, patch[key]])) };
    if (!next.productName?.trim() || !next.assistantName?.trim() || ['primary', 'background', 'text', 'buttonText'].some((key) => !ADMIN_RULES.hexPattern.test(next[key])) || !adminData.branding.fonts.some((font) => font.value === next.font)) throw new ApiError('validation', adminData.branding.validation);
    if (next.domain && !ADMIN_RULES.domainPattern.test(next.domain)) throw new ApiError('validation', adminData.branding.domainError);
    for (const key of ['logo', 'favicon']) if (next[key] && (!/^data:image\/(?:png|jpeg|webp|gif|svg\+xml|x-icon|vnd.microsoft.icon);base64,/.test(next[key]) || next[key].length > Math.ceil(ADMIN_RULES.uploadMaxBytes * 4 / 3) + 100)) throw new ApiError('validation', adminData.branding.uploadError);
    const result = brands.update('personal', { ...next, productName: next.productName.trim(), assistantName: next.assistantName.trim(), savedAt: new Date().toISOString() }); log('Brand kit saved', result.productName); return result;
  }, mutation(options)),
  /** @returns {Promise<object>} Audit content and filter options derived from event records. */
  getAudit: () => respond(() => ({ ...adminData.audit, labels: adminData.labels, filters: adminData.audit.filters.map((filter) => ({ ...filter, options: [...new Set(events.list().map((event) => event[filter.key]))].map((value) => ({ value, label: value })) })), streamingConfig: streaming.get('personal') })),
  /** @returns {Promise<object>} Filtered and paginated newest-first events. */
  listAuditEvents: (filters = {}) => respond(() => paginate(filteredEvents(filters), { page: filters.page ?? 1, pageSize: filters.pageSize ?? adminData.audit.pageSize })),
  /** @returns {Promise<{filename:string,csv:string}>} CSV of all events matching the current filter. */
  exportAudit: (filters) => respond(() => { const keys = ['timestamp', 'action', 'object', 'actor', 'actorClass']; const cell = (value) => `"${String(value ?? '').replace(/^[=+@-]/, "'$&").replaceAll('"', '""')}"`; return { filename: adminData.audit.csvName, csv: '\uFEFF' + [keys.map(cell).join(','), ...filteredEvents(filters).map((row) => keys.map((key) => cell(row[key])).join(','))].join('\r\n') }; }),
  /** @returns {Promise<object>} HTTPS SIEM endpoint and enabled state. */
  configureStreaming: ({ endpoint, enabled }, options) => respond(() => { let url; try { url = new URL(endpoint); } catch { /* reported below */ } if (!url || url.protocol !== 'https:' || url.username || url.password) throw new ApiError('validation', adminData.audit.streaming.validation); const result = streaming.update('personal', { endpoint: url.href, enabled: Boolean(enabled), savedAt: new Date().toISOString() }); log('Audit streaming configured', url.hostname); return result; }, mutation(options)),
  /** @returns {Promise<{content:object,state:object,labels:object}>} Health content and persisted check/action state. */
  getHealth: () => respond(async () => ({ content: adminData.health, state: health.get('system'), labels: adminData.labels, assetRefs: adminData.assetRefs, assets: await resolveAssets(adminData.assetIds) })),
  /** @returns {Promise<object>} Refreshed checks. The deterministic sample service recovers on recheck. */
  checkHealth: (options) => respond(() => { const current = health.get('system'); const checks = current.checks.map((check) => ({ ...check, age: adminData.healthResults.age, ...(check.id === 'storage' ? adminData.healthResults.storage : check.id === 'scheduler' ? current.schedulesPaused ? adminData.healthResults.pausedScheduler : adminData.healthResults.scheduler : {}) })); return health.update('system', { checkCount: current.checkCount + 1, checkedAt: new Date().toISOString(), checks, uptime: current.uptime.map((row) => ({ ...row, days: row.days.map((variant, index) => index === row.days.length - 1 ? 'success' : variant) })) }); }, mutation(options)),
  /** @returns {Promise<object>} Paused schedule state; repeated requests are idempotent. */
  pauseSchedules: (options) => respond(() => { const current = health.get('system'); if (current.schedulesPaused) return current; log('Schedules paused', 'All schedules in Personal workspace'); return health.update('system', { schedulesPaused: true, checks: current.checks.map((check) => check.id === 'scheduler' ? { ...check, ...adminData.healthResults.pausedScheduler } : check) }); }, mutation(options)),
  /** @returns {Promise<object>} Worker admission state; repeated drain requests are idempotent. */
  drainWorker: (worker = adminData.health.actions.worker, options) => respond(() => { if (worker !== adminData.health.actions.worker) throw new ApiError('not_found', 'Worker not found.'); const current = health.get('system'); if (current.drainedWorkers.includes(worker)) return current; log('Worker drained', worker); return health.update('system', { drainedWorkers: [...current.drainedWorkers, worker], checks: current.checks.map((check) => check.id === 'workers' ? { ...check, ...adminData.healthResults.drainedWorkers } : check) }); }, mutation(options)),
  /** @returns {Promise<object>} Access-denied content and current request, never quota data. */
  getDenied: () => respond(async () => ({ ...adminData.denied, requestRecord: access.get('quotas'), labels: adminData.labels, assetRefs: adminData.assetRefs, assets: await resolveAssets(adminData.assetIds) })),
  /** @returns {Promise<object>} One persistent request for Quotas access. */
  requestAccess: (resource = 'quotas', options) => respond(() => { if (resource !== adminData.denied.resource) throw new ApiError('not_found', 'Resource not found.'); const existing = access.get(resource); if (existing) return existing; const request = access.create({ id: resource, role: 'Operator', status: 'pending', createdAt: new Date().toISOString() }); log('Access requested', 'Quotas: Operator role'); return request; }, mutation(options)),
};
