/**
 * Dummy backend primitives.
 * Every API module in src/api builds on these: simulated latency, deep-cloned responses
 * (so UI code can never mutate the "server" state), occasional failures, pagination and
 * small persistent collections (in memory, mirrored to localStorage).
 */
import { MOCK_CONFIG } from './mock.config.js';

export class ApiError extends Error {
  /**
   * @param {string} code machine readable code, e.g. 'not_found', 'conflict', 'unavailable'
   * @param {string} message human readable message (shown in toasts)
   * @param {object} [details]
   */
  constructor(code, message, details = {}) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.details = details;
  }
}

const rand = (min, max) => min + Math.random() * (max - min);

/** Resolve after a random delay inside [min, max] ms (zero when latency is disabled). */
export function delay(min = MOCK_CONFIG.latency.min, max = MOCK_CONFIG.latency.max) {
  const ms = MOCK_CONFIG.enabled ? rand(min, max) : 0;
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function clone(value) {
  return value === undefined ? value : structuredClone(value);
}

/**
 * Run a producer as if it were a server call.
 * @template T
 * @param {() => T | Promise<T>} producer
 * @param {{ latency?: [number, number], failRate?: number, failWith?: ApiError }} [options]
 * @returns {Promise<T>}
 */
export async function respond(producer, { latency, failRate = 0, failWith } = {}) {
  const [min, max] = latency ?? [MOCK_CONFIG.latency.min, MOCK_CONFIG.latency.max];
  await delay(min, max);
  if (MOCK_CONFIG.enabled && failRate > 0 && Math.random() < failRate * MOCK_CONFIG.failureMultiplier) {
    throw failWith ?? new ApiError('unavailable', MOCK_CONFIG.messages.transient);
  }
  return clone(await producer());
}

/**
 * Slice a list into a page.
 * @returns {{ items: any[], total: number, page: number, pageSize: number, pages: number }}
 */
export function paginate(list, { page = 1, pageSize = 20 } = {}) {
  const total = list.length;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(Math.max(1, page), pages);
  const start = (current - 1) * pageSize;
  return { items: list.slice(start, start + pageSize), total, page: current, pageSize, pages };
}

/** Case-insensitive match of a query against several fields of a record. */
export function matches(record, query, fields) {
  if (!query) return true;
  const q = String(query).trim().toLowerCase();
  return fields.some((f) => String(record[f] ?? '').toLowerCase().includes(q));
}

export function sortBy(list, key, direction = 'asc') {
  const dir = direction === 'desc' ? -1 : 1;
  return [...list].sort((a, b) => (a[key] > b[key] ? dir : a[key] < b[key] ? -dir : 0));
}

let idCounter = 0;
export function newId(prefix) {
  idCounter += 1;
  return `${prefix}_${Date.now().toString(36)}${idCounter.toString(36)}`;
}

export const nowIso = () => new Date().toISOString();

const storageKey = (name) => `${MOCK_CONFIG.storagePrefix}${MOCK_CONFIG.schemaVersion}:${name}`;

function readStorage(name) {
  try {
    const raw = localStorage.getItem(storageKey(name));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeStorage(name, value) {
  try {
    localStorage.setItem(storageKey(name), JSON.stringify(value));
  } catch {
    /* storage may be unavailable (private mode); the collection keeps working in memory */
  }
}

/**
 * A tiny table. Records need an `id` (one is generated when missing).
 * @template T
 * @param {string} name storage name
 * @param {T[]} seed initial records
 * @param {{ persist?: boolean, idPrefix?: string }} [options]
 */
export function createCollection(name, seed, { persist = true, idPrefix = name } = {}) {
  let rows = (persist && readStorage(name)) || clone(seed);
  const save = () => persist && writeStorage(name, rows);

  return {
    name,
    /** @returns {T[]} live rows (internal use by API modules only; respond() clones) */
    all: () => rows,
    list: (filter) => (filter ? rows.filter(filter) : rows),
    get: (id) => rows.find((r) => r.id === id) ?? null,
    require(id) {
      const row = rows.find((r) => r.id === id);
      if (!row) throw new ApiError('not_found', `${name}: ${id} was not found`, { id });
      return row;
    },
    create(record) {
      const row = { id: record.id ?? newId(idPrefix), ...record };
      rows = [row, ...rows];
      save();
      return row;
    },
    update(id, patch) {
      const row = this.require(id);
      Object.assign(row, typeof patch === 'function' ? patch(row) : patch);
      save();
      return row;
    },
    remove(id) {
      const before = rows.length;
      rows = rows.filter((r) => r.id !== id);
      save();
      return rows.length !== before;
    },
    replaceAll(next) {
      rows = next;
      save();
    },
    reset() {
      rows = clone(seed);
      save();
    },
  };
}

/** A single persistent document (settings, brand kit...). */
export function createDocument(name, seed, { persist = true } = {}) {
  let doc = (persist && readStorage(name)) || clone(seed);
  const save = () => persist && writeStorage(name, doc);
  return {
    get: () => doc,
    set(next) {
      doc = next;
      save();
      return doc;
    },
    patch(partial) {
      doc = { ...doc, ...partial };
      save();
      return doc;
    },
    reset() {
      doc = clone(seed);
      save();
    },
  };
}

/** Wipe every persisted collection (used by the "Reset demo data" action). */
export function resetAllStorage() {
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith(MOCK_CONFIG.storagePrefix))
      .forEach((k) => localStorage.removeItem(k));
  } catch {
    /* ignore */
  }
}
