/** Display formatting shared by every zone. */
import { UI_CONFIG } from './ui.config.js';

const locale = () => document.documentElement.lang === 'ar' ? 'ar' : UI_CONFIG.locale;

export function formatNumber(value, options = {}) {
  return new Intl.NumberFormat(locale(), options).format(value);
}

export function formatCompact(value) {
  return formatNumber(value, { notation: 'compact', maximumFractionDigits: 1 });
}

export function formatPercent(value, digits = 1) {
  return formatNumber(value, { style: 'percent', maximumFractionDigits: digits });
}

export function formatCurrency(value, currency = 'USD') {
  return formatNumber(value, { style: 'currency', currency, maximumFractionDigits: 0 });
}

/** 840 -> "840 ms", 1055 -> "1,055 ms", 95000 -> "1 min 35 s" (receipts count milliseconds) */
export function formatDuration(ms) {
  if (ms === null || ms === undefined) return '';
  if (ms < 60000) return `${formatNumber(Math.round(ms))} ms`;
  const min = Math.floor(ms / 60000);
  const sec = Math.round((ms % 60000) / 1000);
  if (min < 60) return sec ? `${min} min ${sec} s` : `${min} min`;
  const hours = Math.floor(min / 60);
  return `${hours} h ${min % 60} min`;
}

export function formatDateTime(iso, options = { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) {
  if (!iso) return '';
  return new Intl.DateTimeFormat(locale(), options).format(new Date(iso));
}

export function formatTime(iso) {
  return formatDateTime(iso, { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

const RELATIVE_STEPS = [
  ['year', 31536000], ['month', 2592000], ['week', 604800], ['day', 86400], ['hour', 3600], ['minute', 60], ['second', 1],
];

/** ISO date -> "3 min ago" / "in 2 h" */
export function formatRelative(iso, now = Date.now()) {
  if (!iso) return '';
  const diff = (new Date(iso).getTime() - now) / 1000;
  const rtf = new Intl.RelativeTimeFormat(locale(), { numeric: 'auto', style: 'short' });
  for (const [unit, seconds] of RELATIVE_STEPS) {
    if (Math.abs(diff) >= seconds || unit === 'second') return rtf.format(Math.round(diff / seconds), unit);
  }
  return '';
}

/** Fill "{name}" placeholders from an object: template('Hi {who}', { who: 'Sam' }) */
export function template(text, values = {}) {
  return String(text ?? '').replace(/\{(\w+)\}/g, (_, key) => (values[key] ?? `{${key}}`));
}

export function pluralize(count, one, many) {
  return `${formatNumber(count)} ${count === 1 ? one : many}`;
}
