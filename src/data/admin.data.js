import { adminShellData } from './admin/shell.data.js';
import { adminOverviewData } from './admin/overview.data.js';
import { adminBrandingData } from './admin/branding.data.js';
import { adminAuditData } from './admin/audit.data.js';
import { adminHealthData } from './admin/health.data.js';

export const adminData = {
  ...adminShellData,
  ...adminOverviewData,
  ...adminBrandingData,
  ...adminAuditData,
  ...adminHealthData,
};

export const ADMIN_RULES = Object.freeze({
  failureRate: 0.05,
  auditReferenceTime: '2026-10-09T12:10:00+02:00',
  dayMs: 86400000,
  uploadMaxBytes: 1048576,
  uploadMime: [
    'image/png',
    'image/jpeg',
    'image/webp',
    'image/gif',
    'image/svg+xml',
    'image/x-icon',
    'image/vnd.microsoft.icon',
  ],
  hexPattern: /^#[0-9a-f]{6}$/i,
  domainPattern:
    /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i,
  contrastAA: 4.5,
  darkText: '#0a0a0a',
  whiteText: '#ffffff',
});
