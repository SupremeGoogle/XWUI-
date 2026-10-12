/** Persistent management resources shared by Studio and Admin; UI never accesses collections. */
import { respond, createCollection, paginate, matches, clone, ApiError, nowIso } from '../core/mock.js';
import { RESOURCE_COPY, RESOURCE_RULES } from '../data/resource-copy.data.js';

export function createResourceApi({ namespace, definitions, derive = () => null, mutate, action, decorate }) {
  const tables = Object.fromEntries(Object.entries(definitions).map(([id, definition]) =>
    [id, createCollection(`${namespace}_${id}`, definition.rows)]));
  const options = (input = {}) => ({ failRate: input.fail ? 1 : RESOURCE_RULES.failureRate });
  const definition = (id) => {
    if (!definitions[id]) throw new ApiError('not_found', RESOURCE_COPY.resourceNotFound);
    return definitions[id];
  };
  const records = async (id) => {
    definition(id);
    const source = await derive(id);
    if (!source) return tables[id].all();
    return source.map(row => ({ enabled: true, archived: false, ...row, ...tables[id].get(row.id),
      ...Object.fromEntries(definition(id).fields.filter(field => field.readOnly).map(field => [field.key, row[field.key]])),
    }));
  };
  const requireRecord = async (id, recordId) => {
    const record = (await records(id)).find(row => row.id === recordId);
    if (!record) throw new ApiError('not_found', RESOURCE_COPY.notFound);
    return record;
  };
  const persist = (id, row) => tables[id].get(row.id) ? tables[id].update(row.id, row) : tables[id].create(row);
  const validate = (id, input, base = {}) => {
    const result = {};
    for (const field of definition(id).fields) {
      const value = field.readOnly && base.id ? base[field.key] : input[field.key] ?? base[field.key] ?? '';
      const text = String(value).trim();
      const error = (message) => new ApiError('invalid', message.replace('{field}', field.label));
      if (field.required && !text) throw error(RESOURCE_COPY.required);
      if (text.length > RESOURCE_RULES.maxText || (field.key === 'name' && text.length > RESOURCE_RULES.nameMax)) throw error(RESOURCE_COPY.invalid);
      if (field.kind === 'json') {
        try { if (!Array.isArray(JSON.parse(text))) throw new Error(); } catch { throw error(RESOURCE_COPY.invalid); }
      }
      if (field.kind === 'number' && (!Number.isFinite(Number(text)) || Number(text) < 0)) throw error(RESOURCE_COPY.invalid);
      if (field.kind === 'https') {
        try { const url = new URL(text); if (url.protocol !== 'https:' || url.username || url.password) throw new Error(); } catch { throw error(RESOURCE_COPY.invalid); }
      }
      result[field.key] = text;
    }
    return result;
  };
  return {
    getResourceDefinition: (id, input) => respond(() => {
      const { rows, ...content } = definition(id);
      return { ...content, id, copy: RESOURCE_COPY, pageSize: RESOURCE_RULES.pageSize };
    }, options(input)),
    listResources: (id, { q = '', status = 'all', page = 1, pageSize = RESOURCE_RULES.pageSize } = {}, input) => respond(async () => {
      const all = await records(id);
      const keys = definition(id).fields.map(field => field.key);
      const filtered = all.filter(row => matches(row, q, keys) &&
        (status === 'archived' ? row.archived : !row.archived && (status === 'all' || row.enabled === (status === 'enabled'))));
      return { ...paginate(filtered, { page, pageSize }), kpis: { total: all.filter(row => !row.archived).length, enabled: all.filter(row => !row.archived && row.enabled).length } };
    }, options(input)),
    createResource: (id, input, opts) => respond(async () => {
      if (!definition(id).allowCreate) throw new ApiError('invalid', RESOURCE_COPY.unavailable);
      const values = validate(id, input);
      const extra = await decorate?.(id, values) ?? {};
      return tables[id].create({ ...values, ...extra, enabled: true, archived: false, updatedAt: nowIso() });
    }, options(opts)),
    updateResource: (id, recordId, input, opts) => respond(async () => {
      const record = await requireRecord(id, recordId);
      const values = validate(id, input, record);
      await mutate?.(id, record, values);
      return persist(id, { ...record, ...values, updatedAt: nowIso() });
    }, options(opts)),
    toggleResource: (id, recordId, enabled, opts) => respond(async () => {
      if (!definition(id).allowToggle || typeof enabled !== 'boolean') throw new ApiError('invalid', RESOURCE_COPY.unavailable);
      const record = await requireRecord(id, recordId);
      await mutate?.(id, record, { enabled });
      return persist(id, { ...record, enabled, updatedAt: nowIso() });
    }, options(opts)),
    archiveResource: (id, recordId, archived = true, opts) => respond(async () => {
      if (!definition(id).allowArchive || typeof archived !== 'boolean') throw new ApiError('invalid', RESOURCE_COPY.unavailable);
      const record = await requireRecord(id, recordId);
      return persist(id, { ...record, archived, updatedAt: nowIso() });
    }, options(opts)),
    actOnResource: (id, recordId, opts) => respond(async () => {
      definition(id);
      return action(id, await requireRecord(id, recordId));
    }, options(opts)),
    exportResource: (id, recordId) => respond(async () => {
      const row = await requireRecord(id, recordId);
      return { fileName: `${namespace}-${id}-${recordId}.json`, content: JSON.stringify(row, null, 2), mimeType: 'application/json' };
    }),
  };
}
