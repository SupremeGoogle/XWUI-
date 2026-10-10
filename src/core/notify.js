/**
 * Toasts through XWUIOverlayToast (one shared toaster for the whole app).
 */
import { XWUIOverlayToast } from '@exonware/xwui/basic';
import { UI_CONFIG } from './ui.config.js';

let toaster = null;

function ensureToaster() {
  if (toaster) return toaster;
  const host = document.createElement('div');
  host.className = 'xw-toaster';
  document.body.append(host);
  toaster = new XWUIOverlayToast(host, {
    position: UI_CONFIG.toast.position,
    maxToasts: UI_CONFIG.toast.max,
  });
  return toaster;
}

function show(variant, message, options = {}) {
  ensureToaster().show({
    variant,
    title: options.title,
    message,
    duration: options.duration ?? UI_CONFIG.toast.duration,
    closable: true,
    action: options.action,
  });
}

export const notify = {
  success: (message, options) => show('success', message, options),
  error: (message, options) => show('error', message, options),
  info: (message, options) => show('info', message, options),
  warning: (message, options) => show('warning', message, options),
  /** Show an ApiError (or any Error) consistently. */
  fromError(error, fallback = UI_CONFIG.messages.genericError) {
    show('error', error?.message || fallback);
  },
};
