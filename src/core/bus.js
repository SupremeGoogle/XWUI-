/**
 * Application event bus. Pages and layouts talk through it instead of importing each other.
 * Known events are listed in BUS_EVENTS so nothing relies on ad-hoc strings.
 */
export const BUS_EVENTS = Object.freeze({
  ROUTE_CHANGED: 'route:changed',
  FLOW_CHANGED: 'flow:changed',
  FLOW_PUBLISHED: 'flow:published',
  RUN_STARTED: 'run:started',
  RUN_FINISHED: 'run:finished',
  LOCALE_CHANGED: 'locale:changed',
  DATA_RESET: 'data:reset',
});

export function createBus() {
  const handlers = new Map();
  return {
    on(event, handler) {
      if (!handlers.has(event)) handlers.set(event, new Set());
      handlers.get(event).add(handler);
      return () => this.off(event, handler);
    },
    off(event, handler) {
      handlers.get(event)?.delete(handler);
    },
    emit(event, payload) {
      handlers.get(event)?.forEach((handler) => {
        try {
          handler(payload);
        } catch (error) {
          console.error(`[bus] ${event} handler failed`, error);
        }
      });
    },
  };
}

export const bus = createBus();
